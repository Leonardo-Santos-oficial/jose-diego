import type { BetResult, CashoutResult } from '../commands/types.js';
import type { HistoryPayload, RealtimePublisher, StatePayload } from './realtimePublisher.js';

export class CompositeRealtimePublisher implements RealtimePublisher {
  constructor(private readonly publishers: RealtimePublisher[]) {}

  async publishState(payload: StatePayload): Promise<void> {
    await Promise.all(this.publishers.map((p) => p.publishState(payload)));
  }

  async publishBetResult(result: BetResult): Promise<void> {
    await Promise.all(this.publishers.map((p) => p.publishBetResult(result)));
  }

  async publishCashoutResult(result: CashoutResult): Promise<void> {
    await Promise.all(this.publishers.map((p) => p.publishCashoutResult(result)));
  }

  async publishHistory(payload: HistoryPayload): Promise<void> {
    await Promise.all(this.publishers.map((p) => p.publishHistory(payload)));
  }
}
