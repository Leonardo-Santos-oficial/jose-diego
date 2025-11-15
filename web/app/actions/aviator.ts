'use server';

import type { AviatorActionState } from '@/app/actions/aviator-state';
import type { BetResultMessage, CashoutResultMessage } from '@/types/aviator';

const nodeServiceUrl = process.env.AVIATOR_NODE_URL ?? process.env.NODE_SERVICE_URL ?? '';
const missingNodeServiceMessage =
  'Defina AVIATOR_NODE_URL (ex.: http://localhost:8081) no arquivo .env.local para usar as ações do Aviator.';

async function postToNodeService<T>(path: string, payload: unknown): Promise<T> {
  if (!nodeServiceUrl) {
    throw new Error(missingNodeServiceMessage);
  }

  const response = await fetch(`${nodeServiceUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Serviço Node respondeu ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function placeBetAction(
  _prev: AviatorActionState<BetResultMessage>,
  formData: FormData
): Promise<AviatorActionState<BetResultMessage>> {
  'use server';

  const userId = (formData.get('userId') ?? '').toString().trim();
  const roundId = (formData.get('roundId') ?? '').toString().trim();
  const amount = Number(formData.get('amount'));
  const autopayoutMultiplier = formData.get('autopayoutMultiplier');

  if (!userId || !roundId) {
    return { status: 'error', message: 'Usuário e round são obrigatórios.' };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: 'error', message: 'Informe um valor de aposta válido.' };
  }

  try {
    const payload = {
      userId,
      roundId,
      amount,
      autopayoutMultiplier: autopayoutMultiplier
        ? Number(autopayoutMultiplier)
        : undefined,
    };

    const result = await postToNodeService<BetResultMessage>('/bets', payload);

    if (result.status === 'rejected') {
      return {
        status: 'error',
        message: result.reason ?? 'Aposta rejeitada.',
        data: result,
      };
    }

    return { status: 'success', message: 'Aposta enviada com sucesso.', data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao enviar aposta.';
    return { status: 'error', message };
  }
}

export async function cashoutAction(
  _prev: AviatorActionState<CashoutResultMessage>,
  formData: FormData
): Promise<AviatorActionState<CashoutResultMessage>> {
  'use server';

  const userId = (formData.get('userId') ?? '').toString().trim();
  const ticketId = (formData.get('ticketId') ?? '').toString().trim();
  const kind = (formData.get('kind') ?? 'manual').toString().trim() as 'manual' | 'auto';

  if (!userId || !ticketId) {
    return { status: 'error', message: 'Ticket e usuário são obrigatórios.' };
  }

  try {
    const payload = { userId, ticketId, kind };
    const result = await postToNodeService<CashoutResultMessage>('/cashout', payload);

    if (result.status === 'rejected') {
      return {
        status: 'error',
        message: result.reason ?? 'Cashout rejeitado.',
        data: result,
      };
    }

    return { status: 'success', message: 'Cashout solicitado.', data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Falha ao solicitar cashout.';
    return { status: 'error', message };
  }
}
