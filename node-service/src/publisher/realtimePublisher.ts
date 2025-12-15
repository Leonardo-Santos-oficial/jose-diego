import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../logger.js';
import type { GameStateSnapshot } from '../loop/types.js';
import type { BetResult, CashoutResult } from '../commands/types.js';
import { supabaseServiceClient } from '../clients/supabaseClient.js';

export interface StatePayload extends GameStateSnapshot {
  state?: GameStateSnapshot['phase']; // Alias for frontend compatibility
  bettingWindowRemainingMs?: number;
  bettingWindow?: { closesInMs: number }; // Frontend expects this format
  targetMultiplier?: number;
  hash?: string;
}

export interface HistoryPayload {
  entries: Array<{
    roundId: string;
    multiplier: number;
    bucket: string;
    finishedAt: string;
  }>;
}

export interface RealtimePublisher {
  publishState(payload: StatePayload): Promise<void>;
  publishBetResult(result: BetResult): Promise<void>;
  publishCashoutResult(result: CashoutResult): Promise<void>;
  publishHistory(payload: HistoryPayload): Promise<void>;
}

export class ConsolePublisher implements RealtimePublisher {
  async publishState(payload: StatePayload): Promise<void> {
    logger.debug({ payload }, 'Game state changed');
  }

  async publishBetResult(result: BetResult): Promise<void> {
    logger.debug({ result }, 'Bet result');
  }

  async publishCashoutResult(result: CashoutResult): Promise<void> {
    logger.debug({ result }, 'Cashout result');
  }

  async publishHistory(payload: HistoryPayload): Promise<void> {
    logger.debug({ payload }, 'Game history updated');
  }
}

type BroadcastEvent = 'state' | 'history' | 'commands.bet' | 'commands.cashout';

export class SupabaseRealtimePublisher implements RealtimePublisher {
  private readonly stateChannel: RealtimeChannel;
  private readonly historyChannel: RealtimeChannel;
  private readonly betChannel: RealtimeChannel;
  private readonly cashoutChannel: RealtimeChannel;

  private lastStateBroadcastAt = 0;
  private lastStateRoundId?: string;
  private lastStatePhase?: GameStateSnapshot['phase'];
  private readonly minStateBroadcastIntervalMs: number;

  constructor(private readonly client: SupabaseClient = supabaseServiceClient) {
    // Throttling to avoid hitting Supabase Realtime message quotas.
    // Default: 250ms (~4 updates/sec). Can be overridden via env var.
    const configured = Number(process.env.REALTIME_STATE_MIN_INTERVAL_MS ?? 250);
    this.minStateBroadcastIntervalMs = Number.isFinite(configured) && configured >= 0 ? configured : 250;

    this.stateChannel = this.client.channel('game.state', { config: { broadcast: { self: false } } });
    this.historyChannel = this.client.channel('game.history', {
      config: { broadcast: { self: false } }
    });
    this.betChannel = this.client.channel('commands.bet', { config: { broadcast: { self: false } } });
    this.cashoutChannel = this.client.channel('commands.cashout', {
      config: { broadcast: { self: false } }
    });

    void this.stateChannel.subscribe();
    void this.historyChannel.subscribe();
    void this.betChannel.subscribe();
    void this.cashoutChannel.subscribe();
  }

  async publishState(payload: StatePayload): Promise<void> {
    const now = Date.now();
    const shouldBypassThrottle =
      payload.roundId !== this.lastStateRoundId || payload.phase !== this.lastStatePhase;

    if (!shouldBypassThrottle && this.minStateBroadcastIntervalMs > 0) {
      const elapsed = now - this.lastStateBroadcastAt;
      if (elapsed < this.minStateBroadcastIntervalMs) {
        return;
      }
    }

    this.lastStateBroadcastAt = now;
    this.lastStateRoundId = payload.roundId;
    this.lastStatePhase = payload.phase;

    await this.broadcast(this.stateChannel, 'state', payload);
  }

  async publishBetResult(result: BetResult): Promise<void> {
    await this.broadcast(this.betChannel, 'commands.bet', result);
  }

  async publishCashoutResult(result: CashoutResult): Promise<void> {
    await this.broadcast(this.cashoutChannel, 'commands.cashout', result);
  }

  async publishHistory(payload: HistoryPayload): Promise<void> {
    await this.broadcast(this.historyChannel, 'history', payload);
  }

  private async broadcast(channel: RealtimeChannel, event: BroadcastEvent, payload: unknown): Promise<void> {
    const status = await channel.send({ type: 'broadcast', event, payload });
    if (status !== 'ok') {
      logger.error({ event, status }, 'Failed to broadcast realtime payload');
    }
  }
}
