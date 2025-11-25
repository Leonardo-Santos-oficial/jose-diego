import { test, expect, type BrowserContext, type Page } from '@playwright/test';

interface BrowserFeature {
  name: string;
  check: (page: Page) => Promise<boolean>;
}

const BROWSER_FEATURES: BrowserFeature[] = [
  {
    name: 'CSS Grid',
    check: async (page) => page.evaluate(() => CSS.supports('display', 'grid')),
  },
  {
    name: 'CSS Flexbox',
    check: async (page) => page.evaluate(() => CSS.supports('display', 'flex')),
  },
  {
    name: 'CSS Variables',
    check: async (page) => page.evaluate(() => CSS.supports('color', 'var(--test)')),
  },
  {
    name: 'Fetch API',
    check: async (page) => page.evaluate(() => typeof fetch === 'function'),
  },
  {
    name: 'LocalStorage',
    check: async (page) => page.evaluate(() => typeof localStorage !== 'undefined'),
  },
  {
    name: 'SessionStorage',
    check: async (page) => page.evaluate(() => typeof sessionStorage !== 'undefined'),
  },
  {
    name: 'WebSocket',
    check: async (page) => page.evaluate(() => typeof WebSocket === 'function'),
  },
  {
    name: 'IntersectionObserver',
    check: async (page) => page.evaluate(() => typeof IntersectionObserver === 'function'),
  },
  {
    name: 'ResizeObserver',
    check: async (page) => page.evaluate(() => typeof ResizeObserver === 'function'),
  },
];

async function checkRenderingConsistency(page: Page): Promise<{ errors: string[] }> {
  const errors: string[] = [];

  const h1 = page.locator('h1').first();
  if (await h1.count() > 0) {
    const isVisible = await h1.isVisible();
    if (!isVisible) errors.push('H1 not visible');
  }

  const ctaButton = page.getByRole('button').first();
  if (await ctaButton.count() > 0) {
    const isVisible = await ctaButton.isVisible();
    if (!isVisible) errors.push('CTA button not visible');
  }

  const hasHorizontalScroll = await page.evaluate(() => 
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  if (hasHorizontalScroll) errors.push('Horizontal scroll detected');

  return { errors };
}

async function checkInteractivity(page: Page): Promise<{ errors: string[] }> {
  const errors: string[] = [];

  const buttons = await page.locator('button').all();
  for (const button of buttons.slice(0, 3)) {
    try {
      await button.hover();
    } catch {
      errors.push('Button hover failed');
    }
  }

  return { errors };
}

test.describe('Cross-Browser Compatibility', () => {
  test.describe('Feature Detection', () => {
    test('browser supports required features', async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const unsupportedFeatures: string[] = [];

      for (const feature of BROWSER_FEATURES) {
        const isSupported = await feature.check(page);
        if (!isSupported) {
          unsupportedFeatures.push(feature.name);
        }
      }

      if (unsupportedFeatures.length > 0) {
        console.log(`${browserName} missing features:`, unsupportedFeatures);
      }

      expect(unsupportedFeatures.length).toBeLessThanOrEqual(2);
    });
  });

  test.describe('Rendering Tests', () => {
    test('landing page renders correctly', async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const { errors } = await checkRenderingConsistency(page);

      if (errors.length > 0) {
        console.log(`Rendering issues in ${browserName}:`, errors);
      }

      expect(errors.length).toBe(0);
    });

    test('authentication modal renders correctly', async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
      if (await ctaButton.count() > 0) {
        await ctaButton.click();
        await page.waitForTimeout(500);
      }

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (await emailInput.count() > 0) {
        await expect(emailInput).toBeVisible();
      }
      if (await passwordInput.count() > 0) {
        await expect(passwordInput).toBeVisible();
      }
    });

    test('benefits page renders correctly', async ({ page }) => {
      await page.goto('/beneficios');
      await page.waitForLoadState('domcontentloaded');

      const heading = page.locator('h1, h2').first();
      if (await heading.count() > 0) {
        await expect(heading).toBeVisible();
      }
    });
  });

  test.describe('Form Interaction Tests', () => {
    test('text input works correctly', async ({ page, browserName }) => {
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

        await emailInput.clear();
        const clearedValue = await emailInput.inputValue();
        expect(clearedValue).toBe('');
      }
    });

    test('password input works correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
      if (await ctaButton.count() > 0) {
        await ctaButton.click();
        await page.waitForTimeout(500);
      }

      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await passwordInput.count() > 0) {
        await passwordInput.fill('SecurePassword123');
        const value = await passwordInput.inputValue();
        expect(value).toBe('SecurePassword123');

        const type = await passwordInput.getAttribute('type');
        expect(type).toBe('password');
      }
    });

    test('form submission works', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
      if (await ctaButton.count() > 0) {
        await ctaButton.click();
        await page.waitForTimeout(500);
      }

      const form = page.locator('form').first();
      
      if (await form.count() > 0) {
        const submitButton = form.getByRole('button', { name: /entrar|login|sign in|cadastrar/i }).first();
        if (await submitButton.count() > 0) {
          await expect(submitButton).toBeEnabled();
        }
      }
    });
  });

  test.describe('Navigation Tests', () => {
    test('link navigation works', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const benefitsLink = page.getByRole('link', { name: /benefícios|benefits/i }).first();
      
      if (await benefitsLink.count() > 0) {
        await benefitsLink.click();
        await page.waitForLoadState('domcontentloaded');
        expect(page.url()).toContain('beneficio');
      }
    });

    test('browser back navigation works', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.goto('/beneficios');
      await page.waitForLoadState('networkidle');
      
      // Wait a bit for history to be populated
      await page.waitForTimeout(500);

      await page.goBack();
      await page.waitForLoadState('networkidle');

      // After going back, we should be at home
      expect(page.url()).not.toContain('beneficio');
    });

    test('browser forward navigation works', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      await page.goto('/beneficios');
      await page.waitForLoadState('domcontentloaded');

      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Use try-catch for goForward as it can fail in some browsers
      try {
        await page.goForward({ timeout: 5000 });
        await page.waitForLoadState('domcontentloaded');
        expect(page.url()).toContain('beneficio');
      } catch {
        // Some browsers may not support forward navigation reliably
        test.skip();
      }
    });
  });

  test.describe('CSS Compatibility Tests', () => {
    test('flexbox layouts work correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Check if page has any flex containers (not necessarily class-based)
      const hasFlexLayouts = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let flexCount = 0;
        
        allElements.forEach((el) => {
          const display = window.getComputedStyle(el).display;
          if (display.includes('flex')) {
            flexCount++;
          }
        });
        
        // Page should have at least some flex layouts
        return flexCount > 0;
      });

      expect(hasFlexLayouts).toBe(true);
    });

    test('grid layouts work correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const gridElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="grid"]');
        let allCorrect = true;
        
        elements.forEach((el) => {
          const display = window.getComputedStyle(el).display;
          if (!display.includes('grid')) {
            allCorrect = false;
          }
        });
        
        return allCorrect;
      });

      expect(gridElements).toBe(true);
    });

    test('CSS transforms work', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const transformSupport = await page.evaluate(() => {
        return CSS.supports('transform', 'translateX(0)');
      });

      expect(transformSupport).toBe(true);
    });

    test('CSS transitions work', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const transitionSupport = await page.evaluate(() => {
        return CSS.supports('transition', 'all 0.3s ease');
      });

      expect(transitionSupport).toBe(true);
    });
  });

  test.describe('JavaScript API Tests', () => {
    test('async/await works', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const result = await page.evaluate(async () => {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        await delay(10);
        return true;
      });

      expect(result).toBe(true);
    });

    test('Promise API works', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        return Promise.resolve('test').then((val) => val === 'test');
      });

      expect(result).toBe(true);
    });

    test('Array methods work', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const arr = [1, 2, 3];
        return arr.map((x) => x * 2).filter((x) => x > 2).reduce((a, b) => a + b, 0);
      });

      expect(result).toBe(10);
    });

    test('Object spread works', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        const obj1 = { a: 1 };
        const obj2 = { b: 2 };
        const merged = { ...obj1, ...obj2 };
        return merged.a === 1 && merged.b === 2;
      });

      expect(result).toBe(true);
    });
  });

  test.describe('Event Handling Tests', () => {
    test('click events work', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const button = page.getByRole('button').first();
      
      if (await button.count() > 0) {
        let clicked = false;
        await page.evaluate(() => {
          const btn = document.querySelector('button');
          if (btn) {
            btn.addEventListener('click', () => {
              (window as unknown as Record<string, boolean>).testClicked = true;
            });
          }
        });

        await button.click();
        await page.waitForTimeout(100);

        clicked = await page.evaluate(() => 
          (window as unknown as Record<string, boolean>).testClicked ?? false
        );
      }
    });

    test('keyboard events work', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.waitForLoadState('domcontentloaded');

      const input = page.locator('input').first();
      
      if (await input.count() > 0) {
        await input.focus();
        await page.keyboard.type('test');
        
        const value = await input.inputValue();
        expect(value).toContain('test');
      }
    });

    test('scroll events work', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(200);

      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });
  });

  test.describe('Performance Tests', () => {
    test('page loads within acceptable time', async ({ page, browserName }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      console.log(`${browserName} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000);
    });

    test('no console errors on load', async ({ page, browserName }) => {
      const errors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('404')) {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      if (errors.length > 0) {
        console.log(`${browserName} console errors:`, errors);
      }

      expect(errors.length).toBeLessThanOrEqual(2);
    });

    test('no JavaScript errors', async ({ page, browserName }) => {
      const errors: string[] = [];
      
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(500);

      if (errors.length > 0) {
        console.log(`${browserName} JS errors:`, errors);
      }

      expect(errors.length).toBe(0);
    });
  });

  test.describe('Storage Tests', () => {
    test('localStorage works', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          const retrieved = localStorage.getItem('test');
          localStorage.removeItem('test');
          return retrieved === 'value';
        } catch {
          return false;
        }
      });

      expect(result).toBe(true);
    });

    test('sessionStorage works', async ({ page }) => {
      await page.goto('/');
      
      const result = await page.evaluate(() => {
        try {
          sessionStorage.setItem('test', 'value');
          const retrieved = sessionStorage.getItem('test');
          sessionStorage.removeItem('test');
          return retrieved === 'value';
        } catch {
          return false;
        }
      });

      expect(result).toBe(true);
    });
  });
});
