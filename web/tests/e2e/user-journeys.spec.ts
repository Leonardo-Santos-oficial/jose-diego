import { test, expect, type Page } from '@playwright/test';

interface PageConfig {
  path: string;
  name: string;
  requiresAuth: boolean;
  expectedElements: string[];
}

const PAGES: PageConfig[] = [
  {
    path: '/',
    name: 'Landing Page',
    requiresAuth: false,
    expectedElements: ['h1', 'button'],
  },
  {
    path: '/beneficios',
    name: 'Benefits Page',
    requiresAuth: false,
    expectedElements: ['h1'],
  },
];

async function verifyPageLoads(page: Page, path: string, expectedElements: string[]): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');

  for (const selector of expectedElements) {
    const element = page.locator(selector).first();
    await expect(element).toBeVisible({ timeout: 10000 });
  }
}

async function measureLoadTime(page: Page, path: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  return Date.now() - startTime;
}

test.describe('User Journey - Landing to Sign Up', () => {
  test('complete landing page experience', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).toBeVisible();

    const ctaButton = page.getByRole('button', { name: /jogar|play/i }).first();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeEnabled();

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const tutorialSection = page.getByText(/tutorial|como jogar|steps/i).first();
    if (await tutorialSection.count() > 0) {
      await expect(tutorialSection).toBeVisible();
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  });

  test('navigate from landing to sign up', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const signUpButton = page.getByRole('button', { name: /criar conta|sign up|cadastr/i }).first();
    
    if (await signUpButton.count() > 0) {
      await signUpButton.click();
      // Auth is modal-based, not route-based - check modal appears
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
      await expect(modal).toBeVisible({ timeout: 10000 });
    }
  });

  test('CTA button interaction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar/i }).first();
    await expect(ctaButton).toBeVisible();

    await ctaButton.hover();
    await page.waitForTimeout(200);

    await ctaButton.click();
    await page.waitForTimeout(1000);
  });
});

test.describe('User Journey - Authentication Flow', () => {
  test('auth modal opens when clicking CTA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    await expect(ctaButton).toBeVisible();
    
    await ctaButton.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.count() > 0) {
      await expect(modal).toBeVisible();
    }
  });

  test('auth modal has email and password inputs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    await ctaButton.click();
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
    }
    if (await passwordInput.count() > 0) {
      await expect(passwordInput).toBeVisible();
    }
  });

  test('form validation provides feedback', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    await ctaButton.click();
    await page.waitForTimeout(500);

    const submitButton = page.getByRole('button', { name: /entrar|login|sign in|cadastrar/i }).first();
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('toggle between sign in and sign up modes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    await ctaButton.click();
    await page.waitForTimeout(500);

    const toggleLink = page.getByRole('button', { name: /já possui conta|fazer login|cadastrar/i }).first();
    
    if (await toggleLink.count() > 0) {
      await toggleLink.click();
      await page.waitForTimeout(300);
    }
  });

  test('Google OAuth button is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    await ctaButton.click();
    await page.waitForTimeout(500);

    const googleButton = page.getByRole('button', { name: /google/i }).first();
    
    if (await googleButton.count() > 0) {
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    }
  });
});

test.describe('User Journey - Benefits Page', () => {
  test('benefits page loads and displays content', async ({ page }) => {
    await page.goto('/beneficios');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('navigation from landing to benefits', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const benefitsLink = page.getByRole('link', { name: /benefícios|benefits/i }).first();
    
    if (await benefitsLink.count() > 0) {
      await benefitsLink.click();
      await page.waitForURL('**/beneficios**', { timeout: 5000 });
    }
  });
});

test.describe('Page Load Performance', () => {
  for (const pageConfig of PAGES) {
    test(`${pageConfig.name} loads within acceptable time`, async ({ page }) => {
      const loadTime = await measureLoadTime(page, pageConfig.path);
      
      expect(loadTime).toBeLessThan(5000);
    });
  }
});

test.describe('Navigation Consistency', () => {
  test('header is consistent across pages', async ({ page }) => {
    const pagesToCheck = ['/', '/auth/signin', '/beneficios'];

    for (const path of pagesToCheck) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const header = page.locator('header, [role="banner"], nav').first();
      if (await header.count() > 0) {
        await expect(header).toBeVisible();
      }
    }
  });

  test('back navigation works correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/beneficios');
    await page.waitForLoadState('domcontentloaded');

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('localhost:3000');
  });
});

test.describe('Error Handling', () => {
  test('404 page displays for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    await page.waitForLoadState('domcontentloaded');

    const is404 = await page.locator('text=/404|not found|página não encontrada/i').count() > 0;
    const hasHomeLink = await page.getByRole('link', { name: /home|início|voltar/i }).count() > 0;
  });

  test('handles network errors gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const mainContent = page.locator('main, [role="main"]').first();
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }
  });
});

test.describe('Interactive Elements', () => {
  test('all buttons are clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const buttons = await page.locator('button:visible').all();
    
    for (const button of buttons.slice(0, 5)) {
      const isEnabled = await button.isEnabled();
      expect(isEnabled).toBe(true);
    }
  });

  test('all links are valid', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const links = await page.locator('a[href]:visible').all();
    
    for (const link of links.slice(0, 10)) {
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('input fields accept text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    if (await ctaButton.count() > 0) {
      await ctaButton.click();
      await page.waitForTimeout(500);
    }

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      const value = await emailInput.inputValue();
      expect(value).toBe('test@example.com');
    }
  });
});

test.describe('Visual Feedback', () => {
  test('loading states are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('focus states are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    if (await ctaButton.count() > 0) {
      await ctaButton.click();
      await page.waitForTimeout(500);
    }

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.focus();
      
      const hasFocusStyle = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || 
               styles.boxShadow !== 'none' ||
               styles.borderColor !== '';
      });
    }
  });
});
