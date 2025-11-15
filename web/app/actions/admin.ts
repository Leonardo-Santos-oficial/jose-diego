'use server';

import { AdjustWalletBalanceCommand } from '@/modules/admin/commands/AdjustWalletBalanceCommand';
import type { AdminActionState } from '@/modules/admin/types/actionState';
import { parseAdjustBalanceForm } from '@/modules/admin/services/parseAdjustBalanceForm';

const UNEXPECTED_ERROR = 'Falha inesperada ao ajustar saldo.';
const isE2EEnabled = process.env.NEXT_PUBLIC_E2E === '1';

export async function adjustBalanceAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const validation = parseAdjustBalanceForm(formData);

  if (!validation.ok) {
    return {
      status: 'error',
      message: validation.error,
    };
  }

  if (isE2EEnabled) {
    const { simulateAdminAdjustment } = await import(
      '../../tests/mocks/adminRealtimeHarness'
    );
    return simulateAdminAdjustment(validation.value);
  }

  try {
    const command = new AdjustWalletBalanceCommand(validation.value);
    const result = await command.execute();

    return {
      status: result.success ? 'success' : 'error',
      message: result.message,
      snapshot: result.snapshot,
    };
  } catch (error) {
    console.error('adjustBalanceAction failed', error);
    return {
      status: 'error',
      message: UNEXPECTED_ERROR,
    };
  }
}
