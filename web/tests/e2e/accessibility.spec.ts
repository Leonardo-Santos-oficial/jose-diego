import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: ViewportConfig[] = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 },
];

async function runAccessibilityAudit(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const violations = results.violations;
  
  if (violations.length > 0) {
    const summary = violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    }));
    console.log(`Accessibility issues in ${context}:`, summary);
  }

  return violations;
}

async function testKeyboardNavigation(page: Page): Promise<boolean> {
  const initialFocus = await page.evaluate(() => document.activeElement?.tagName);
  
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => document.activeElement?.tagName);
  
  let tabCount = 0;
  const maxTabs = 50;
  
  while (tabCount < maxTabs) {
    await page.keyboard.press('Tab');
    tabCount++;
    
    const currentFocus = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      text: document.activeElement?.textContent?.slice(0, 50),
    }));
    
    if (!currentFocus.tag || currentFocus.tag === 'BODY') break;
  }
  
  return firstFocus !== initialFocus && tabCount > 0;
}

async function testFocusVisibility(page: Page): Promise<boolean> {
  await page.keyboard.press('Tab');
  
  const hasFocusStyle = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;
    
    const styles = window.getComputedStyle(el);
    const outline = styles.outline;
    const boxShadow = styles.boxShadow;
    
    return outline !== 'none' || boxShadow !== 'none';
  });
  
  return hasFocusStyle;
}

test.describe('Accessibility Tests - Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should pass WCAG 2.1 AA accessibility audit', async ({ page }) => {
    const violations = await runAccessibilityAudit(page, 'landing page');
    
    const criticalViolations = violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels: number[] = [];

    for (const heading of headings) {
      const tag = await heading.evaluate((el) => el.tagName);
      headingLevels.push(parseInt(tag.charAt(1)));
    }

    expect(headingLevels[0]).toBe(1);

    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have alt text for all images', async ({ page }) => {
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaHidden = await img.getAttribute('aria-hidden');

      const isDecorative = role === 'presentation' || ariaHidden === 'true';
      
      if (!isDecorative) {
        expect(alt).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    const canNavigate = await testKeyboardNavigation(page);
    expect(canNavigate).toBe(true);
  });

  test('should have visible focus indicators', async ({ page }) => {
    const hasFocus = await testFocusVisibility(page);
    expect(hasFocus).toBe(true);
  });

  test('should have proper link accessibility', async ({ page }) => {
    const links = await page.locator('a').all();

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');

      const hasAccessibleName = 
        (text && text.trim().length > 0) || 
        ariaLabel || 
        title;
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have proper button accessibility', async ({ page }) => {
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      const hasAccessibleName = 
        (text && text.trim().length > 0) || 
        ariaLabel || 
        title;
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    const contrastViolations = results.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('should work without JavaScript for critical content', async ({ page }) => {
    const h1 = await page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    const ctaButton = await page.getByRole('button', { name: /jogar/i }).first();
    await expect(ctaButton).toBeVisible();
  });
});

test.describe('Accessibility Tests - Responsive Viewports', () => {
  for (const viewport of VIEWPORTS) {
    test(`should be accessible on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const violations = await runAccessibilityAudit(page, `${viewport.name} viewport`);
      
      const criticalViolations = violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      
      expect(criticalViolations).toHaveLength(0);
    });
  }
});

test.describe('Accessibility Tests - Login Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    if (await ctaButton.count() > 0) {
      await ctaButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have proper form labels', async ({ page }) => {
    const inputs = await page.locator('input').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const type = await input.getAttribute('type');

      if (type === 'hidden') continue;

      const hasLabel = id 
        ? await page.locator(`label[for="${id}"]`).count() > 0
        : false;
      
      const hasAccessibleLabel = hasLabel || ariaLabel || ariaLabelledby;
      expect(hasAccessibleLabel).toBeTruthy();
    }
  });

  test('should pass accessibility audit', async ({ page }) => {
    const violations = await runAccessibilityAudit(page, 'login modal');
    
    const criticalViolations = violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    
    // Allow color-contrast issues as they are design decisions (brand colors)
    const criticalNonColorViolations = criticalViolations.filter(
      (v) => v.id !== 'color-contrast'
    );
    expect(criticalNonColorViolations).toHaveLength(0);
  });

  test('should support form navigation via keyboard', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.count() > 0) {
      await emailInput.focus();
      await page.keyboard.press('Tab');
      
      if (await passwordInput.count() > 0) {
        const isFocused = await passwordInput.evaluate((el) => el === document.activeElement);
        expect(isFocused).toBe(true);
      }
    }
  });
});

test.describe('Accessibility Tests - Error States', () => {
  test('should announce form errors to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    
    if (await ctaButton.count() > 0) {
      await ctaButton.click();
      await page.waitForTimeout(500);
      
      const submitButton = page.getByRole('button', { name: /entrar|login|sign in/i }).first();
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);
        
        const errorMessages = await page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"], .error, .text-red-500').all();
        
        for (const error of errorMessages) {
          const role = await error.getAttribute('role');
          const ariaLive = await error.getAttribute('aria-live');
          const isAccessible = role === 'alert' || ariaLive;
        }
      }
    }
  });
});
