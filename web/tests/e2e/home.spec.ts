import { test, expect } from '@playwright/test';

test('landing placeholder loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Demo Aviator · RTP 97%')).toBeVisible();
});
