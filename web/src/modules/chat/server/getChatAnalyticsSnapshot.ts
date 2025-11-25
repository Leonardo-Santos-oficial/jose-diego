import { ChatService } from '@/modules/chat/services/chatService';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import type { ChatThread } from '@/modules/chat/types';

export type ChatThreadWithUser = ChatThread & {
  user?: {
    email?: string;
    displayName?: string;
  };
};

export type ChatAnalyticsSnapshot = {
  totals: {
    open: number;
    closed: number;
  };
  recentClosed: ChatThreadWithUser[];
};

const service = new ChatService(async () => getSupabaseServiceRoleClient());

export async function getChatAnalyticsSnapshot(): Promise<ChatAnalyticsSnapshot> {
  const client = getSupabaseServiceRoleClient();

  const [
    { count: openCount, error: openError },
    { count: closedCount, error: closedError },
  ] = await Promise.all([
    client
      .from('chat_threads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),
    client
      .from('chat_threads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'closed'),
  ]);

  if (openError) {
    throw new Error(`Falha ao contar threads abertas: ${openError.message}`);
  }

  if (closedError) {
    throw new Error(`Falha ao contar threads fechadas: ${closedError.message}`);
  }

  const recentClosed = await service.listClosedThreads({ limit: 20 });

  // --- Fetch User Details ---
  const userIds = Array.from(new Set(recentClosed.map((t) => t.userId).filter(Boolean))) as string[];
  const userMap = new Map<string, { email?: string; displayName?: string }>();

  if (userIds.length > 0) {
    // 1. Fetch profiles (public schema)
    const { data: profiles } = await client
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    profiles?.forEach((p) => {
      userMap.set(p.user_id, { displayName: p.display_name || undefined });
    });

    // 2. Fetch emails (auth schema) - parallel requests
    await Promise.all(
      userIds.map(async (uid) => {
        const { data } = await client.auth.admin.getUserById(uid);
        if (data?.user) {
          const existing = userMap.get(uid) || {};
          userMap.set(uid, { ...existing, email: data.user.email });
        }
      })
    );
  }

  const recentClosedWithUser = recentClosed.map((thread) => ({
    ...thread,
    user: thread.userId ? userMap.get(thread.userId) : undefined,
  }));

  return {
    totals: {
      open: openCount ?? 0,
      closed: closedCount ?? 0,
    },
    recentClosed: recentClosedWithUser,
  } satisfies ChatAnalyticsSnapshot;
}
