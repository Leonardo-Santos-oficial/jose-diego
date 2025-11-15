import { getSupabaseServerClient } from '@/lib/supabase/serverClient';
import type { WalletSnapshot } from '@/types/aviator';

export async function getWalletSnapshot(userId: string): Promise<WalletSnapshot | null> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('wallets')
    .select('balance, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar carteira do usuário: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    balance: Number(data.balance ?? 0),
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}
