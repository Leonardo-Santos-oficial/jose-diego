'use server';

import { getCurrentSession } from '@/lib/auth/session';
import { BenefitsService } from '@/modules/benefits/services';
import type { ClaimBenefitResult, BenefitsSummary } from '@/modules/benefits/types';

export interface BenefitsActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  data?: ClaimBenefitResult;
}

export async function claimBenefitAction(
  _prevState: BenefitsActionState,
  formData: FormData
): Promise<BenefitsActionState> {
  const session = await getCurrentSession();
  if (!session?.id) {
    return { status: 'error', message: 'Você precisa estar logado para resgatar benefícios.' };
  }

  const userBenefitId = formData.get('userBenefitId')?.toString().trim();
  if (!userBenefitId) {
    return { status: 'error', message: 'ID do benefício não informado.' };
  }

  try {
    const result = await BenefitsService.claimBenefit(session.id, userBenefitId);
    
    if (!result.success) {
      return { status: 'error', message: result.message };
    }

    return {
      status: 'success',
      message: result.message,
      data: result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao resgatar benefício.';
    return { status: 'error', message };
  }
}

export async function getBenefitsSummaryAction(): Promise<BenefitsSummary | null> {
  const session = await getCurrentSession();
  if (!session?.id) return null;

  try {
    return await BenefitsService.getBenefitsSummary(session.id);
  } catch {
    return null;
  }
}
