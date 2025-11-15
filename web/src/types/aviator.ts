export type GamePhase = 'awaitingBets' | 'flying' | 'crashed';

export interface BettingWindow {
  closesInMs: number;
  minBet?: number;
  maxBet?: number;
}

export interface GameStateMessage {
  roundId: string;
  state: GamePhase;
  multiplier: number;
  phaseStartedAt: string;
  bettingWindow?: BettingWindow;
  autopayouts?: Array<{ ticketId: string; userId: string; multiplier: number }>;
  houseEdge?: number;
}

export interface GameHistoryEntry {
  roundId: string;
  multiplier: number;
  bucket: 'blue' | 'purple' | 'pink';
  finishedAt: string;
}

export interface GameHistoryMessage {
  entries: GameHistoryEntry[];
}

export interface WalletSnapshot {
  balance: number;
  updatedAt: string;
}

export interface BetResultMessage {
  roundId: string;
  userId: string;
  status: 'accepted' | 'rejected';
  reason?: string;
  ticketId?: string;
  snapshot: WalletSnapshot;
}

export interface CashoutResultMessage {
  ticketId: string;
  status: 'credited' | 'rejected';
  creditedAmount?: number;
  cashoutMultiplier?: number;
  reason?: string;
  snapshot: WalletSnapshot;
}
