import { ChatService } from '@/modules/chat/services/chatService';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

export type AdminChatThread = ChatThread & {
  messages: ChatMessage[];
  user?: {
    email?: string;
    displayName?: string;
  };
};

export type AdminChatSnapshot = {
  threads: AdminChatThread[];
};

const adminChatService = new ChatService(async () => getSupabaseServiceRoleClient());

const THREAD_LIMIT = 20;

export async function getAdminChatSnapshot(): Promise<AdminChatSnapshot> {
  const threads = await adminChatService.listThreadsForAdmin({
    status: 'open',
    limit: THREAD_LIMIT,
  });

  const userIds = Array.from(new Set(threads.map((t) => t.userId).filter(Boolean))) as string[];
  const userMap = new Map<string, { email?: string; displayName?: string }>();

  if (userIds.length > 0) {
    const supabase = getSupabaseServiceRoleClient();

    // 1. Fetch profiles (public schema)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    profiles?.forEach((p) => {
      userMap.set(p.user_id, { displayName: p.display_name || undefined });
    });

    // 2. Fetch emails (auth schema) - parallel requests
    await Promise.all(
      userIds.map(async (uid) => {
        const { data } = await supabase.auth.admin.getUserById(uid);
        if (data?.user) {
          const existing = userMap.get(uid) || {};
          userMap.set(uid, { ...existing, email: data.user.email });
        }
      })
    );
  }

  const withMessages = await Promise.all(
    threads.map(async (thread) => ({
      ...thread,
      messages: await adminChatService.listMessages(thread.id, 100),
      user: thread.userId ? userMap.get(thread.userId) : undefined,
    }))
  );

  return { threads: withMessages };
}
