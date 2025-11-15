import { createWalletRepository } from '@/modules/admin/repositories/walletRepository';
import type { WalletRepository } from '@/modules/admin/repositories/walletRepository';
import type {
  BalanceAdjustmentInput,
  BalanceAdjustmentResult,
} from '@/modules/admin/types';
import type { AdminCommand } from '@/modules/admin/commands/types';

export class AdjustWalletBalanceCommand implements AdminCommand<BalanceAdjustmentResult> {
  constructor(
    private readonly input: BalanceAdjustmentInput,
    private repository?: WalletRepository
  ) {}

  private getRepository(): WalletRepository {
    if (!this.repository) {
      this.repository = createWalletRepository();
    }

    return this.repository;
  }

  async execute(): Promise<BalanceAdjustmentResult> {
    if (!this.input.userId) {
      return {
        success: false,
        message: 'Usuário obrigatório.',
      };
    }

    if (Number.isNaN(this.input.delta) || this.input.delta === 0) {
      return {
        success: false,
        message: 'Informe um valor diferente de zero.',
      };
    }

    try {
      const repository = this.getRepository();
      const wallet = await repository.adjustBalance(this.input.userId, this.input.delta);

      return {
        success: true,
        message:
          this.input.delta > 0
            ? 'Saldo creditado com sucesso.'
            : 'Saldo debitado com sucesso.',
        snapshot: {
          balance: Number(wallet.balance),
          updatedAt: wallet.updated_at,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha inesperada ao ajustar saldo.';
      return {
        success: false,
        message,
      };
    }
  }
}
