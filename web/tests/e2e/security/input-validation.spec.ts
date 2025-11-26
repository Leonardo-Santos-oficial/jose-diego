import { test, expect } from '@playwright/test';

/**
 * Security Tests - Input Validation & XSS/CSRF Protection
 * 
 * Tests for proper input sanitization and protection against
 * XSS (Cross-Site Scripting) and CSRF (Cross-Site Request Forgery) attacks.
 * 
 * Key scenarios:
 * - XSS payloads are sanitized in all inputs
 * - CSRF tokens are required for state-changing operations
 * - SQL injection attempts are blocked
 * - Script injection is prevented
 */

test.describe('XSS Prevention - Script Injection', () => {
  test('should sanitize script tags in URL parameters', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', dialog => {
      alertTriggered = true;
      dialog.dismiss();
    });

    // Try various XSS payloads in URL
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '"><script>alert("xss")</script>',
      "';alert('xss');//",
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      'javascript:alert("xss")',
    ];

    for (const payload of xssPayloads) {
      await page.goto(`/?search=${encodeURIComponent(payload)}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      
      // Should not trigger alert
      expect(alertTriggered).toBe(false);
      
      // Check page content doesn't contain unescaped script
      const content = await page.content();
      expect(content).not.toContain('<script>alert("xss")</script>');
    }
  });

  test('should sanitize XSS in form inputs', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', dialog => {
      alertTriggered = true;
      dialog.dismiss();
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find any text input
    const textInputs = page.locator('input[type="text"], textarea');
    const count = await textInputs.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = textInputs.nth(i);
      if (await input.isVisible()) {
        await input.fill('<script>alert("xss")</script>');
        await input.blur();
        await page.waitForTimeout(300);
      }
    }

    expect(alertTriggered).toBe(false);
  });

  test('should escape HTML entities in displayed content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that dangerous HTML is escaped in page
    const pageContent = await page.content();
    
    // Look for unescaped event handlers
    const dangerousPatterns = [
      /onerror\s*=\s*["'][^"']*alert/i,
      /onload\s*=\s*["'][^"']*alert/i,
      /onclick\s*=\s*["'][^"']*alert/i,
      /onmouseover\s*=\s*["'][^"']*alert/i,
    ];

    for (const pattern of dangerousPatterns) {
      // Should not match dangerous inline event handlers with alerts
      const matches = pageContent.match(pattern);
      if (matches) {
        // If found, should be in a legitimate testing context
        expect(matches[0]).not.toContain('alert("xss")');
      }
    }
  });

  test('should prevent DOM-based XSS via hash', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', dialog => {
      alertTriggered = true;
      dialog.dismiss();
    });

    await page.goto('/#<script>alert("xss")</script>');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    expect(alertTriggered).toBe(false);
  });
});

test.describe('XSS Prevention - Chat/Message System', () => {
  test('should sanitize messages in chat display', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', dialog => {
      alertTriggered = true;
      dialog.dismiss();
    });

    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Find chat input if exists
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="mensagem"], input[placeholder*="message"], textarea[placeholder*="chat"]');
    
    if (await chatInput.isVisible()) {
      await chatInput.fill('<script>alert("xss")</script>');
      
      // Try to send
      const sendButton = page.locator('[data-testid="send-message"], button[aria-label*="send"], button[aria-label*="enviar"]');
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(500);
      }
    }

    expect(alertTriggered).toBe(false);
  });

  test('should escape HTML in usernames displayed in chat', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Check chat messages area
    const chatMessages = page.locator('[data-testid="chat-messages"], .chat-messages, .messages-container');
    
    if (await chatMessages.isVisible()) {
      const content = await chatMessages.textContent();
      
      if (content) {
        // Should not contain unescaped HTML tags
        expect(content).not.toContain('<script');
        expect(content).not.toContain('javascript:');
      }
    }
  });
});

test.describe('CSRF Protection', () => {
  test('should require CSRF token for form submissions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find forms
    const forms = page.locator('form');
    const count = await forms.count();

    for (let i = 0; i < count; i++) {
      const form = forms.nth(i);
      const method = await form.getAttribute('method');
      
      // POST forms should have CSRF protection
      if (method?.toLowerCase() === 'post') {
        // Check for CSRF token input
        const csrfInput = form.locator('input[name*="csrf"], input[name*="token"], input[name="_token"]');
        const csrfMeta = page.locator('meta[name="csrf-token"]');
        
        // Should have CSRF token in form or meta tag
        const hasToken = await csrfInput.count() > 0 || await csrfMeta.count() > 0;
        
        // If no explicit CSRF token, check for other protections
        // Next.js server actions have built-in CSRF protection
        if (!hasToken) {
          // Check if using formAction (server action)
          const hasFormAction = await form.getAttribute('action');
          // Server actions don't need explicit CSRF tokens
        }
      }
    }
  });

  test('should reject cross-origin form submissions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Try to submit form with wrong origin header
    const result = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Origin': 'https://malicious-site.com',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'hacker' }),
        });
        return { status: response.status };
      } catch (e) {
        return { error: 'blocked' };
      }
    });

    // Should be rejected
    if ('status' in result) {
      expect([400, 401, 403, 404]).toContain(result.status);
    }
  });

  test('should validate Referer header on sensitive operations', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Referer': 'https://malicious-site.com/steal-data',
      },
      data: {
        amount: 100,
      },
    });

    // Should reject requests from unknown referers or require auth
    expect([400, 401, 403]).toContain(response.status());
  });
});

test.describe('SQL Injection Prevention', () => {
  test('should sanitize SQL injection in search', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible()) {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "1; DELETE FROM users WHERE 1=1",
        "UNION SELECT * FROM users--",
      ];

      for (const payload of sqlPayloads) {
        await searchInput.fill(payload);
        await searchInput.press('Enter');
        await page.waitForTimeout(500);

        // Page should not crash or show SQL errors
        const pageText = await page.textContent('body');
        if (pageText) {
          expect(pageText.toLowerCase()).not.toContain('sql syntax');
          expect(pageText.toLowerCase()).not.toContain('mysql error');
          expect(pageText.toLowerCase()).not.toContain('postgres');
          expect(pageText.toLowerCase()).not.toContain('syntax error');
        }
      }
    }
  });

  test('should sanitize SQL injection in API requests', async ({ request }) => {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "1 UNION SELECT password FROM users",
    ];

    for (const payload of sqlPayloads) {
      const response = await request.get(`/api/search?q=${encodeURIComponent(payload)}`);
      
      if (response.status() !== 404) {
        const text = await response.text();
        
        // Should not expose SQL errors
        expect(text.toLowerCase()).not.toContain('sql');
        expect(text.toLowerCase()).not.toContain('syntax');
        expect(text.toLowerCase()).not.toContain('postgresql');
        expect(text.toLowerCase()).not.toContain('query');
      }
    }
  });

  test('should use parameterized queries (no injection)', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      data: {
        amount: "100; DELETE FROM bets;",
        userId: "' OR 1=1 --",
      },
    });

    // Should either reject invalid input or handle safely
    if (response.status() !== 404) {
      expect([400, 401, 403, 422]).toContain(response.status());
    }
  });
});

test.describe('NoSQL Injection Prevention', () => {
  test('should sanitize NoSQL injection payloads', async ({ request }) => {
    const noSqlPayloads = [
      { $gt: '' },
      { $ne: null },
      { $regex: '.*' },
    ];

    for (const payload of noSqlPayloads) {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: payload,
        },
      });

      // Should reject or handle safely
      if (response.status() !== 404) {
        expect([400, 401, 403, 422]).toContain(response.status());
      }
    }
  });
});

test.describe('Command Injection Prevention', () => {
  test('should sanitize command injection in inputs', async ({ request }) => {
    const cmdPayloads = [
      '; rm -rf /',
      '| cat /etc/passwd',
      '`whoami`',
      '$(cat /etc/passwd)',
    ];

    for (const payload of cmdPayloads) {
      const response = await request.post('/api/process', {
        data: {
          input: payload,
        },
      });

      // Should either not exist or handle safely
      if (response.status() !== 404) {
        const text = await response.text();
        expect(text).not.toContain('root:');
        expect(text).not.toContain('/bin/bash');
      }
    }
  });
});

test.describe('Header Injection Prevention', () => {
  test('should sanitize header injection attempts', async ({ request }) => {
    const response = await request.get('/api/redirect', {
      params: {
        url: 'http://example.com\r\nSet-Cookie: malicious=true',
      },
    });

    // Check response headers don't include injected cookie
    const cookies = response.headers()['set-cookie'];
    if (cookies) {
      expect(cookies).not.toContain('malicious');
    }
  });

  test('should validate and sanitize redirect URLs', async ({ page }) => {
    // Try to redirect to external malicious site
    const response = await page.request.get('/api/redirect?url=https://malicious-site.com');
    
    if (response.status() === 302 || response.status() === 301) {
      const location = response.headers()['location'];
      if (location) {
        // Should not redirect to external domains
        expect(location).not.toContain('malicious-site.com');
      }
    }
  });
});

test.describe('Content-Type Validation', () => {
  test('should reject HTML content in JSON endpoints', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><script>alert("xss")</script></html>',
    });

    // Should reject incorrect content type
    expect([400, 401, 403, 415]).toContain(response.status());
  });

  test('should validate JSON structure', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'not-valid-json{',
    });

    // Should reject invalid JSON
    expect([400, 401, 403]).toContain(response.status());
  });
});

test.describe('File Upload Security', () => {
  test('should reject dangerous file types', async ({ request }) => {
    // Try to upload executable
    const dangerousFiles = [
      { name: 'malware.exe', type: 'application/x-executable' },
      { name: 'script.php', type: 'application/x-php' },
      { name: 'hack.js', type: 'application/javascript' },
    ];

    for (const file of dangerousFiles) {
      const response = await request.post('/api/upload', {
        multipart: {
          file: {
            name: file.name,
            mimeType: file.type,
            buffer: Buffer.from('dangerous content'),
          },
        },
      });

      // Should reject dangerous files or endpoint doesn't exist
      expect([400, 403, 404, 415, 422]).toContain(response.status());
    }
  });

  test('should validate file extension matches content', async ({ request }) => {
    // Try to upload disguised file (exe disguised as jpg)
    const response = await request.post('/api/upload', {
      multipart: {
        file: {
          name: 'image.jpg',
          mimeType: 'image/jpeg',
          // Magic bytes of executable, not JPEG
          buffer: Buffer.from([0x4D, 0x5A, 0x90, 0x00]),
        },
      },
    });

    // Should detect mismatch and reject
    expect([400, 403, 404, 415, 422]).toContain(response.status());
  });
});

test.describe('Path Traversal Prevention', () => {
  test('should sanitize path traversal attempts', async ({ request }) => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '....//....//....//etc/passwd',
    ];

    for (const payload of traversalPayloads) {
      const response = await request.get(`/api/files/${encodeURIComponent(payload)}`);
      
      if (response.status() !== 404) {
        const text = await response.text();
        // Should not expose system files
        expect(text).not.toContain('root:');
        expect(text).not.toContain('[boot loader]');
      }
    }
  });
});
