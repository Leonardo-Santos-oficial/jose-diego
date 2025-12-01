import { getSupabaseServerClient } from '@/lib/supabase/serverClient';
import type { BankAccount, BankAccountType, WithdrawMethod } from '../types';

export type UserProfile = {
  displayName: string;
  pixKey: string;
  preferredWithdrawMethod: WithdrawMethod;
  bankAccount: BankAccount | null;
  avatarUrl: string | null;
};

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      display_name,
      pix_key,
      preferred_withdraw_method,
      bank_name,
      bank_agency,
      bank_account,
      bank_account_type,
      bank_holder_name,
      bank_holder_cpf,
      avatar_url
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Falha ao carregar perfil do usuário: ${error.message}`);
  }

  const hasBankData = data?.bank_name && data?.bank_account;

  return {
    displayName: data?.display_name ?? '',
    pixKey: data?.pix_key ?? '',
    preferredWithdrawMethod: (data?.preferred_withdraw_method as WithdrawMethod) ?? 'pix',
    bankAccount: hasBankData
      ? {
          bankName: data.bank_name ?? '',
          agency: data.bank_agency ?? '',
          account: data.bank_account ?? '',
          accountType: (data.bank_account_type as BankAccountType) ?? 'corrente',
          holderName: data.bank_holder_name ?? '',
          holderCpf: data.bank_holder_cpf ?? '',
        }
      : null,
    avatarUrl: data?.avatar_url ?? null,
  };
}
