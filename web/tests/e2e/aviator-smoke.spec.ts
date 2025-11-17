import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import type { useAviatorStore } from '@/modules/aviator/state/useAviatorStore';

declare global {
  interface Window {
    __aviatorStore?: typeof useAviatorStore;
  }
}

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
    async (payload: { email: string; password: string }) => {
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

test.describe('Aviator smoke', () => {
  test.skip(shouldSkip, requirementsMessage);

  test('loop sai de awaitingBets para flying e atualiza histórico', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    await loginForPlayer(page, playerEmail, playerPassword);
    await seedWallet(request, playerEmail, defaultBalance);

    await page.goto('/app');
    await page.waitForURL('**/app', { timeout: 45_000 });

    await page.waitForFunction(
      () => Boolean(window.__aviatorStore?.getState()),
      undefined,
      {
        timeout: 30_000,
      }
    );

    // dá um tempo para o loop entrar no estado inicial caso esteja em transição
    await page.waitForTimeout(5_000);

    await page.waitForFunction(
      () => window.__aviatorStore?.getState().state?.state === 'awaitingBets',
      undefined,
      { timeout: 45_000 }
    );

    await page.waitForFunction(
      () => window.__aviatorStore?.getState().state?.state === 'flying',
      undefined,
      { timeout: 60_000 }
    );

    const historyLength = await page.evaluate(
      () => window.__aviatorStore?.getState().history.length ?? 0
    );

    expect(historyLength).toBeGreaterThan(0);
  });
});
