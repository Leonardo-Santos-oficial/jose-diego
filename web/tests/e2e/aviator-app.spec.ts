import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const isE2EEnabled = process.env.NEXT_PUBLIC_E2E === '1';
const realtimeEnabled = process.env.AVIATOR_E2E === '1';
const playerEmail = process.env.E2E_PLAYER_EMAIL ?? '';
const playerPassword = process.env.E2E_PLAYER_PASSWORD ?? '';
const parsedBalance = Number(process.env.E2E_PLAYER_BALANCE ?? '500');
const defaultBalance = Number.isFinite(parsedBalance) ? parsedBalance : 500;
const shouldSkip = !isE2EEnabled || !realtimeEnabled || !playerEmail || !playerPassword;

const requirementsMessage =
  'Ative NEXT_PUBLIC_E2E=1, AVIATOR_E2E=1 e defina E2E_PLAYER_EMAIL/E2E_PLAYER_PASSWORD para rodar este teste.';

async function loginForPlayer(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.evaluate(
    async (payload) => {
      const response = await fetch('/api/tests/player-session/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Falha no helper de login para testes.');
      }
      return json;
    },
    { email, password }
  );
}

async function seedWallet(request: APIRequestContext, email: string, amount: number) {
  const response = await request.post('/api/tests/wallet/topup', {
    data: { email, amount },
  });

  if (!response.ok()) {
    let detail = 'Erro desconhecido ao semear carteira.';
    try {
      const body = await response.json();
      detail = body.error ?? detail;
    } catch (error) {
      detail = (error as Error).message;
    }
    throw new Error(detail);
  }
}

async function waitForTicketId(page: Page) {
  const lastBetCard = page.getByTestId('aviator-hud-last-bet');
  await expect(lastBetCard).toBeVisible({ timeout: 45_000 });
  const ticketText = (await lastBetCard.locator('p').nth(1).textContent()) ?? '';
  return ticketText.replace('Ticket', '').trim();
}

async function expectCashoutFeedback(page: Page) {
  const cashoutCard = page.getByTestId('aviator-hud-last-cashout');
  await expect(cashoutCard).toBeVisible({ timeout: 45_000 });
  return cashoutCard.locator('p').nth(1);
}

async function expectBetFeedback(page: Page) {
  const betForm = page.getByTestId('aviator-bet-form');
  return betForm.locator('p').last();
}

async function expectCashoutFormFeedback(page: Page) {
  const cashoutForm = page.getByTestId('aviator-cashout-form');
  return cashoutForm.locator('p').last();
}

async function preparePlayer(page: Page, request: APIRequestContext) {
  await loginForPlayer(page, playerEmail, playerPassword);
  await seedWallet(request, playerEmail, defaultBalance);
}

test.describe('Aviator /app smoke test', () => {
  test.skip(shouldSkip, requirementsMessage);

  test.beforeEach(async ({ page, request }) => {
    await preparePlayer(page, request);
  });

  test('renderiza HUD e executa fluxo básico de aposta/cashout', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL('**/app', { timeout: 45_000 });

    await expect(page.getByText('HUD do piloto')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/Conectado ao loop/i)).toBeVisible({ timeout: 45_000 });

    const betForm = page.getByTestId('aviator-bet-form');
    const betButton = betForm.getByRole('button', { name: /apostar/i });
    await expect(betButton).toBeEnabled({ timeout: 45_000 });

    await betForm.getByLabel('Valor da aposta').fill('25');
    await betButton.click();

    const betFeedback = await expectBetFeedback(page);
    await expect(betFeedback).toBeVisible({ timeout: 45_000 });

    const ticketId = await waitForTicketId(page);
    expect(ticketId).not.toBe('');
    expect(ticketId).not.toBe('—');

    const cashoutForm = page.getByTestId('aviator-cashout-form');
    await cashoutForm.getByLabel('Ticket').fill(ticketId);
    const cashoutButton = cashoutForm.getByRole('button', { name: /solicitar cashout/i });
    await cashoutButton.click();

    const cashoutFeedbackForm = await expectCashoutFormFeedback(page);
    await expect(cashoutFeedbackForm).toBeVisible({ timeout: 45_000 });

    const cashoutHudValue = await expectCashoutFeedback(page);
    await expect(cashoutHudValue).toBeVisible({ timeout: 45_000 });
  });
});
