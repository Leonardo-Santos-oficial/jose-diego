const amountFormatter = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);

export const MIN_BET_AMOUNT = 0.5;
export const MAX_BET_AMOUNT = 500;

export type BetAmountValidationResult = { ok: true } | { ok: false; message: string };

export function validateBetAmount(amount: number): BetAmountValidationResult {
  if (!Number.isFinite(amount)) {
    return { ok: false, message: 'Informe um valor de aposta válido.' };
  }

  if (amount < MIN_BET_AMOUNT) {
    return {
      ok: false,
      message: `O valor mínimo de aposta é ${amountFormatter(MIN_BET_AMOUNT)} créditos.`,
    };
  }

  if (amount > MAX_BET_AMOUNT) {
    return {
      ok: false,
      message: `O valor máximo permitido é ${amountFormatter(MAX_BET_AMOUNT)} créditos.`,
    };
  }

  return { ok: true };
}
