import { ChatService } from '@/modules/chat/services/chatService';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import type { ChatThread } from '@/modules/chat/types';

export type ChatAnalyticsSnapshot = {
  totals: {
    open: number;
    closed: number;
  };
  recentClosed: ChatThread[];
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

  return {
    totals: {
      open: openCount ?? 0,
      closed: closedCount ?? 0,
    },
    recentClosed,
  } satisfies ChatAnalyticsSnapshot;
}
