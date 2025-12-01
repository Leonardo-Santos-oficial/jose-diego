'use server';

import { z } from 'zod';
import { getCurrentSession } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/serverClient';
import type { ProfileActionState } from '@/app/actions/profile-state';

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(60, 'Use no máximo 60 caracteres para o nome.')
    .default(''),
  pixKey: z
    .string()
    .trim()
    .max(140, 'Sua chave Pix deve ter até 140 caracteres.')
    .default(''),
  preferredWithdrawMethod: z.enum(['pix', 'bank']).default('pix'),
  bankName: z.string().trim().max(60).default(''),
  bankAgency: z.string().trim().max(10).default(''),
  bankAccount: z.string().trim().max(20).default(''),
  bankAccountType: z.enum(['corrente', 'poupanca']).default('corrente'),
  bankHolderName: z.string().trim().max(100).default(''),
  bankHolderCpf: z.string().trim().max(14).default(''),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  'use server';

  const session = await getCurrentSession();
  const userId = session?.id;

  if (!userId) {
    return { status: 'error', message: 'Faça login para atualizar seu perfil.' };
  }

  const parsed = profileSchema.safeParse({
    displayName: formData.get('displayName') ?? '',
    pixKey: formData.get('pixKey') ?? '',
    preferredWithdrawMethod: formData.get('preferredWithdrawMethod') ?? 'pix',
    bankName: formData.get('bankName') ?? '',
    bankAgency: formData.get('bankAgency') ?? '',
    bankAccount: formData.get('bankAccount') ?? '',
    bankAccountType: formData.get('bankAccountType') ?? 'corrente',
    bankHolderName: formData.get('bankHolderName') ?? '',
    bankHolderCpf: formData.get('bankHolderCpf') ?? '',
    avatarUrl: formData.get('avatarUrl') || null,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Dados inválidos.';
    return { status: 'error', message: firstIssue };
  }

  const {
    displayName,
    pixKey,
    preferredWithdrawMethod,
    bankName,
    bankAgency,
    bankAccount,
    bankAccountType,
    bankHolderName,
    bankHolderCpf,
    avatarUrl,
  } = parsed.data;

  try {
    const supabase = await getSupabaseServerClient();
    const { error: upsertError } = await supabase.from('user_profiles').upsert({
      user_id: userId,
      display_name: displayName || null,
      pix_key: pixKey || null,
      preferred_withdraw_method: preferredWithdrawMethod,
      bank_name: bankName || null,
      bank_agency: bankAgency || null,
      bank_account: bankAccount || null,
      bank_account_type: bankAccountType || null,
      bank_holder_name: bankHolderName || null,
      bank_holder_cpf: bankHolderCpf || null,
      avatar_url: avatarUrl || null,
    });

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    const { error: updateUserError } = await supabase.auth.updateUser({
      data: { display_name: displayName || null },
    });

    if (updateUserError) {
      throw new Error(updateUserError.message);
    }

    return { status: 'success', message: 'Perfil atualizado com sucesso.' };
  } catch (error) {
    console.error('[profile] erro ao atualizar', error);
    const message =
      error instanceof Error ? error.message : 'Não foi possível salvar suas alterações.';
    return { status: 'error', message };
  }
}
