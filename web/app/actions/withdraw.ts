'use server';

import { revalidatePath } from 'next/cache';
import { WithdrawService } from '@/modules/withdraw/services/withdrawService';
import type { WithdrawActionState } from '@/app/actions/withdraw-state';
import { getCurrentSession } from '@/lib/auth/session';

const withdrawService = new WithdrawService();

export async function requestWithdrawAction(
  _prevState: WithdrawActionState,
  formData: FormData
): Promise<WithdrawActionState> {
  'use server';

  const session = await getCurrentSession();
  const userId = session?.user.id;
  const amount = Number(formData.get('amount'));

  if (!userId) {
    return { status: 'error', message: 'Usuário não identificado.' };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: 'error', message: 'Informe um valor válido.' };
  }

  try {
    await withdrawService.requestWithdraw({ userId, amount });
    return { status: 'success', message: 'Solicitação enviada com sucesso.' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Falha ao solicitar saque.',
    };
  }
}

export async function updateWithdrawStatusAction(formData: FormData): Promise<void> {
  'use server';

  const id = safeString(formData.get('requestId'));
  const intent = safeString(formData.get('intent'));

  if (!id || !intent) {
    console.warn('[withdraw] Requisição inválida para atualização de status.');
    return;
  }

  try {
    if (intent === 'approve') {
      await withdrawService.approve(id);
    } else if (intent === 'reject') {
      await withdrawService.reject(id);
    } else {
      throw new Error('Ação desconhecida.');
    }

    revalidatePath('/admin/withdrawals');
  } catch (error) {
    console.error('[withdraw] Erro ao atualizar status', error);
  }
}

function safeString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}
