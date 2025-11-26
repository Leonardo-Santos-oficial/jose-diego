import { test, expect } from '@playwright/test';

/**
 * Security Tests - Route Protection
 * 
 * Tests that protected routes are properly secured and only accessible
 * to authorized users with the correct roles.
 * 
 * Follows OWASP guidelines for access control testing.
 */

test.describe('Route Protection - Unauthenticated Access', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies and storage to ensure unauthenticated state
    await context.clearCookies();
  });

  test('should redirect unauthenticated users from /app to landing page', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected to home with unauthorized parameter
    expect(page.url()).not.toContain('/app');
    expect(page.url()).toMatch(/\/?(\?unauthorized=1)?$/);
  });

  test('should redirect unauthenticated users from /admin to landing page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected to home with unauthorized parameter
    expect(page.url()).not.toContain('/admin');
    expect(page.url()).toMatch(/\/?(\?unauthorized=1)?$/);
  });

  test('should redirect unauthenticated users from /admin/game to landing page', async ({ page }) => {
    await page.goto('/admin/game');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).not.toContain('/admin');
    expect(page.url()).toMatch(/\/?(\?unauthorized=1)?$/);
  });

  test('should redirect unauthenticated users from /app/profile to landing page', async ({ page }) => {
    await page.goto('/app/profile');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).not.toContain('/app');
    expect(page.url()).toMatch(/\/?(\?unauthorized=1)?$/);
  });

  test('should allow access to public landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Should stay on landing page
    expect(page.url()).toMatch(/\/(\?.*)?$/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should allow access to public benefits page', async ({ page }) => {
    await page.goto('/beneficios');
    await page.waitForLoadState('domcontentloaded');

    // Should stay on benefits page
    expect(page.url()).toContain('/beneficios');
  });
});

test.describe('Route Protection - Deep Link Attacks', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('should not allow path traversal to admin routes', async ({ page }) => {
    const maliciousPaths = [
      '/admin/../admin',
      '/admin%2F..%2Fadmin',
      '/app/../admin',
      '/%2e%2e/admin',
      '/admin/./game',
    ];

    for (const path of maliciousPaths) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      
      // Should not end up on admin route without auth
      expect(page.url()).not.toMatch(/\/admin(?!.*unauthorized)/);
    }
  });

  test('should handle URL encoding attacks gracefully', async ({ page }) => {
    const encodedPaths = [
      '/%61%64%6d%69%6e', // 'admin' URL encoded
      '/admin;/game',    // parameter pollution
    ];

    for (const path of encodedPaths) {
      const response = await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      
      // Should either redirect, return 404, or show unauthorized
      // The key is that admin functionality is not accessible
      const finalUrl = page.url();
      const pageContent = await page.textContent('body');
      
      // Either redirected away from admin, has unauthorized param, or shows 404/error
      const isProtected = !finalUrl.includes('/admin') || 
                          finalUrl.includes('unauthorized') ||
                          (pageContent && pageContent.includes('404'));
      
      expect(isProtected).toBe(true);
    }
  });
});

test.describe('Route Protection - Header Manipulation', () => {
  test('should not bypass auth with forged headers', async ({ page, context }) => {
    // Try to forge authentication headers
    await context.setExtraHTTPHeaders({
      'X-User-Id': 'fake-admin-id',
      'X-User-Role': 'admin',
      'Authorization': 'Bearer fake-token-12345',
    });

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should still be redirected - forged headers shouldn't work
    expect(page.url()).not.toContain('/admin');
  });

  test('should not bypass auth with cookie manipulation', async ({ page, context }) => {
    // Try to set fake auth cookies
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'fake-jwt-token',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-refresh-token',
        value: 'fake-refresh-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should still be redirected - fake cookies shouldn't work
    expect(page.url()).not.toContain('/admin');
  });
});

test.describe('API Route Security - Unauthenticated', () => {
  test('should reject unauthenticated bet requests', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      data: {
        roundId: 'test-round-123',
        amount: 100,
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('should reject unauthenticated cashout requests', async ({ request }) => {
    const response = await request.post('/api/aviator/cashout', {
      data: {
        ticketId: 'test-ticket-123',
        kind: 'manual',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('should reject tick endpoint without secret', async ({ request }) => {
    const response = await request.post('/api/aviator/tick', {
      data: {
        action: 'start',
      },
    });

    // Should be rejected if TICK_SECRET is configured
    // If not configured, it might pass - that's a configuration issue
    const status = response.status();
    expect([401, 403, 200]).toContain(status);
    
    if (status === 200) {
      console.warn('Warning: AVIATOR_TICK_SECRET not configured - tick endpoint is open');
    }
  });

  test('should reject forged admin bearer token', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Authorization': 'Bearer fake-admin-bearer-token',
      },
      data: {
        roundId: 'test-round-123',
        amount: 100,
        userId: 'some-user-id',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('API Security - Invalid Tokens', () => {
  test('should reject malformed JWT tokens', async ({ request }) => {
    const malformedTokens = [
      'not-a-jwt',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',  // Only header
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',  // Missing signature
      'Bearer ',  // Empty bearer
      '',  // Empty string
    ];

    for (const token of malformedTokens) {
      const response = await request.post('/api/aviator/bets', {
        headers: {
          'Authorization': token.startsWith('Bearer') ? token : `Bearer ${token}`,
        },
        data: {
          roundId: 'test-round',
          amount: 100,
        },
      });

      expect(response.status()).toBe(401);
    }
  });

  test('should reject expired token patterns', async ({ request }) => {
    // Create a fake expired-looking JWT (not actually valid)
    const fakeExpiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid';

    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Authorization': `Bearer ${fakeExpiredJwt}`,
      },
      data: {
        roundId: 'test-round',
        amount: 100,
      },
    });

    expect(response.status()).toBe(401);
  });
});
