export interface BetCommandInput {
  roundId: string;
  userId: string;
  amount: number;
  autopayoutMultiplier?: number;
  strategyKey?: string;
}

export interface WalletSnapshot {
  balance: number;
  updatedAt: string;
}

export type BetResultStatus = 'accepted' | 'rejected';
export type CashoutResultStatus = 'credited' | 'rejected';

export interface BetResult {
  roundId: string;
  userId: string;
  status: BetResultStatus;
  reason?: string;
  ticketId?: string;
  snapshot: WalletSnapshot;
}

export interface CashoutCommandInput {
  ticketId: string;
  userId: string;
  kind: 'manual' | 'auto';
}

export interface CashoutResult {
  ticketId: string;
  status: CashoutResultStatus;
  creditedAmount?: number;
  cashoutMultiplier?: number;
  reason?: string;
  snapshot: WalletSnapshot;
}
