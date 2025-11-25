import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import type {
  GlobalChatMessage,
  GlobalChatRepository,
  SendGlobalMessageInput,
} from '../types';

const TABLE_NAME = 'global_chat_messages';

export class SupabaseGlobalChatRepository implements GlobalChatRepository {
  constructor(
    private readonly client: SupabaseClient = getSupabaseServiceRoleClient()
  ) {}

  async saveMessage(input: SendGlobalMessageInput): Promise<GlobalChatMessage> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .insert({
        user_id: input.userId,
        user_name: input.userName,
        body: input.body,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to save global chat message: ${error.message}`);
    }

    return this.mapRowToMessage(data);
  }

  async fetchRecentMessages(limit: number): Promise<GlobalChatMessage[]> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch global chat messages: ${error.message}`);
    }

    // Reverse to show oldest first (chronological order) if needed by UI,
    // but usually UI handles that. Let's return as is (newest first) or reverse?
    // Chat usually renders bottom-up.
    // Let's return newest first (descending) as fetched, UI can reverse.
    return (data || []).map(this.mapRowToMessage);
  }

  private mapRowToMessage(row: any): GlobalChatMessage {
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      body: row.body,
      createdAt: row.created_at,
    };
  }
}
