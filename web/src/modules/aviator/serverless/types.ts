import type {
  GameHistoryEntry,
  GameHistoryMessage,
  GamePhase,
  GameStateMessage,
  WalletSnapshot,
} from '@/types/aviator';

export type AviatorPhase = GamePhase;

export interface EngineSettings {
  bettingWindowMs: number;
  flightDurationMs: number;
  resetDelayMs: number;
  historySize: number;
  minCrashMultiplier: number;
  maxCrashMultiplier: number;
  serverSeed?: string;
  serverHash?: string;
  paused?: boolean;
  rtp?: number; // 0 to 100
  forcedResult?: number | null;
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  bettingWindowMs: 4000,
  flightDurationMs: 8000,
  resetDelayMs: 1500,
  historySize: 30,
  minCrashMultiplier: 1.2,
  maxCrashMultiplier: 35,
  rtp: 97.0,
};

export interface EngineStateRow {
  id: string;
  current_round_id: string | null;
  phase: AviatorPhase;
  phase_started_at: string;
  current_multiplier: number;
  target_multiplier: number;
  settings: Record<string, unknown> | null;
  updated_at: string;
}

export interface EngineState {
  id: string;
  roundId: string;
  phase: AviatorPhase;
  phaseStartedAt: string;
  currentMultiplier: number;
  targetMultiplier: number;
  settings: EngineSettings;
  serverHash?: string;
  serverSeed?: string;
}

export interface PlaceBetInput {
  userId: string;
  amount: number;
  roundId: string;
  autopayoutMultiplier?: number;
}

export interface CashoutInput {
  userId: string;
  ticketId: string;
  roundId?: string;
  multiplier?: number;
  kind?: 'manual' | 'auto';
}

export interface EngineTickResult {
  state: EngineState;
  stateMessage: GameStateMessage;
  historyMessage?: GameHistoryMessage;
}

export interface BetResultPayload {
  ticketId: string;
  snapshot: WalletSnapshot;
}

export interface CashoutResultPayload {
  ticketId: string;
  creditedAmount: number;
  multiplier: number;
  snapshot: WalletSnapshot;
}

export interface AutoCashoutCandidate {
  ticketId: string;
  userId: string;
  autoCashout: number;
}

export const AVIATOR_CHANNELS = {
  state: 'game.state',
  history: 'game.history',
  bet: 'commands.bet',
  cashout: 'commands.cashout',
};
