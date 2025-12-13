import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import type { UserDataPurgeRepository, UserDataPurgeResult } from '../types';

type AdminPurgeRpcResponse = {
  user_id: string;
  deleted: {
    global_chat_messages: number;
    chat_messages: number;
    chat_threads: number;
    withdraw_requests: number;
    bets: number;
  };
};

export class SupabaseUserDataPurgeRepository implements UserDataPurgeRepository {
  constructor(
    private readonly client: SupabaseClient = getSupabaseServiceRoleClient()
  ) {}

  async purgeUserData(userId: string): Promise<UserDataPurgeResult> {
    const { data, error } = await this.client.rpc('admin_purge_user_data', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Falha ao apagar dados do usuário: ${error.message}`);
    }

    const payload = data as unknown as AdminPurgeRpcResponse | null;

    return {
      userId,
      deleted: {
        globalChatMessages: Number(payload?.deleted?.global_chat_messages ?? 0),
        chatMessages: Number(payload?.deleted?.chat_messages ?? 0),
        chatThreads: Number(payload?.deleted?.chat_threads ?? 0),
        withdrawRequests: Number(payload?.deleted?.withdraw_requests ?? 0),
        bets: Number(payload?.deleted?.bets ?? 0),
      },
    };
  }
}
