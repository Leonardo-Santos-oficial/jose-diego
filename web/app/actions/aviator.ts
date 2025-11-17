'use server';

import type { AviatorActionState } from '@/app/actions/aviator-state';
import type { BetResultMessage, CashoutResultMessage } from '@/types/aviator';
import {
  PlayerCommandError,
  PlayerCommandService,
} from '@/modules/aviator/services/playerCommandService';

export async function placeBetAction(
  _prev: AviatorActionState<BetResultMessage>,
  formData: FormData
): Promise<AviatorActionState<BetResultMessage>> {
  'use server';

  const roundId = (formData.get('roundId') ?? '').toString().trim();
  const amount = Number(formData.get('amount'));
  const autopayoutMultiplier = formData.get('autopayoutMultiplier');

  try {
    const service = await PlayerCommandService.forCurrentUser();
    const result = await service.placeBet({
      roundId,
      amount,
      autopayoutMultiplier: autopayoutMultiplier
        ? Number(autopayoutMultiplier)
        : undefined,
    });

    if (result.status === 'rejected') {
      return {
        status: 'error',
        message: result.reason ?? 'Aposta rejeitada.',
        data: result,
      };
    }

    return { status: 'success', message: 'Aposta enviada com sucesso.', data: result };
  } catch (error) {
    if (error instanceof PlayerCommandError) {
      return { status: 'error', message: error.message };
    }

    const message = error instanceof Error ? error.message : 'Falha ao enviar aposta.';
    return { status: 'error', message };
  }
}

export async function cashoutAction(
  _prev: AviatorActionState<CashoutResultMessage>,
  formData: FormData
): Promise<AviatorActionState<CashoutResultMessage>> {
  'use server';

  const ticketId = (formData.get('ticketId') ?? '').toString().trim();
  const kind = (formData.get('kind') ?? 'manual').toString().trim() as 'manual' | 'auto';

  try {
    const service = await PlayerCommandService.forCurrentUser();
    const result = await service.cashout({ ticketId, kind });

    if (result.status === 'rejected') {
      return {
        status: 'error',
        message: result.reason ?? 'Cashout rejeitado.',
        data: result,
      };
    }

    return { status: 'success', message: 'Cashout solicitado.', data: result };
  } catch (error) {
    if (error instanceof PlayerCommandError) {
      return { status: 'error', message: error.message };
    }

    const message =
      error instanceof Error ? error.message : 'Falha ao solicitar cashout.';
    return { status: 'error', message };
  }
}
