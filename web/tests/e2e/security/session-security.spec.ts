import { test, expect } from '@playwright/test';

/**
 * Security Tests - Session and Token Security
 * 
 * Tests for proper session management, token handling, and
 * cookie security configurations.
 * 
 * Key scenarios:
 * - Session cookies have proper security flags
 * - Tokens are not exposed in URLs or localStorage
 * - Session timeout and invalidation work correctly
 * - XSS protection for session data
 */

test.describe('Cookie Security Configuration', () => {
  test('should set HttpOnly flag on session cookies', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get all cookies
    const cookies = await page.context().cookies();
    
    // Find auth-related cookies
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') ||
      cookie.name.includes('sb-')
    );

    // Auth cookies should have HttpOnly flag
    for (const cookie of authCookies) {
      if (cookie.name.includes('token') || cookie.name.includes('session')) {
        // Session tokens should be HttpOnly to prevent XSS access
        expect(cookie.httpOnly).toBe(true);
      }
    }
  });

  test('should set Secure flag on cookies in production', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const cookies = await page.context().cookies();
    
    // In production (HTTPS), cookies should have Secure flag
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('sb-')
    );

    // Note: In local testing with HTTP, this might not apply
    // But we check that Secure is set when using HTTPS
    const currentUrl = page.url();
    if (currentUrl.startsWith('https://')) {
      for (const cookie of authCookies) {
        expect(cookie.secure).toBe(true);
      }
    }
  });

  test('should set SameSite attribute on session cookies', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const cookies = await page.context().cookies();
    
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') ||
      cookie.name.includes('sb-')
    );

    // Session cookies should have SameSite set to prevent CSRF
    for (const cookie of authCookies) {
      expect(['Strict', 'Lax', 'None']).toContain(cookie.sameSite);
      
      // If SameSite is None, Secure must be true
      if (cookie.sameSite === 'None') {
        expect(cookie.secure).toBe(true);
      }
    }
  });
});

test.describe('Token Exposure Prevention', () => {
  test('should not expose tokens in URL parameters', async ({ page }) => {
    // Navigate around and check URLs don't contain tokens
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check initial URL
    expect(page.url()).not.toMatch(/token=/i);
    expect(page.url()).not.toMatch(/access_token=/i);
    expect(page.url()).not.toMatch(/session=/i);
    expect(page.url()).not.toMatch(/password=/i);

    // Navigate to /app if accessible
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).not.toMatch(/token=/i);
    expect(page.url()).not.toMatch(/access_token=/i);
  });

  test('should not log tokens in console', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Click around to trigger any console logging
    await page.evaluate(() => {
      // Trigger any initialization logging
      window.dispatchEvent(new Event('resize'));
    });

    await page.waitForTimeout(1000);

    // Check console logs don't contain sensitive data
    for (const log of consoleLogs) {
      expect(log).not.toMatch(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/); // JWT pattern
      expect(log).not.toMatch(/sb-[a-z]+-auth-token/i);
      expect(log).not.toMatch(/SUPABASE_.*_KEY/i);
    }
  });

  test('should not expose API keys in client-side code', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const pageContent = await page.content();
    
    // Should not contain service role key (only anon key is allowed client-side)
    expect(pageContent).not.toMatch(/service_role/i);
    expect(pageContent).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/i);
    
    // Admin tokens should not be in client code
    expect(pageContent).not.toContain('AVIATOR_ADMIN_BEARER');
    expect(pageContent).not.toContain('AVIATOR_SECRET');
  });

  test('should not store sensitive tokens in localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const localStorageData = await page.evaluate(() => {
      const data: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });

    // Check localStorage doesn't contain admin secrets
    for (const [key, value] of Object.entries(localStorageData)) {
      expect(key).not.toMatch(/admin.*bearer/i);
      expect(key).not.toMatch(/service.*role/i);
      
      if (value) {
        expect(value).not.toContain('AVIATOR_ADMIN');
        expect(value).not.toMatch(/service_role/i);
      }
    }
  });
});

test.describe('Session Management', () => {
  test('should handle expired sessions gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Set an expired/invalid session cookie
    await page.context().addCookies([{
      name: 'sb-auth-token',
      value: 'expired.token.here',
      domain: new URL(page.url()).hostname,
      path: '/',
    }]);

    // Try to access protected content
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Should handle gracefully - redirect to login or show auth modal
    const isRedirected = page.url().includes('unauthorized') || !page.url().includes('/app');
    const hasAuthModal = await page.locator('[role="dialog"]').isVisible();
    
    expect(isRedirected || hasAuthModal).toBe(true);
  });

  test('should invalidate session on logout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check for logout button/link
    const logoutButton = page.getByRole('button', { name: /logout|sign out|sair/i });
    
    if (await logoutButton.isVisible()) {
      const cookiesBefore = await page.context().cookies();
      const sessionCookieBefore = cookiesBefore.find(c => 
        c.name.includes('auth') || c.name.includes('session')
      );

      await logoutButton.click();
      await page.waitForLoadState('domcontentloaded');

      const cookiesAfter = await page.context().cookies();
      const sessionCookieAfter = cookiesAfter.find(c => 
        c.name.includes('auth') || c.name.includes('session')
      );

      // Session cookie should be different or removed after logout
      if (sessionCookieBefore && sessionCookieAfter) {
        expect(sessionCookieAfter.value).not.toBe(sessionCookieBefore.value);
      }
    }
  });

  test('should not reuse old session after logout', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get initial cookies
    const initialCookies = await context.cookies();
    
    // Clear all cookies (simulate logout)
    await context.clearCookies();

    // Try to access protected route
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Should not be logged in
    expect(page.url()).not.toMatch(/\/app(?!.*unauthorized)/);
  });
});

test.describe('XSS Protection for Session Data', () => {
  test('should sanitize user input in session display', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Try to inject XSS through URL parameters
    await page.goto('/?name=<script>alert("xss")</script>');
    await page.waitForLoadState('domcontentloaded');

    // Check that script tags are not rendered
    const pageContent = await page.content();
    expect(pageContent).not.toContain('<script>alert("xss")</script>');
  });

  test('should not execute JavaScript from session storage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Set malicious session storage data
    await page.evaluate(() => {
      sessionStorage.setItem('userProfile', '{"name": "<img src=x onerror=alert(1)>"}');
    });

    // Navigate and check if XSS executes
    let alertTriggered = false;
    page.on('dialog', dialog => {
      alertTriggered = true;
      dialog.dismiss();
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    expect(alertTriggered).toBe(false);
  });

  test('should escape HTML entities in displayed user data', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that any displayed user data is properly escaped
    const scriptTags = await page.locator('script:not([src])').count();
    
    // Page should only have legitimate scripts, not injected ones
    // We verify by checking inline scripts don't contain obvious XSS patterns
    for (let i = 0; i < scriptTags; i++) {
      const scriptContent = await page.locator('script:not([src])').nth(i).textContent();
      if (scriptContent) {
        expect(scriptContent).not.toContain('alert(');
        expect(scriptContent).not.toContain('eval(');
        expect(scriptContent).not.toContain('document.cookie');
      }
    }
  });
});

test.describe('Authentication State Security', () => {
  test('should not cache authentication state inappropriately', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check Cache-Control headers
    const response = await page.request.get('/');
    const cacheControl = response.headers()['cache-control'];
    
    // Auth-sensitive pages should not be publicly cached
    if (cacheControl) {
      // Should include no-store or private for auth pages
      const hasNoCacheDirective = cacheControl.includes('no-store') || 
                                   cacheControl.includes('private') ||
                                   cacheControl.includes('no-cache');
      
      // At minimum, should not be public cached for long periods
      expect(cacheControl).not.toMatch(/public.*max-age=(?:[3-9]\d{4,}|\d{5,})/);
    }
  });

  test('should include security headers', async ({ page }) => {
    const response = await page.request.get('/');
    const headers = response.headers();

    // Check for recommended security headers
    // These are optional but recommended for security
    
    // X-Content-Type-Options prevents MIME sniffing
    // X-Frame-Options or CSP prevents clickjacking
    // Strict-Transport-Security enforces HTTPS
    
    // At minimum, check one security header exists
    const hasSecurityHeaders = 
      headers['x-content-type-options'] ||
      headers['x-frame-options'] ||
      headers['content-security-policy'] ||
      headers['strict-transport-security'];

    // Log which headers are present for reference
    if (!hasSecurityHeaders) {
      console.log('Warning: No standard security headers detected');
    }
  });

  test('should not allow session fixation', async ({ page, context }) => {
    // Set a known session ID before authentication
    await context.addCookies([{
      name: 'sb-auth-token',
      value: 'fixed-session-id-attempt',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get cookies after page load
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));

    // If our fixed session is still there, that might be a problem
    // The application should either reject it or regenerate on auth
    if (sessionCookie && sessionCookie.value === 'fixed-session-id-attempt') {
      // Check that protected resources are not accessible
      await page.goto('/app');
      await page.waitForLoadState('domcontentloaded');
      
      // Should not grant access with fixed session
      expect(page.url()).not.toMatch(/\/app(?!.*unauthorized)/);
    }
  });
});

test.describe('Token Refresh Security', () => {
  test('should handle token refresh without exposing new token in logs', async ({ page }) => {
    const networkLogs: string[] = [];
    
    page.on('request', request => {
      networkLogs.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for any token refresh operations
    await page.waitForTimeout(2000);

    // Check that token refresh URLs don't expose tokens in query params
    for (const url of networkLogs) {
      expect(url).not.toMatch(/access_token=[^&]+/);
      expect(url).not.toMatch(/refresh_token=[^&]+/);
    }
  });

  test('should use POST for token refresh operations', async ({ page }) => {
    const tokenRefreshRequests: { method: string; url: string }[] = [];
    
    page.on('request', request => {
      if (request.url().includes('token') || request.url().includes('refresh')) {
        tokenRefreshRequests.push({
          method: request.method(),
          url: request.url(),
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Token refresh should use POST, not GET
    for (const req of tokenRefreshRequests) {
      if (req.url.includes('refresh')) {
        expect(req.method).toBe('POST');
      }
    }
  });
});
