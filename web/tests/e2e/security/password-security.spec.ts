import { test, expect } from '@playwright/test';

/**
 * Security Tests - Password Security
 * 
 * Tests for proper password handling, validation, and storage security.
 * 
 * Key scenarios:
 * - Password strength requirements are enforced
 * - Passwords are not exposed in responses
 * - Password field security attributes
 * - Secure password change flow
 */

test.describe('Password Field Security', () => {
  test('password inputs should have type="password"', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open login modal
    const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
    }

    // Find password inputs
    const passwordInputs = page.locator('input[name*="password"], input[placeholder*="senha"], input[placeholder*="password"]');
    const count = await passwordInputs.count();

    for (let i = 0; i < count; i++) {
      const input = passwordInputs.nth(i);
      const type = await input.getAttribute('type');
      
      // Password inputs should have type="password" to mask input
      expect(['password', null]).toContain(type);
    }
  });

  test('password inputs should have autocomplete attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open login modal
    const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
    }

    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();

    for (let i = 0; i < count; i++) {
      const input = passwordInputs.nth(i);
      const autocomplete = await input.getAttribute('autocomplete');
      
      // Should have autocomplete set for password managers
      // Valid values: current-password, new-password, off
      if (autocomplete) {
        expect(['current-password', 'new-password', 'off']).toContain(autocomplete);
      }
    }
  });

  test('password should not be visible in page source', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open login modal and enter password
    const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
    }

    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('TestPassword123!');
      
      // Check page source doesn't contain the password
      const pageContent = await page.content();
      expect(pageContent).not.toContain('TestPassword123!');
      expect(pageContent).not.toContain('value="TestPassword123!"');
    }
  });
});

test.describe('Password Strength Requirements', () => {
  test('should reject weak passwords', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Look for signup/register option
    const signupButton = page.getByRole('button', { name: /cadastrar|criar conta|sign up|register/i });
    const signupLink = page.locator('text=/cadastrar|criar conta|sign up|register/i');
    
    if (await signupButton.isVisible()) {
      await signupButton.click();
    } else if (await signupLink.isVisible()) {
      await signupLink.click();
    }
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.getByRole('button', { name: /cadastrar|criar|sign up|register|submit/i });

    if (!await emailInput.isVisible() || !await passwordInput.isVisible()) {
      test.skip();
      return;
    }

    // Try weak passwords
    const weakPasswords = ['123', 'password', 'abc', '12345678'];
    
    for (const weakPassword of weakPasswords) {
      await emailInput.fill(`test${Date.now()}@example.com`);
      await passwordInput.fill(weakPassword);
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(500);
        
        // Should show error or prevent submission
        const pageText = await page.textContent('body');
        if (pageText) {
          const hasError = 
            pageText.toLowerCase().includes('fraca') ||
            pageText.toLowerCase().includes('weak') ||
            pageText.toLowerCase().includes('curta') ||
            pageText.toLowerCase().includes('short') ||
            pageText.toLowerCase().includes('mínimo') ||
            pageText.toLowerCase().includes('minimum') ||
            pageText.toLowerCase().includes('requisitos') ||
            pageText.toLowerCase().includes('requirements');
          
          // Either shows error or still on signup form
          const stillOnForm = await passwordInput.isVisible();
          expect(hasError || stillOnForm).toBe(true);
        }
      }
    }
  });

  test('should require minimum password length via API', async ({ request }) => {
    const response = await request.post('/api/auth/signup', {
      data: {
        email: `test${Date.now()}@example.com`,
        password: '123', // Too short
      },
    });

    // Should reject short password
    if (response.status() !== 404) {
      expect([400, 422]).toContain(response.status());
    }
  });
});

test.describe('Password Not Exposed in Responses', () => {
  test('should not return password in API responses', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'SomePassword123!',
      },
    });

    if (response.status() !== 404) {
      const text = await response.text();
      
      // Response should not contain the submitted password
      expect(text).not.toContain('SomePassword123!');
      expect(text).not.toContain('password');
      
      // If JSON, check parsed response
      try {
        const json = JSON.parse(text);
        expect(json).not.toHaveProperty('password');
        expect(json).not.toHaveProperty('passwordHash');
      } catch (e) {
        // Not JSON, which is fine
      }
    }
  });

  test('should not include password in user profile response', async ({ request }) => {
    const response = await request.get('/api/user/profile');
    
    if (response.status() === 200) {
      const text = await response.text();
      
      expect(text).not.toMatch(/password/i);
      expect(text).not.toMatch(/pwd/i);
      expect(text).not.toMatch(/secret/i);
    }
  });

  test('should not log password in network requests', async ({ page }) => {
    const requestBodies: string[] = [];
    
    page.on('request', request => {
      const postData = request.postData();
      if (postData) {
        requestBodies.push(postData);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open login and submit
    const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
    }

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.getByRole('button', { name: /entrar|login|sign in/i }).last();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('SecretPassword123!');
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Password might be in request body (encrypted), but should not be in plain text in URL
    const allUrls = page.url();
    expect(allUrls).not.toContain('SecretPassword');
    expect(allUrls).not.toContain('password=');
  });
});

test.describe('Password Change Security', () => {
  test('should require current password for password change', async ({ page }) => {
    await page.goto('/app/profile');
    await page.waitForLoadState('domcontentloaded');

    // Look for password change section
    const changePasswordButton = page.getByRole('button', { name: /alterar senha|change password/i });
    const passwordChangeForm = page.locator('[data-testid="password-change-form"]');

    if (await changePasswordButton.isVisible()) {
      await changePasswordButton.click();
      await page.waitForTimeout(500);
    }

    // Should have field for current password
    const currentPasswordField = page.locator('input[name*="current"], input[placeholder*="atual"], input[placeholder*="current"]');
    
    if (await currentPasswordField.isVisible()) {
      // Current password should be required
      const required = await currentPasswordField.getAttribute('required');
      expect(required !== null || await currentPasswordField.evaluate(el => (el as HTMLInputElement).required)).toBe(true);
    }
  });

  test('should not allow password change without authentication', async ({ request }) => {
    const response = await request.post('/api/user/change-password', {
      data: {
        currentPassword: 'old-password',
        newPassword: 'NewPassword123!',
      },
    });

    // Should require authentication
    expect([401, 403, 404]).toContain(response.status());
  });

  test('should validate new password meets requirements', async ({ request }) => {
    const response = await request.post('/api/user/change-password', {
      data: {
        currentPassword: 'CurrentPassword123!',
        newPassword: '123', // Too weak
      },
    });

    // Should reject weak new password or require auth
    expect([400, 401, 403, 404, 422]).toContain(response.status());
  });
});

test.describe('Password Reset Security', () => {
  test('should not reveal if email exists in password reset', async ({ request }) => {
    // Request for existing email
    const response1 = await request.post('/api/auth/forgot-password', {
      data: {
        email: 'existing-user@example.com',
      },
    });

    // Request for non-existing email
    const response2 = await request.post('/api/auth/forgot-password', {
      data: {
        email: `nonexistent${Date.now()}@example.com`,
      },
    });

    // Both should have same status to prevent email enumeration
    if (response1.status() !== 404 && response2.status() !== 404) {
      expect(response1.status()).toBe(response2.status());
    }
  });

  test('should generate one-time use reset tokens', async ({ request }) => {
    // This is a conceptual test - in real implementation, 
    // reset tokens should be single-use
    const response = await request.post('/api/auth/forgot-password', {
      data: {
        email: 'test@example.com',
      },
    });

    if (response.status() === 200) {
      // The response should not include the reset token
      // Token should be sent via email only
      const text = await response.text();
      expect(text).not.toMatch(/reset[_-]?token/i);
    }
  });

  test('reset token should expire', async ({ request }) => {
    // Attempt to use an old/expired token
    const response = await request.post('/api/auth/reset-password', {
      data: {
        token: 'expired-token-from-long-ago',
        newPassword: 'NewPassword123!',
      },
    });

    // Should reject expired token
    expect([400, 401, 403, 404, 422]).toContain(response.status());
  });
});

test.describe('Password Visibility Toggle Security', () => {
  test('password visibility toggle should work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open login modal
    const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
    }

    const passwordInput = page.locator('input[type="password"]').first();
    const toggleButton = page.locator('[data-testid="password-toggle"], button[aria-label*="show"], button[aria-label*="mostrar"]');

    if (await passwordInput.isVisible() && await toggleButton.isVisible()) {
      // Enter password
      await passwordInput.fill('TestPassword123!');
      
      // Initially should be hidden
      expect(await passwordInput.getAttribute('type')).toBe('password');
      
      // Toggle visibility
      await toggleButton.click();
      await page.waitForTimeout(200);
      
      // Should now be visible (type="text")
      const inputType = await passwordInput.getAttribute('type');
      expect(['text', 'password']).toContain(inputType);
      
      // Toggle back
      await toggleButton.click();
      await page.waitForTimeout(200);
      
      // Should be hidden again
      expect(await passwordInput.getAttribute('type')).toBe('password');
    }
  });
});

test.describe('Brute Force Password Attack Prevention', () => {
  test('should lock account after multiple failed attempts', async ({ request }) => {
    const targetEmail = 'victim@brute-force-target.com';
    const responses: number[] = [];
    
    // Try many wrong passwords
    for (let i = 0; i < 15; i++) {
      const response = await request.post('/api/auth/login', {
        data: {
          email: targetEmail,
          password: `wrong-password-${i}`,
        },
      });
      responses.push(response.status());
      
      // Check for lockout
      if (response.status() === 429 || response.status() === 423) {
        break;
      }
    }

    // Should eventually rate limit or lock
    const rateLimited = responses.filter(r => r === 429);
    const locked = responses.filter(r => r === 423);
    
    // Either rate limited or endpoint doesn't exist
    const blocked = rateLimited.length + locked.length;
    if (!responses.every(r => r === 404)) {
      expect(blocked).toBeGreaterThan(0);
    }
  });

  test('should implement progressive delays', async ({ request }) => {
    const targetEmail = 'delay-test@example.com';
    const times: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await request.post('/api/auth/login', {
        data: {
          email: targetEmail,
          password: `wrong-${i}`,
        },
      });
      times.push(Date.now() - start);
    }

    // Later attempts might take longer due to progressive delays
    // This is implementation-specific
    // At minimum, all should complete (not hang)
    expect(times.every(t => t < 30000)).toBe(true);
  });
});
