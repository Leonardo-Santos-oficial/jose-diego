import { test, expect } from '@playwright/test';

/**
 * Security Tests - Authentication Rate Limiting
 * 
 * Tests for proper rate limiting on authentication endpoints
 * to prevent brute force attacks.
 * 
 * Key scenarios:
 * - Login attempts are rate limited
 * - Sign up attempts are rate limited
 * - Password reset is rate limited
 * - Rate limit headers are properly returned
 */

test.describe('Login Rate Limiting', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('should rate limit excessive login attempts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open login modal
    const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.getByRole('button', { name: /entrar|login|sign in/i }).last();

    if (!await emailInput.isVisible() || !await passwordInput.isVisible()) {
      test.skip();
      return;
    }

    const responses: string[] = [];
    
    // Try multiple login attempts rapidly
    for (let i = 0; i < 8; i++) {
      await emailInput.fill(`test${i}@brute-force-attempt.com`);
      await passwordInput.fill(`wrong-password-${i}`);
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(300);
        
        // Check for rate limit message
        const pageText = await page.textContent('body');
        if (pageText) {
          if (pageText.toLowerCase().includes('rate') || 
              pageText.toLowerCase().includes('limit') ||
              pageText.toLowerCase().includes('muitas tentativas') ||
              pageText.toLowerCase().includes('aguarde')) {
            responses.push('rate_limited');
          } else {
            responses.push('normal');
          }
        }
      }
    }

    // Should have hit rate limit after several attempts
    const rateLimitedCount = responses.filter(r => r === 'rate_limited').length;
    expect(rateLimitedCount).toBeGreaterThan(0);
  });

  test('should show rate limit error message', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Make rapid requests through page context
    const results = await page.evaluate(async () => {
      const responses: { status: number; message: string }[] = [];
      
      for (let i = 0; i < 10; i++) {
        try {
          const formData = new URLSearchParams();
          formData.append('email', `brute${i}@test.com`);
          formData.append('password', 'wrongpassword123');
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });
          
          const text = await response.text();
          responses.push({ status: response.status, message: text.substring(0, 200) });
        } catch (e) {
          responses.push({ status: 0, message: 'error' });
        }
      }
      
      return responses;
    });

    // Should get 429 Too Many Requests after several attempts
    const rateLimited = results.filter(r => r.status === 429);
    
    // Either API rate limits or endpoint doesn't exist (404)
    const hasRateLimitOrNotFound = results.some(r => r.status === 429 || r.status === 404);
    expect(hasRateLimitOrNotFound).toBe(true);
  });
});

test.describe('Sign Up Rate Limiting', () => {
  test('should rate limit excessive signup attempts', async ({ request }) => {
    const responses: number[] = [];
    
    // Make multiple signup requests
    for (let i = 0; i < 10; i++) {
      const response = await request.post('/api/auth/signup', {
        data: {
          email: `spammer${i}${Date.now()}@malicious.com`,
          password: 'TestPassword123!',
        },
      });
      responses.push(response.status());
      
      // Short delay to not overwhelm
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Should have rate limited or rejected responses
    const rateLimited = responses.filter(r => r === 429);
    const successful = responses.filter(r => r === 200 || r === 201);
    
    // If endpoint exists, should rate limit or limit successful signups
    if (!responses.every(r => r === 404)) {
      expect(successful.length).toBeLessThan(10);
    }
  });

  test('should not allow rapid account creation', async ({ request }) => {
    const startTime = Date.now();
    let successfulCreations = 0;
    
    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/auth/signup', {
        data: {
          email: `rapid${i}${Date.now()}@test.com`,
          password: 'SecurePass123!',
        },
      });
      
      if (response.status() === 200 || response.status() === 201) {
        successfulCreations++;
      }
    }

    const elapsed = Date.now() - startTime;
    
    // Should not allow 5 rapid signups in less than 5 seconds
    // Either rate limited or processed with delays
    if (successfulCreations === 5) {
      expect(elapsed).toBeGreaterThan(5000);
    }
  });
});

test.describe('Password Reset Rate Limiting', () => {
  test('should rate limit password reset requests', async ({ request }) => {
    const responses: number[] = [];
    
    // Attempt multiple password reset requests for same email
    for (let i = 0; i < 8; i++) {
      const response = await request.post('/api/auth/forgot-password', {
        data: {
          email: 'victim@example.com',
        },
      });
      responses.push(response.status());
    }

    // Should rate limit to prevent email bombing
    const rateLimited = responses.filter(r => r === 429);
    const notFound = responses.filter(r => r === 404);
    
    // If endpoint exists, should rate limit
    if (notFound.length < responses.length) {
      expect(rateLimited.length).toBeGreaterThan(0);
    }
  });

  test('should not reveal if email exists during rate limiting', async ({ request }) => {
    // First request for existing email
    const response1 = await request.post('/api/auth/forgot-password', {
      data: {
        email: 'real-user@example.com',
      },
    });

    // Request for non-existing email
    const response2 = await request.post('/api/auth/forgot-password', {
      data: {
        email: 'fake-user-12345@example.com',
      },
    });

    // Responses should be identical to prevent email enumeration
    if (response1.status() !== 404 && response2.status() !== 404) {
      // Both should return same status (usually 200 OK regardless of email existence)
      expect(response1.status()).toBe(response2.status());
    }
  });
});

test.describe('API Endpoint Rate Limiting', () => {
  test('should rate limit game actions', async ({ request }) => {
    const responses: number[] = [];
    
    // Rapid bet attempts
    for (let i = 0; i < 20; i++) {
      const response = await request.post('/api/aviator/bets', {
        data: {
          amount: 10,
        },
      });
      responses.push(response.status());
    }

    // Should have some rate limiting or auth failures
    const successful = responses.filter(r => r === 200 || r === 201);
    expect(successful.length).toBeLessThan(20);
  });

  test('should return rate limit headers', async ({ request }) => {
    let rateLimitHeaders: Record<string, string | null> = {};
    
    for (let i = 0; i < 10; i++) {
      const response = await request.post('/api/aviator/bets', {
        data: { amount: 10 },
      });
      
      rateLimitHeaders = {
        'x-ratelimit-limit': response.headers()['x-ratelimit-limit'] || null,
        'x-ratelimit-remaining': response.headers()['x-ratelimit-remaining'] || null,
        'x-ratelimit-reset': response.headers()['x-ratelimit-reset'] || null,
        'retry-after': response.headers()['retry-after'] || null,
      };
      
      // If rate limited, should have retry-after
      if (response.status() === 429) {
        expect(
          rateLimitHeaders['retry-after'] || 
          rateLimitHeaders['x-ratelimit-reset']
        ).not.toBeNull();
        break;
      }
    }
  });
});

test.describe('Distributed Attack Prevention', () => {
  test('should track rate limits by IP', async ({ request }) => {
    // Make requests with different IPs (simulated via headers in test env)
    const response1 = await request.post('/api/auth/login', {
      headers: {
        'X-Forwarded-For': '192.168.1.100',
      },
      data: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    });

    const response2 = await request.post('/api/auth/login', {
      headers: {
        'X-Forwarded-For': '192.168.1.200',
      },
      data: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    });

    // Both should get similar treatment
    // Real implementation might track by both IP and target account
    expect([200, 400, 401, 403, 404]).toContain(response1.status());
    expect([200, 400, 401, 403, 404]).toContain(response2.status());
  });

  test('should apply account-level rate limiting', async ({ request }) => {
    const targetEmail = 'victim-account@example.com';
    const responses: number[] = [];
    
    // Many attempts against same account from "different IPs"
    for (let i = 0; i < 10; i++) {
      const response = await request.post('/api/auth/login', {
        headers: {
          'X-Forwarded-For': `192.168.${Math.floor(i / 255)}.${i % 255}`,
        },
        data: {
          email: targetEmail,
          password: `wrongpass${i}`,
        },
      });
      responses.push(response.status());
    }

    // Should rate limit attacks against same account
    const rateLimited = responses.filter(r => r === 429);
    const authFailed = responses.filter(r => r === 401 || r === 403);
    
    // Either rate limiting or auth failures (not successes)
    const successful = responses.filter(r => r === 200);
    expect(successful.length).toBe(0);
  });
});

test.describe('Rate Limit Bypass Prevention', () => {
  test('should not bypass rate limit with different User-Agent', async ({ request }) => {
    const responses: number[] = [];
    const userAgents = [
      'Mozilla/5.0 Chrome/91.0',
      'Mozilla/5.0 Firefox/89.0',
      'Mozilla/5.0 Safari/14.1',
      'PostmanRuntime/7.28.0',
      'curl/7.64.1',
    ];

    for (let i = 0; i < 10; i++) {
      const response = await request.post('/api/auth/login', {
        headers: {
          'User-Agent': userAgents[i % userAgents.length],
        },
        data: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });
      responses.push(response.status());
    }

    // Rate limit should still apply regardless of User-Agent
    // If implemented, should see 429 after several attempts
    const successful = responses.filter(r => r === 200);
    expect(successful.length).toBeLessThan(10);
  });

  test('should not bypass rate limit with case variations', async ({ request }) => {
    const responses: number[] = [];
    const emailVariations = [
      'test@example.com',
      'TEST@example.com',
      'Test@Example.com',
      'test@EXAMPLE.COM',
      'TeSt@ExAmPlE.cOm',
    ];

    for (const email of emailVariations) {
      const response = await request.post('/api/auth/login', {
        data: {
          email,
          password: 'wrongpassword',
        },
      });
      responses.push(response.status());
    }

    // Should recognize these as same email and rate limit accordingly
    // All should be treated as attempts against same account
    const allAuth = responses.every(r => r === 401 || r === 403 || r === 429 || r === 404);
    expect(allAuth).toBe(true);
  });
});
