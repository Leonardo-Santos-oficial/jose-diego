import { describe, expect, it, vi } from 'vitest';

import { AdjustWalletBalanceCommand } from '@/modules/admin/commands/AdjustWalletBalanceCommand';
import type { WalletRepository } from '@/modules/admin/repositories/walletRepository';

const buildRepository = () => {
  const adjustBalance = vi.fn();
  return {
    listWallets: vi.fn(),
    adjustBalance,
  } satisfies WalletRepository;
};

describe('AdjustWalletBalanceCommand', () => {
  it('rejects missing user ids', async () => {
    const command = new AdjustWalletBalanceCommand({ userId: '', delta: 10 });

    await expect(command.execute()).resolves.toEqual({
      success: false,
      message: 'Usuário obrigatório.',
    });
  });

  it('rejects invalid deltas', async () => {
    const command = new AdjustWalletBalanceCommand({ userId: 'user-1', delta: 0 });

    await expect(command.execute()).resolves.toEqual({
      success: false,
      message: 'Informe um valor diferente de zero.',
    });
  });

  it('returns debit success payload and snapshot', async () => {
    const repository = buildRepository();
    repository.adjustBalance.mockResolvedValueOnce({
      user_id: 'user-1',
      balance: 75,
      updated_at: '2024-05-01T12:00:00.000Z',
    });

    const command = new AdjustWalletBalanceCommand(
      { userId: 'user-1', delta: -25 },
      repository
    );

    await expect(command.execute()).resolves.toEqual({
      success: true,
      message: 'Saldo debitado com sucesso.',
      snapshot: {
        balance: 75,
        updatedAt: '2024-05-01T12:00:00.000Z',
      },
    });
  });

  it('returns credit success payload', async () => {
    const repository = buildRepository();
    repository.adjustBalance.mockResolvedValueOnce({
      user_id: 'user-1',
      balance: 125,
      updated_at: '2024-05-02T12:00:00.000Z',
    });

    const command = new AdjustWalletBalanceCommand(
      { userId: 'user-1', delta: 25 },
      repository
    );

    const result = await command.execute();

    expect(result).toEqual({
      success: true,
      message: 'Saldo creditado com sucesso.',
      snapshot: { balance: 125, updatedAt: '2024-05-02T12:00:00.000Z' },
    });
  });

  it('propagates repository errors as user-friendly messages', async () => {
    const repository = buildRepository();
    repository.adjustBalance.mockRejectedValueOnce(
      new Error('Saldo resultante não pode ser negativo.')
    );

    const command = new AdjustWalletBalanceCommand(
      { userId: 'user-1', delta: -500 },
      repository
    );

    await expect(command.execute()).resolves.toEqual({
      success: false,
      message: 'Saldo resultante não pode ser negativo.',
    });
  });
});
