import { test as setup } from '@playwright/test';

const adminStorageFile = 'playwright/.auth/admin.json';

setup('authenticate admin for E2E', async ({ page }) => {
  if (process.env.NEXT_PUBLIC_E2E !== '1') {
    throw new Error('Set NEXT_PUBLIC_E2E=1 before generating the admin storage state.');
  }

  await page.goto('/admin/realtime-e2e');
  await page.context().storageState({ path: adminStorageFile });
});
