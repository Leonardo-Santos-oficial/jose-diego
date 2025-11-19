import { ChatService } from '@/modules/chat/services/chatService';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

export type AdminChatSnapshot = {
  threads: Array<ChatThread & { messages: ChatMessage[] }>;
};

const adminChatService = new ChatService(async () => getSupabaseServiceRoleClient());

const THREAD_LIMIT = 20;

export async function getAdminChatSnapshot(): Promise<AdminChatSnapshot> {
  const threads = await adminChatService.listThreadsForAdmin({
    status: 'open',
    limit: THREAD_LIMIT,
  });

  const withMessages = await Promise.all(
    threads.map(async (thread) => ({
      ...thread,
      messages: await adminChatService.listMessages(thread.id, 100),
    }))
  );

  return { threads: withMessages };
}
