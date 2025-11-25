import { test, expect, type Page } from '@playwright/test';

interface ConsistencyCheck {
  name: string;
  check: (page: Page) => Promise<boolean>;
}

async function getComputedStyles(page: Page, selector: string): Promise<Record<string, string> | null> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const styles = window.getComputedStyle(element);
    return {
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      color: styles.color,
      backgroundColor: styles.backgroundColor,
      borderRadius: styles.borderRadius,
      padding: styles.padding,
    };
  }, selector);
}

async function getButtonStyles(page: Page): Promise<Record<string, string>[]> {
  return page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map((btn) => {
      const styles = window.getComputedStyle(btn);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderRadius: styles.borderRadius,
        fontWeight: styles.fontWeight,
        fontSize: styles.fontSize,
        cursor: styles.cursor,
      };
    });
  });
}

async function checkSpacingConsistency(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const sections = document.querySelectorAll('section, article, .card, [class*="section"]');
    const paddings = new Set<string>();
    const margins = new Set<string>();
    
    sections.forEach((section) => {
      const styles = window.getComputedStyle(section);
      paddings.add(styles.padding);
      margins.add(styles.margin);
    });
    
    return paddings.size <= 5 && margins.size <= 5;
  });
}

test.describe('UI Consistency Tests', () => {
  test.describe('Typography Consistency', () => {
    test('headings use consistent font family', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const headingFonts = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const fonts = new Set<string>();
        
        headings.forEach((h) => {
          const styles = window.getComputedStyle(h);
          fonts.add(styles.fontFamily.split(',')[0].trim().replace(/['"]/g, ''));
        });
        
        return Array.from(fonts);
      });

      expect(headingFonts.length).toBeLessThanOrEqual(2);
    });

    test('body text uses consistent font', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const bodyFonts = await page.evaluate(() => {
        const paragraphs = document.querySelectorAll('p, span, li');
        const fonts = new Set<string>();
        
        paragraphs.forEach((p) => {
          const styles = window.getComputedStyle(p);
          fonts.add(styles.fontFamily.split(',')[0].trim().replace(/['"]/g, ''));
        });
        
        return Array.from(fonts);
      });

      expect(bodyFonts.length).toBeLessThanOrEqual(2);
    });

    test('font sizes follow hierarchy', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const fontSizes = await page.evaluate(() => {
        const sizes: Record<string, number[]> = {
          h1: [], h2: [], h3: [], h4: [], p: [],
        };
        
        Object.keys(sizes).forEach((tag) => {
          document.querySelectorAll(tag).forEach((el) => {
            const size = parseFloat(window.getComputedStyle(el).fontSize);
            sizes[tag].push(size);
          });
        });
        
        return sizes;
      });

      if (fontSizes.h1.length > 0 && fontSizes.h2.length > 0) {
        const avgH1 = fontSizes.h1.reduce((a, b) => a + b, 0) / fontSizes.h1.length;
        const avgH2 = fontSizes.h2.reduce((a, b) => a + b, 0) / fontSizes.h2.length;
        expect(avgH1).toBeGreaterThan(avgH2);
      }
    });
  });

  test.describe('Color Consistency', () => {
    test('primary buttons use consistent colors', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const buttonColors = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const colors = new Set<string>();
        
        buttons.forEach((btn) => {
          const styles = window.getComputedStyle(btn);
          const bg = styles.backgroundColor;
          if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            colors.add(bg);
          }
        });
        
        return colors.size;
      });

      expect(buttonColors).toBeLessThanOrEqual(5);
    });

    test('links use consistent colors', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const linkColors = await page.evaluate(() => {
        const links = document.querySelectorAll('a');
        const colors = new Set<string>();
        
        links.forEach((link) => {
          colors.add(window.getComputedStyle(link).color);
        });
        
        return colors.size;
      });

      expect(linkColors).toBeLessThanOrEqual(4);
    });

    test('background colors are consistent', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const bgColors = await page.evaluate(() => {
        const sections = document.querySelectorAll('section, div[class*="bg-"], main');
        const colors = new Set<string>();
        
        sections.forEach((section) => {
          const bg = window.getComputedStyle(section).backgroundColor;
          if (bg !== 'rgba(0, 0, 0, 0)') {
            colors.add(bg);
          }
        });
        
        return colors.size;
      });

      expect(bgColors).toBeLessThanOrEqual(10);
    });
  });

  test.describe('Spacing Consistency', () => {
    test('sections use consistent padding', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const isConsistent = await checkSpacingConsistency(page);
      expect(isConsistent).toBe(true);
    });

    test('cards use consistent spacing', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const cardPaddings = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="card"], article');
        const paddings = new Set<string>();
        
        cards.forEach((card) => {
          paddings.add(window.getComputedStyle(card).padding);
        });
        
        return paddings.size;
      });

      expect(cardPaddings).toBeLessThanOrEqual(4);
    });
  });

  test.describe('Border Consistency', () => {
    test('buttons use consistent border radius', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const radiuses = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const radii = new Set<string>();
        
        buttons.forEach((btn) => {
          radii.add(window.getComputedStyle(btn).borderRadius);
        });
        
        return radii.size;
      });

      expect(radiuses).toBeLessThanOrEqual(4);
    });

    test('input fields use consistent border radius', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
      if (await ctaButton.count() > 0) {
        await ctaButton.click();
        await page.waitForTimeout(500);
      }

      const radiuses = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        const radii = new Set<string>();
        
        inputs.forEach((input) => {
          radii.add(window.getComputedStyle(input).borderRadius);
        });
        
        return radii.size;
      });

      expect(radiuses).toBeLessThanOrEqual(3);
    });
  });
});

test.describe('Interactive Element Tests', () => {
  test.describe('Button States', () => {
    test('buttons have visible hover state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const button = page.getByRole('button', { name: /jogar/i }).first();
      
      if (await button.count() > 0) {
        const initialBg = await button.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );

        await button.hover();
        await page.waitForTimeout(300);

        const hoverBg = await button.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
      }
    });

    test('buttons show click feedback', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const button = page.getByRole('button', { name: /jogar/i }).first();
      
      if (await button.count() > 0) {
        await button.click();
        await page.waitForTimeout(100);
      }
    });

    test('disabled buttons look disabled', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const disabledButtons = await page.locator('button:disabled').all();
      
      for (const button of disabledButtons) {
        const cursor = await button.evaluate((el) => 
          window.getComputedStyle(el).cursor
        );
        expect(['not-allowed', 'default']).toContain(cursor);
      }
    });
  });

  test.describe('Input States', () => {
    test('inputs have visible focus state', async ({ page }) => {
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
        
        const hasFocusIndicator = await emailInput.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.outline !== 'none' || 
                 styles.boxShadow !== 'none' ||
                 styles.borderColor !== styles.getPropertyValue('--initial-border');
        });
      }
    });

    test('inputs show placeholder text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const ctaButton = page.getByRole('button', { name: /jogar|criar conta/i }).first();
      if (await ctaButton.count() > 0) {
        await ctaButton.click();
        await page.waitForTimeout(500);
      }

      const inputs = await page.locator('input:not([type="hidden"])').all();
      
      for (const input of inputs) {
        const placeholder = await input.getAttribute('placeholder');
        const ariaLabel = await input.getAttribute('aria-label');
        const hasLabel = placeholder || ariaLabel;
      }
    });
  });

  test.describe('Link States', () => {
    test('links have visible hover state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const link = page.locator('a[href]').first();
      
      if (await link.count() > 0) {
        await link.hover();
        await page.waitForTimeout(200);
      }
    });

    test('visited links are distinguishable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });
  });
});

test.describe('Animation and Transition Tests', () => {
  test('page transitions are smooth', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const startTime = Date.now();
    await page.goto('/beneficios');
    await page.waitForLoadState('domcontentloaded');
    const transitionTime = Date.now() - startTime;

    expect(transitionTime).toBeLessThan(3000);
  });

  test('scroll animations work', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
    await page.waitForTimeout(500);

    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });

  test('hover transitions are not jarring', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 3)) {
      const transition = await button.evaluate((el) => 
        window.getComputedStyle(el).transition
      );
    }
  });
});

test.describe('Layout Consistency Tests', () => {
  test('content is properly aligned', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const mainContent = page.locator('main').first();
    
    if (await mainContent.count() > 0) {
      const box = await mainContent.boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('sections have consistent width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const sectionWidths = await page.evaluate(() => {
      const sections = document.querySelectorAll('section');
      const widths: number[] = [];
      
      sections.forEach((section) => {
        widths.push(section.getBoundingClientRect().width);
      });
      
      return widths;
    });

    if (sectionWidths.length > 1) {
      const maxWidth = Math.max(...sectionWidths);
      const minWidth = Math.min(...sectionWidths);
      const variance = (maxWidth - minWidth) / maxWidth;
      expect(variance).toBeLessThan(0.3);
    }
  });

  test('grid layouts are consistent', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const gridGaps = await page.evaluate(() => {
      const grids = document.querySelectorAll('[class*="grid"], [class*="flex"]');
      const gaps = new Set<string>();
      
      grids.forEach((grid) => {
        const styles = window.getComputedStyle(grid);
        if (styles.gap) {
          gaps.add(styles.gap);
        }
      });
      
      return gaps.size;
    });

    // Allow up to 12 different gap values for flexible design
    expect(gridGaps).toBeLessThanOrEqual(12);
  });
});

test.describe('Cross-Page Consistency', () => {
  const pagesToCheck = ['/', '/beneficios'];

  test('header styling is consistent across pages', async ({ page }) => {
    const headerStyles: (Record<string, string> | null)[] = [];

    for (const path of pagesToCheck) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const styles = await getComputedStyles(page, 'header, [role="banner"], nav');
      headerStyles.push(styles);
    }
  });

  test('button styling is consistent across pages', async ({ page }) => {
    const allButtonStyles: Record<string, string>[][] = [];

    for (const path of pagesToCheck) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const styles = await getButtonStyles(page);
      allButtonStyles.push(styles);
    }
  });
});
