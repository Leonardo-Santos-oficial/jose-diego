import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { AdminActionState } from '@/modules/admin/types/actionState';

test.describe.configure({ mode: 'serial' });

const adminStorageState = 'playwright/.auth/admin.json';
const queueEndpoint = '/api/tests/admin-result-queue';
const resetEndpoint = '/api/tests/timeline/reset';
const feedEndpoint = '/api/tests/realtime-feed';

const isE2EEnabled = process.env.NEXT_PUBLIC_E2E === '1';

test.use({ storageState: adminStorageState });
test.skip(
  !isE2EEnabled,
  'NEXT_PUBLIC_E2E must be enabled to run admin realtime E2E tests.'
);

test.beforeEach(async ({ request, page }) => {
  await request.post(resetEndpoint);
  await page.goto('/admin/realtime-e2e');
  await page.waitForURL('**/admin/realtime-e2e');
});

async function seedQueue(request: APIRequestContext, queue: AdminActionState[]) {
  await request.post(queueEndpoint, { data: { queue } });
}

const walletAdjustedCount = (events: Array<{ type: string }>) =>
  events.filter((event) => event.type === 'wallet_adjusted').length;

const getRowByEmail = (page: Page, email: RegExp) =>
  page.getByRole('row').filter({ hasText: email });

test('processa crédito e débito encadeados', async ({ page, request }) => {
  await seedQueue(request, [
    {
      status: 'success',
      message: 'Crédito aplicado (+200)',
      snapshot: { balance: 1400, updatedAt: '2025-11-14T13:00:00Z' },
    },
    {
      status: 'error',
      message: 'Saldo desatualizado. Atualize a página.',
    },
    {
      status: 'success',
      message: 'Débito processado (-15)',
      snapshot: { balance: 60, updatedAt: '2025-11-14T13:05:00Z' },
    },
  ] satisfies AdminActionState[]);

  await page.getByPlaceholder('± R$').first().waitFor();

  const vipRow = getRowByEmail(page, /vip@example.com/i);
  await vipRow.getByPlaceholder('± R$').fill('200');
  await vipRow.getByPlaceholder('Motivo (opcional)').fill('Promo 11/11');
  await vipRow.getByRole('button', { name: 'Executar' }).click();
  await expect(vipRow.getByText('Crédito aplicado (+200)')).toBeVisible();

  await vipRow.getByPlaceholder('± R$').fill('50');
  await vipRow.getByRole('button', { name: 'Executar' }).click();
  await expect(vipRow.getByText('Saldo desatualizado. Atualize a página.')).toBeVisible();

  const starterRow = getRowByEmail(page, /starter@example.com/i);
  await starterRow.getByPlaceholder('± R$').fill('-15');
  await starterRow.getByPlaceholder('Motivo (opcional)').fill('Ajuste manual');
  await starterRow.getByRole('button', { name: 'Executar' }).click();
  await expect(starterRow.getByText('Débito processado (-15)')).toBeVisible();
});

test('exibe feed de eventos consolidado', async ({ page, request }) => {
  await seedQueue(request, [
    {
      status: 'success',
      message: 'Crédito aplicado (+200)',
      snapshot: { balance: 1400, updatedAt: '2025-11-14T13:00:00Z' },
    },
    {
      status: 'success',
      message: 'Débito processado (-15)',
      snapshot: { balance: 60, updatedAt: '2025-11-14T13:05:00Z' },
    },
  ] satisfies AdminActionState[]);

  await page.getByPlaceholder('± R$').first().waitFor();

  const vipRow = getRowByEmail(page, /vip@example.com/i);
  await vipRow.getByPlaceholder('± R$').fill('200');
  await vipRow.getByRole('button', { name: 'Executar' }).click();
  await expect(vipRow.getByText('Crédito aplicado (+200)')).toBeVisible();

  const starterRow = getRowByEmail(page, /starter@example.com/i);
  await starterRow.getByPlaceholder('± R$').fill('-15');
  await starterRow.getByRole('button', { name: 'Executar' }).click();
  await expect(starterRow.getByText('Débito processado (-15)')).toBeVisible();

  const response = await request.get(feedEndpoint);
  const feed = await response.json();

  expect(response.ok()).toBeTruthy();
  expect(Array.isArray(feed.events)).toBe(true);
  expect(walletAdjustedCount(feed.events)).toBeGreaterThanOrEqual(2);
  const highRoller = feed.wallets.find((wallet: any) => wallet.userId === 'high-roller');
  expect(highRoller?.balance).toBe(1400);
});
