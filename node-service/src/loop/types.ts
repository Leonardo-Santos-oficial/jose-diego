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
  /** Maximum crash multiplier allowed - CRITICAL for RTP compliance */
  maxCrashMultiplier: number;
  /** Minimum crash multiplier allowed */
  minCrashMultiplier: number;
}

export const defaultLoopConfig: GameLoopConfig = {
  bettingWindowMs: 10_000,
  settleDelayMs: 1_000,
  tickIntervalMs: 100,
  historySize: 30,
  maxCrashMultiplier: 100,
  minCrashMultiplier: 1.0,
};

export type HistoryBucket = 'blue' | 'purple' | 'pink';

export interface HistoryEntry {
  roundId: string;
  multiplier: number;
  bucket: HistoryBucket;
  finishedAt: Date;
}
