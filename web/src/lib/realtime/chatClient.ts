import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';

function mapMessage(row: Record<string, unknown> | null): ChatMessage | null {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id ?? 0),
    threadId: String(row.thread_id ?? ''),
    userId: (row.user_id as string | null) ?? null,
    senderRole: (row.sender_role as ChatMessage['senderRole']) ?? 'user',
    body: String(row.body ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  } satisfies ChatMessage;
}

function mapThread(row: Record<string, unknown> | null): ChatThread | null {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id ?? ''),
    userId: (row.user_id as string | null) ?? null,
    status: (row.status as ChatThread['status']) ?? 'open',
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    closedAt: (row.closed_at as string | null) ?? null,
    closedBy: (row.closed_by as string | null) ?? null,
    assignedAdminId: (row.assigned_admin_id as string | null) ?? null,
    metadata: (row.metadata as ChatThread['metadata']) ?? {},
  } satisfies ChatThread;
}

type MessageHandler = (message: ChatMessage) => void;
type ThreadHandler = (thread: ChatThread) => void;

type SubscribeReturn = () => void;

export class ChatRealtimeClient {
  private channels: RealtimeChannel[] = [];

  constructor(private readonly supabase: SupabaseClient = getSupabaseClient()) {}

  subscribeToThreadMessages(threadId: string, handler: MessageHandler): SubscribeReturn {
    const channel = this.supabase
      .channel(`chat.thread.${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const mapped = mapMessage(payload.new as Record<string, unknown>);
          if (mapped) {
            handler(mapped);
          }
        }
      )
      .subscribe();

    this.channels.push(channel);
    return () => this.removeChannel(channel);
  }

  subscribeToAllMessages(handler: MessageHandler): SubscribeReturn {
    const channel = this.supabase
      .channel('chat.messages.all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const mapped = mapMessage(payload.new as Record<string, unknown>);
          if (mapped) {
            handler(mapped);
          }
        }
      )
      .subscribe();

    this.channels.push(channel);
    return () => this.removeChannel(channel);
  }

  subscribeToThreadUpdates(handler: ThreadHandler): SubscribeReturn {
    const channel = this.supabase
      .channel('chat.threads.updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_threads' },
        (payload) => {
          const mapped = mapThread(
            (payload.new || payload.old) as Record<string, unknown>
          );
          if (mapped) {
            handler(mapped);
          }
        }
      )
      .subscribe();

    this.channels.push(channel);
    return () => this.removeChannel(channel);
  }

  dispose(): void {
    this.channels.forEach((channel) => {
      void this.supabase.removeChannel(channel);
    });
    this.channels = [];
  }

  private removeChannel(channel: RealtimeChannel) {
    void this.supabase.removeChannel(channel);
    this.channels = this.channels.filter((item) => item !== channel);
  }
}
