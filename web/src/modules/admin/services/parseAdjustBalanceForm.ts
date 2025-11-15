import type { BalanceAdjustmentInput } from '@/modules/admin/types';

export type ValidationSuccess<T> = { ok: true; value: T };
export type ValidationFailure = { ok: false; error: string };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export const INVALID_USER_ERROR = 'Usuário inválido.';
export const INVALID_AMOUNT_ERROR = 'Valor informado é inválido.';

export function parseAdjustBalanceForm(
  formData: FormData
): ValidationResult<BalanceAdjustmentInput> {
  const userId = formData.get('userId');
  const deltaInput = formData.get('delta');
  const reasonValue = formData.get('reason');

  if (typeof userId !== 'string' || !userId.trim()) {
    return { ok: false, error: INVALID_USER_ERROR };
  }

  const rawDelta =
    typeof deltaInput === 'string'
      ? deltaInput
      : typeof deltaInput === 'number'
        ? String(deltaInput)
        : deltaInput?.toString() ?? '';
  const delta = Number(rawDelta);

  if (!rawDelta.trim() || !Number.isFinite(delta)) {
    return { ok: false, error: INVALID_AMOUNT_ERROR };
  }

  const reason =
    typeof reasonValue === 'string' ? reasonValue.trim() || undefined : undefined;

  return {
    ok: true,
    value: {
      userId: userId.trim(),
      delta,
      reason,
    },
  };
}
