import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { GlobalChatMessage } from '@/modules/global-chat/types';

const CHANNEL_NAME = 'global-chat';
const EVENT_NAME = 'new-message';

type MessageHandler = (message: GlobalChatMessage) => void;

export class GlobalChatRealtimeClient {
  private channel: RealtimeChannel | null = null;

  constructor(private readonly supabase: SupabaseClient = getSupabaseClient()) {}

  subscribe(handler: MessageHandler): () => void {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = this.supabase
      .channel(CHANNEL_NAME)
      .on(
        'broadcast',
        { event: EVENT_NAME },
        (payload) => {
          if (payload.payload) {
            handler(payload.payload as GlobalChatMessage);
          }
        }
      )
      .subscribe();

    return () => {
      this.channel?.unsubscribe();
      this.channel = null;
    };
  }
}
