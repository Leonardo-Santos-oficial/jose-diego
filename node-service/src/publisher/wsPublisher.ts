import type { BetResult, CashoutResult } from '../commands/types.js';
import type { HistoryPayload, RealtimePublisher, StatePayload } from './realtimePublisher.js';
import type { WsHub } from '../ws/WsHub.js';

export class WsRealtimePublisher implements RealtimePublisher {
  constructor(private readonly hub: WsHub) {}

  async publishState(payload: StatePayload): Promise<void> {
    this.hub.broadcast('game.state', payload);
  }

  async publishHistory(payload: HistoryPayload): Promise<void> {
    this.hub.broadcast('game.history', payload);
  }

  async publishBetResult(_result: BetResult): Promise<void> {
    // bet/cashout continuam via HTTP/Supabase por enquanto
  }

  async publishCashoutResult(_result: CashoutResult): Promise<void> {
    // bet/cashout continuam via HTTP/Supabase por enquanto
  }
}
