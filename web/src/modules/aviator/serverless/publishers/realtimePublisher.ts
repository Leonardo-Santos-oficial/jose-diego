import type {
  BetResultMessage,
  CashoutResultMessage,
  GameHistoryMessage,
  GameStateMessage,
} from '@/types/aviator';
import { AVIATOR_CHANNELS } from '@/modules/aviator/serverless/types';

export interface AviatorRealtimePublisher {
  publishState(message: GameStateMessage): Promise<void>;
  publishHistory(message: GameHistoryMessage): Promise<void>;
  publishBetResult(message: BetResultMessage): Promise<void>;
  publishCashoutResult(message: CashoutResultMessage): Promise<void>;
}

export class SupabaseRealtimePublisher implements AviatorRealtimePublisher {
  private readonly realtimeUrl: string;
  private readonly serviceRoleKey: string;

  constructor(
    projectUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  ) {
    if (!projectUrl) {
      throw new Error(
        'Configure NEXT_PUBLIC_SUPABASE_URL para emitir eventos do Aviator.'
      );
    }

    if (!serviceRoleKey) {
      throw new Error(
        'Configure SUPABASE_SERVICE_ROLE_KEY para emitir eventos do Aviator.'
      );
    }

    this.serviceRoleKey = serviceRoleKey;
    const url = new URL(projectUrl);
    url.pathname = '/realtime/v1';
    this.realtimeUrl = url.toString().replace(/\/$/, '');
  }

  async publishState(message: GameStateMessage): Promise<void> {
    await this.sendBroadcast(AVIATOR_CHANNELS.state, 'state', message);
  }

  async publishHistory(message: GameHistoryMessage): Promise<void> {
    await this.sendBroadcast(AVIATOR_CHANNELS.history, 'history', message);
  }

  async publishBetResult(message: BetResultMessage): Promise<void> {
    await this.sendBroadcast(AVIATOR_CHANNELS.bet, AVIATOR_CHANNELS.bet, message);
  }

  async publishCashoutResult(message: CashoutResultMessage): Promise<void> {
    await this.sendBroadcast(AVIATOR_CHANNELS.cashout, AVIATOR_CHANNELS.cashout, message);
  }

  private async sendBroadcast(
    topic: string,
    event: string,
    payload: unknown
  ): Promise<void> {
    const response = await fetch(`${this.realtimeUrl}/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, event, payload }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Falha ao publicar no canal ${topic}: ${text || response.statusText}`
      );
    }
  }
}
