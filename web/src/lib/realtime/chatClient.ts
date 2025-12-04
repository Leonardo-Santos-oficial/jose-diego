import type { RealtimeChannel, SupabaseClient, RealtimePresenceState } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';

export type PresenceState = {
  odigo: string;
  odigo_at: string;
};

export type UserPresenceMap = Map<string, boolean>;

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

  /**
   * Subscribe to user presence updates
   * Returns a map of userId -> isOnline
   */
  subscribeToPresence(
    userIds: string[],
    handler: (presenceMap: UserPresenceMap) => void
  ): SubscribeReturn {
    // Use channel() without config to get existing channel or create new one
    const channel = this.supabase.channel('chat-presence');

    const updatePresence = () => {
      const state = channel.presenceState<{ user_id: string }>();
      console.log('[Presence] State updated:', state);
      const presenceMap: UserPresenceMap = new Map();
      
      // Initialize all users as offline
      userIds.forEach((id) => presenceMap.set(id, false));
      
      // Mark online users
      Object.values(state).forEach((presences) => {
        presences.forEach((presence) => {
          console.log('[Presence] Found presence:', presence);
          if (presence.user_id && userIds.includes(presence.user_id)) {
            presenceMap.set(presence.user_id, true);
          }
        });
      });
      
      console.log('[Presence] Final map:', Object.fromEntries(presenceMap));
      handler(presenceMap);
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('[Presence] Sync event');
        updatePresence();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] Join event:', key, newPresences);
        updatePresence();
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] Leave event:', key, leftPresences);
        updatePresence();
      })
      .subscribe((status) => {
        console.log('[Presence] Admin subscribe status:', status);
      });

    this.channels.push(channel);
    return () => this.removeChannel(channel);
  }

  /**
   * Track current user's presence in the chat
   */
  async trackPresence(userId: string): Promise<SubscribeReturn> {
    // Use same channel name as subscribeToPresence
    const channel = this.supabase.channel('chat-presence');
    
    console.log('[Presence] Tracking user:', userId);

    await channel.subscribe(async (status) => {
      console.log('[Presence] User subscribe status:', status);
      if (status === 'SUBSCRIBED') {
        const trackResult = await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        console.log('[Presence] Track result:', trackResult);
      }
    });

    this.channels.push(channel);
    return () => {
      console.log('[Presence] Untracking user:', userId);
      void channel.untrack();
      this.removeChannel(channel);
    };
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
