import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import type {
  CreateWithdrawInput,
  WithdrawRequest,
  WithdrawStatus,
} from '@/modules/withdraw/types';

export interface WithdrawRepository {
  create(input: CreateWithdrawInput): Promise<WithdrawRequest>;
  listAll(): Promise<WithdrawRequest[]>;
  listByUser(userId: string): Promise<WithdrawRequest[]>;
  getById(id: string): Promise<WithdrawRequest | null>;
  updateStatus(id: string, status: WithdrawStatus): Promise<WithdrawRequest>;
}

class SupabaseWithdrawRepository implements WithdrawRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: CreateWithdrawInput): Promise<WithdrawRequest> {
    const { data, error } = await this.client
      .from('withdraw_requests')
      .insert({
        user_id: input.userId,
        amount: input.amount,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Falha ao registrar solicitação de saque: ${error.message}`);
    }

    return mapRow(data);
  }

  async listAll(): Promise<WithdrawRequest[]> {
    const { data, error } = await this.client
      .from('withdraw_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Falha ao buscar saques: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async listByUser(userId: string): Promise<WithdrawRequest[]> {
    const { data, error } = await this.client
      .from('withdraw_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Falha ao buscar saques do usuário: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async getById(id: string): Promise<WithdrawRequest | null> {
    const { data, error } = await this.client
      .from('withdraw_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Falha ao buscar saque: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async updateStatus(id: string, status: WithdrawStatus): Promise<WithdrawRequest> {
    const request = await this.getById(id);
    if (!request) {
      throw new Error('Solicitação de saque não encontrada.');
    }

    if (status === 'approved') {
      const { data: wallet, error: walletError } = await this.client
        .from('wallets')
        .select('balance')
        .eq('user_id', request.userId)
        .single();

      if (walletError) {
        throw new Error(`Falha ao buscar carteira: ${walletError.message}`);
      }

      const currentBalance = Number(wallet?.balance ?? 0);
      if (currentBalance < request.amount) {
        throw new Error(`Saldo insuficiente. Saldo: R$ ${currentBalance.toFixed(2)}, Saque: R$ ${request.amount.toFixed(2)}`);
      }

      const { error: deductError } = await this.client
        .from('wallets')
        .update({ 
          balance: currentBalance - request.amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', request.userId);

      if (deductError) {
        throw new Error(`Falha ao deduzir saldo: ${deductError.message}`);
      }
    }

    const { data, error } = await this.client
      .from('withdraw_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar status do saque: ${error.message}`);
    }

    return mapRow(data);
  }
}

function mapRow(row: any): WithdrawRequest {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createWithdrawRepository(
  client: SupabaseClient = getSupabaseServiceRoleClient()
): WithdrawRepository {
  return new SupabaseWithdrawRepository(client);
}
