export type GamePhase = 'awaitingBets' | 'flying' | 'crashed';

export interface GameStateSnapshot {
  roundId: string;
  phase: GamePhase;
  multiplier: number;
  phaseStartedAt: Date;
}

export interface GameLoopConfig {
  bettingWindowMs: number;
  settleDelayMs: number;
  tickIntervalMs: number;
  historySize: number;
}

export const defaultLoopConfig: GameLoopConfig = {
  bettingWindowMs: 4_000,
  settleDelayMs: 1_000,
  tickIntervalMs: 100,
  historySize: 30
};

export type HistoryBucket = 'blue' | 'purple' | 'pink';

export interface HistoryEntry {
  roundId: string;
  multiplier: number;
  bucket: HistoryBucket;
  finishedAt: Date;
}
