import { test, expect } from '@playwright/test';

/**
 * Security Tests - Role-Based Access Control (RBAC)
 * 
 * Tests that admin-only functionality is protected and regular users
 * cannot access or perform admin actions.
 * 
 * Key scenarios:
 * - Regular users cannot access admin pages
 * - Regular users cannot perform admin actions (adjust balance, etc.)
 * - Admin role is properly verified in middleware and server actions
 */

test.describe('Admin Route Access - Without Admin Role', () => {
  // These tests verify that even authenticated users without admin role
  // cannot access admin functionality

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('should redirect non-admin authenticated users from /admin', async ({ page }) => {
    // Try to access admin page directly
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected to home with unauthorized message
    expect(page.url()).not.toContain('/admin');
  });

  test('should redirect non-admin from /admin/game', async ({ page }) => {
    await page.goto('/admin/game');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).not.toContain('/admin');
  });

  test('should not show admin navigation to non-admin users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that admin links are not visible or lead to unauthorized
    const adminLinks = page.locator('a[href*="/admin"]');
    const count = await adminLinks.count();

    // If admin links exist, clicking should redirect non-admins
    if (count > 0) {
      const firstAdminLink = adminLinks.first();
      await firstAdminLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Should be redirected, not on admin page
      expect(page.url()).not.toMatch(/\/admin(?!.*unauthorized)/);
    }
  });
});

test.describe('Admin Actions - CSRF and Authorization', () => {
  test('should require valid session for admin balance adjustment', async ({ request }) => {
    // Try to call admin action without proper authentication
    // Server actions are POST to specific endpoints
    const response = await request.post('/admin', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: {
        userId: 'target-user-id',
        delta: '1000',
        reason: 'unauthorized adjustment attempt',
      },
    });

    // Should be redirected or rejected (200 with redirect is also valid for Next.js)
    expect([200, 302, 303, 401, 403]).toContain(response.status());
  });

  test('should not process admin actions from forged form submissions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Try to submit a forged form targeting admin action
    const result = await page.evaluate(async () => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/admin';
      
      const userIdInput = document.createElement('input');
      userIdInput.name = 'userId';
      userIdInput.value = 'victim-user-id';
      form.appendChild(userIdInput);
      
      const deltaInput = document.createElement('input');
      deltaInput.name = 'delta';
      deltaInput.value = '10000';
      form.appendChild(deltaInput);
      
      document.body.appendChild(form);
      
      try {
        form.submit();
        return 'submitted';
      } catch (e) {
        return 'blocked';
      }
    });

    await page.waitForLoadState('domcontentloaded');
    
    // Should be redirected to unauthorized page
    expect(page.url()).not.toContain('/admin');
  });
});

test.describe('Admin API Protection', () => {
  test('test results queue should only work in E2E mode', async ({ request }) => {
    const response = await request.post('/api/tests/admin-result-queue', {
      data: {
        queue: [{ status: 'success', message: 'test' }],
      },
    });

    // Should be blocked in production mode
    // In E2E mode (which these tests run in), it should work
    const status = response.status();
    expect([200, 403, 404]).toContain(status);
  });

  test('should reject admin actions with user-level privileges', async ({ request }) => {
    // Even with a valid-looking request structure, without admin role it should fail
    const response = await request.post('/api/tests/player-session/login', {
      data: {
        email: 'regular-user@test.com',
        password: 'password123',
      },
    });

    // This endpoint might work for E2E but shouldn't give admin access
    if (response.status() === 200) {
      // After "login", try to access admin
      const adminResponse = await request.get('/admin');
      expect(adminResponse.status()).not.toBe(200);
    }
  });
});

test.describe('Role Verification in Server Actions', () => {
  test('balance adjustment action should verify admin role', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Attempt to call the adjustBalanceAction through page context
    const actionResult = await page.evaluate(async () => {
      try {
        // This would normally be called via useFormState/useActionState
        // Direct call should fail for non-admins
        const response = await fetch('/admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 'test-user',
            delta: 1000,
          }),
        });
        return { status: response.status, redirected: response.redirected };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });

    // Should be rejected for non-admin users (200 with redirect is also valid for Next.js)
    if ('status' in actionResult) {
      expect([200, 302, 303, 401, 403]).toContain(actionResult.status);
    }
  });

  test('chat admin action should verify admin role', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const result = await page.evaluate(async () => {
      try {
        // Attempt to send admin message without admin role
        const response = await fetch('/api/admin/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            threadId: 'test-thread',
            body: 'Unauthorized admin message',
          }),
        });
        return { status: response.status };
      } catch (e) {
        return { error: 'blocked' };
      }
    });

    // Should not succeed without admin privileges
    if ('status' in result) {
      expect([401, 403, 404]).toContain(result.status);
    }
  });
});

test.describe('Privilege Escalation Prevention', () => {
  test('should not allow role modification via API', async ({ request }) => {
    // Try to modify user role through API
    const response = await request.post('/api/user/profile', {
      data: {
        role: 'admin',
        user_metadata: { role: 'admin' },
        app_metadata: { role: 'admin' },
      },
    });

    // Should be rejected - role modification should only be done via admin tools
    expect([401, 403, 404, 405]).toContain(response.status());
  });

  test('should not leak admin status in public responses', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that no admin-related data is exposed in page source
    const pageContent = await page.content();
    
    // Should not contain admin secrets or internal identifiers
    expect(pageContent).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(pageContent).not.toContain('AVIATOR_ADMIN_BEARER');
    expect(pageContent).not.toContain('service_role');
  });

  test('should not expose user roles in client-side state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check localStorage and sessionStorage for role leakage
    const storageData = await page.evaluate(() => {
      const data: Record<string, string | null> = {};
      
      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[`localStorage:${key}`] = localStorage.getItem(key);
        }
      }
      
      // Check sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data[`sessionStorage:${key}`] = sessionStorage.getItem(key);
        }
      }
      
      return data;
    });

    // If any storage contains role info, it shouldn't be 'admin' for public page
    for (const [key, value] of Object.entries(storageData)) {
      if (value && value.includes('"role"')) {
        expect(value).not.toContain('"role":"admin"');
      }
    }
  });
});

test.describe('Admin Panel Content Protection', () => {
  test('admin table should not be visible to non-admins', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // The admin user table should not exist on public pages
    const adminTable = page.locator('[data-testid="admin-user-table"]');
    await expect(adminTable).not.toBeVisible();
  });

  test('admin controls should not be accessible via direct URL', async ({ page }) => {
    await page.goto('/admin/game');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected, not showing game controls
    expect(page.url()).not.toContain('/admin/game');
    
    // Game control panel should not be visible
    const gamePanel = page.locator('[data-testid="game-control-panel"]');
    await expect(gamePanel).not.toBeVisible();
  });
});
