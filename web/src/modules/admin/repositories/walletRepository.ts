import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

export type WalletRow = {
  user_id: string;
  balance: number;
  updated_at: string;
};

export interface WalletRepository {
  listWallets(): Promise<WalletRow[]>;
  adjustBalance(userId: string, delta: number): Promise<WalletRow>;
}

class SupabaseWalletRepository implements WalletRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listWallets(): Promise<WalletRow[]> {
    const { data, error } = await this.client
      .from('wallets')
      .select('user_id, balance, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Falha ao buscar carteiras: ${error.message}`);
    }

    return data ?? [];
  }

  async adjustBalance(userId: string, delta: number): Promise<WalletRow> {
    const { data: currentData, error: fetchError } = await this.client
      .from('wallets')
      .select('user_id, balance, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Falha ao buscar saldo atual: ${fetchError.message}`);
    }

    const nextBalance = Number(currentData?.balance ?? 0) + delta;

    if (nextBalance < 0) {
      throw new Error('Saldo resultante não pode ser negativo.');
    }

    const { data, error } = await this.client
      .from('wallets')
      .upsert(
        {
          user_id: userId,
          balance: nextBalance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      )
      .select('user_id, balance, updated_at')
      .single();

    if (error) {
      throw new Error(`Falha ao ajustar saldo: ${error.message}`);
    }

    return data as WalletRow;
  }
}

export function createWalletRepository(
  client: SupabaseClient = getSupabaseServiceRoleClient()
): WalletRepository {
  return new SupabaseWalletRepository(client);
}
