import { test, expect } from '@playwright/test';

test('landing page loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /jogar/i }).first()).toBeVisible();
});
