import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { adjustBalanceAction } from '@/app/actions/admin';
import { parseAdjustBalanceForm } from '@/modules/admin/services/parseAdjustBalanceForm';
import { adminActionInitialState } from '@/modules/admin/types/actionState';

const { commandCtorMock, executeMock } = vi.hoisted(() => {
  const execute = vi.fn();
  return {
    executeMock: execute,
    commandCtorMock: vi.fn().mockImplementation(() => ({ execute })),
  };
});

vi.mock('@/modules/admin/commands/AdjustWalletBalanceCommand', () => ({
  AdjustWalletBalanceCommand: commandCtorMock,
}));

const buildFormData = (entries: Record<string, string | undefined>) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value !== 'undefined') {
      form.set(key, value);
    }
  }
  return form;
};

describe('parseAdjustBalanceForm', () => {
  it('returns sanitized payload for valid input', () => {
    const result = parseAdjustBalanceForm(
      buildFormData({ userId: ' user-123 ', delta: '42.5', reason: '  Bonus ' })
    );

    expect(result).toEqual({
      ok: true,
      value: {
        userId: 'user-123',
        delta: 42.5,
        reason: 'Bonus',
      },
    });
  });

  it('flags missing user as error', () => {
    const result = parseAdjustBalanceForm(buildFormData({ delta: '10' }));

    expect(result).toEqual({
      ok: false,
      error: 'Usuário inválido.',
    });
  });

  it('flags invalid amount as error', () => {
    const result = parseAdjustBalanceForm(buildFormData({ userId: 'abc', delta: 'abc' }));

    expect(result).toEqual({
      ok: false,
      error: 'Valor informado é inválido.',
    });
  });

  it('rejects blank numeric input', () => {
    const result = parseAdjustBalanceForm(buildFormData({ userId: 'abc', delta: '   ' }));

    expect(result).toEqual({
      ok: false,
      error: 'Valor informado é inválido.',
    });
  });

  it('omits optional reason when blank', () => {
    const result = parseAdjustBalanceForm(
      buildFormData({ userId: 'abc', delta: '10', reason: '   ' })
    );

    expect(result).toEqual({
      ok: true,
      value: {
        userId: 'abc',
        delta: 10,
        reason: undefined,
      },
    });
  });
});

describe('adjustBalanceAction', () => {
  beforeEach(() => {
    executeMock.mockReset();
    commandCtorMock.mockClear();
    commandCtorMock.mockImplementation(() => ({ execute: executeMock }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('short-circuits when validation fails', async () => {
    const result = await adjustBalanceAction(
      adminActionInitialState,
      buildFormData({ delta: '10' })
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Usuário inválido.',
    });
    expect(commandCtorMock).not.toHaveBeenCalled();
  });

  it('delegates to command and returns success state', async () => {
    executeMock.mockResolvedValue({
      success: true,
      message: 'Saldo creditado com sucesso.',
      snapshot: { balance: 100, updatedAt: '2024-01-01T00:00:00Z' },
    });

    const result = await adjustBalanceAction(
      adminActionInitialState,
      buildFormData({ userId: ' user-1 ', delta: '5', reason: '  dep ' })
    );

    expect(commandCtorMock).toHaveBeenCalledWith({
      userId: 'user-1',
      delta: 5,
      reason: 'dep',
    });
    expect(result).toEqual({
      status: 'success',
      message: 'Saldo creditado com sucesso.',
      snapshot: { balance: 100, updatedAt: '2024-01-01T00:00:00Z' },
    });
  });

  it('returns error state when command fails', async () => {
    executeMock.mockResolvedValue({
      success: false,
      message: 'Informe um valor diferente de zero.',
    });

    const result = await adjustBalanceAction(
      adminActionInitialState,
      buildFormData({ userId: 'user-1', delta: '-5' })
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Informe um valor diferente de zero.',
      snapshot: undefined,
    });
  });

  it('handles unexpected command errors gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    executeMock.mockRejectedValue(new Error('DB offline'));

    const result = await adjustBalanceAction(
      adminActionInitialState,
      buildFormData({ userId: 'user-1', delta: '5' })
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Falha inesperada ao ajustar saldo.',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'adjustBalanceAction failed',
      expect.any(Error)
    );
  });
});
