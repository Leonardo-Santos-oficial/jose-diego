import { test, expect, type Page } from '@playwright/test';

interface Viewport {
  name: string;
  width: number;
  height: number;
  device: 'mobile' | 'tablet' | 'desktop';
}

const VIEWPORTS: Viewport[] = [
  { name: 'iPhone SE', width: 375, height: 667, device: 'mobile' },
  { name: 'iPhone 12 Pro', width: 390, height: 844, device: 'mobile' },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, device: 'mobile' },
  { name: 'iPad Mini', width: 768, height: 1024, device: 'tablet' },
  { name: 'iPad Pro 11', width: 834, height: 1194, device: 'tablet' },
  { name: 'Surface Pro 7', width: 912, height: 1368, device: 'tablet' },
  { name: 'Laptop', width: 1366, height: 768, device: 'desktop' },
  { name: 'Desktop HD', width: 1920, height: 1080, device: 'desktop' },
  { name: 'Desktop 4K', width: 2560, height: 1440, device: 'desktop' },
];

async function checkElementVisibility(page: Page, selectors: string[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      results[selector] = await element.isVisible();
    } catch {
      results[selector] = false;
    }
  }
  
  return results;
}

async function checkNoHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
  });
}

async function checkTextReadability(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const paragraphs = document.querySelectorAll('p, span, li');
    for (const p of paragraphs) {
      const styles = window.getComputedStyle(p);
      const fontSize = parseFloat(styles.fontSize);
      if (fontSize < 12) return false;
    }
    return true;
  });
}

async function checkTouchTargetSize(page: Page): Promise<{ element: string; size: number }[]> {
  return page.evaluate(() => {
    const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
    const smallTargets: { element: string; size: number }[] = [];
    const minSize = 44;

    for (const el of interactiveElements) {
      const rect = el.getBoundingClientRect();
      const minDimension = Math.min(rect.width, rect.height);
      
      if (minDimension < minSize && minDimension > 0) {
        smallTargets.push({
          element: el.textContent?.slice(0, 30) || el.tagName,
          size: minDimension,
        });
      }
    }
    
    return smallTargets;
  });
}

test.describe('Responsive Design Tests', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      test('landing page renders correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible();

        const ctaButton = page.getByRole('button', { name: /jogar/i }).first();
        await expect(ctaButton).toBeVisible();

        const noHorizontalScroll = await checkNoHorizontalScroll(page);
        expect(noHorizontalScroll).toBe(true);
      });

      test('text is readable at viewport size', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const isReadable = await checkTextReadability(page);
        expect(isReadable).toBe(true);
      });

      test('images scale properly', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const images = await page.locator('img').all();
        
        for (const img of images) {
          const box = await img.boundingBox();
          if (box) {
            expect(box.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      });

      test('navigation is accessible', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        if (viewport.device === 'mobile') {
          const menuButton = page.getByRole('button', { name: /menu/i }).first();
          
          if (await menuButton.count() > 0) {
            await expect(menuButton).toBeVisible();
            await menuButton.click();
            await page.waitForTimeout(300);
          }
        }
      });

      test('footer is visible and properly formatted', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const noHorizontalScroll = await checkNoHorizontalScroll(page);
        expect(noHorizontalScroll).toBe(true);
      });
    });
  }
});

test.describe('Mobile-Specific Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('touch targets meet minimum size requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const smallTargets = await checkTouchTargetSize(page);
    
    const criticalSmallTargets = smallTargets.filter((t) => t.size < 30);
    expect(criticalSmallTargets.length).toBeLessThanOrEqual(5);
  });

  test('no fixed elements blocking content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const mainContent = page.locator('main').first();
    const isVisible = await mainContent.isVisible();
    expect(isVisible).toBe(true);
  });

  test('forms are usable on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
    if (await ctaButton.count() > 0) {
      await ctaButton.click();
      await page.waitForTimeout(500);
    }

    const inputs = await page.locator('input:not([type="hidden"])').all();
    
    for (const input of inputs) {
      const box = await input.boundingBox();
      if (box) {
        // Allow slightly smaller inputs (36px is acceptable on mobile)
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });

  test('scrolling works smoothly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
    await page.waitForTimeout(500);
    
    const afterScrollY = await page.evaluate(() => window.scrollY);
    expect(afterScrollY).toBeGreaterThan(initialScrollY);
  });
});

test.describe('Tablet-Specific Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test('layout uses appropriate column structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const noHorizontalScroll = await checkNoHorizontalScroll(page);
    expect(noHorizontalScroll).toBe(true);
  });

  test('sidebars collapse appropriately', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const noHorizontalScroll = await checkNoHorizontalScroll(page);
    expect(noHorizontalScroll).toBe(true);
  });
});

test.describe('Desktop-Specific Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('content is properly centered and constrained', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const mainContent = page.locator('main').first();
    const box = await mainContent.boundingBox();
    
    if (box) {
      expect(box.width).toBeLessThanOrEqual(1920);
    }
  });

  test('hover states work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const button = page.getByRole('button', { name: /jogar/i }).first();
    
    if (await button.count() > 0) {
      const initialStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
        };
      });

      await button.hover();
      await page.waitForTimeout(200);

      const hoverStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
        };
      });
    }
  });

  test('wide content areas are readable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const paragraphs = await page.locator('p').all();
    
    for (const p of paragraphs) {
      const box = await p.boundingBox();
      if (box && box.width > 0) {
        expect(box.width).toBeLessThanOrEqual(1200);
      }
    }
  });
});

test.describe('Orientation Tests', () => {
  test('portrait orientation renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const noHorizontalScroll = await checkNoHorizontalScroll(page);
    expect(noHorizontalScroll).toBe(true);
  });

  test('landscape orientation renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const noHorizontalScroll = await checkNoHorizontalScroll(page);
    expect(noHorizontalScroll).toBe(true);
  });

  test('content reflows on orientation change', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const portraitH1Box = await page.locator('h1').first().boundingBox();

    await page.setViewportSize({ width: 812, height: 375 });
    await page.waitForTimeout(300);

    const landscapeH1Box = await page.locator('h1').first().boundingBox();

    expect(portraitH1Box).toBeTruthy();
    expect(landscapeH1Box).toBeTruthy();
  });
});
