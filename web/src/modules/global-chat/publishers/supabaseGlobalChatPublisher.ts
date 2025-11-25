import type { GlobalChatMessage, GlobalChatPublisher } from '../types';

const CHANNEL_NAME = 'global-chat';
const EVENT_NAME = 'new-message';

export class SupabaseGlobalChatPublisher implements GlobalChatPublisher {
  private readonly realtimeUrl: string;
  private readonly serviceRoleKey: string;

  constructor(
    projectUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  ) {
    if (!projectUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration for Realtime Publisher');
    }
    this.serviceRoleKey = serviceRoleKey;
    const url = new URL(projectUrl);
    url.pathname = '/realtime/v1';
    this.realtimeUrl = url.toString().replace(/\/$/, '');
  }

  async publishMessage(message: GlobalChatMessage): Promise<void> {
    const payload = {
      type: 'broadcast',
      event: EVENT_NAME,
      payload: message,
    };

    const response = await fetch(`${this.realtimeUrl}/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            topic: CHANNEL_NAME,
            payload,
            event: EVENT_NAME,
          },
        ],
      }),
    });

    if (!response.ok) {
      // If realtime is not available (e.g. local dev without realtime server), just log warning
      // instead of crashing the action.
      const text = await response.text();
      console.warn(`[GlobalChat] Failed to publish realtime message: ${text}`);
      // throw new Error(`Failed to publish global chat message: ${text}`);
    }
  }
}
