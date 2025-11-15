export type WalletSnapshot = {
  userId: string;
  balance: number;
  updatedAt: string;
};

export type BetRecord = {
  id: string;
  userId: string;
  amount: number;
  multiplier: number;
  status: 'pending' | 'cashout' | 'lost';
  createdAt: string;
};

export type WithdrawRequest = {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
};

export type TimelineEvent =
  | {
      type: 'wallet_adjusted';
      payload: {
        userId: string;
        delta: number;
        balance: number;
        reason?: string;
        updatedAt: string;
        adminId: string;
      };
    }
  | {
      type: 'bet_created';
      payload: BetRecord;
    }
  | {
      type: 'bet_resolved';
      payload: BetRecord;
    }
  | {
      type: 'withdraw_updated';
      payload: WithdrawRequest;
    };

export type TimelineState = {
  wallets: Map<string, WalletSnapshot>;
  bets: BetRecord[];
  withdrawals: WithdrawRequest[];
  events: TimelineEvent[];
};

type Subscriber = (event: TimelineEvent) => void;

export class SupabaseTimelineMock {
  private state: TimelineState;
  private subscribers: Set<Subscriber> = new Set();

  constructor(initial?: Partial<TimelineState>) {
    this.state = {
      wallets: initial?.wallets ?? new Map(),
      bets: initial?.bets ?? [],
      withdrawals: initial?.withdrawals ?? [],
      events: initial?.events ?? [],
    };
  }

  /** Subscribe to timeline events and return an unsubscribe function. */
  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /** Retrieve an immutable snapshot of the current state; handy for assertions. */
  snapshot(): TimelineState {
    return {
      wallets: new Map(this.state.wallets),
      bets: [...this.state.bets],
      withdrawals: [...this.state.withdrawals],
      events: [...this.state.events],
    };
  }

  /** Apply a rich event to the state and notify subscribers. */
  dispatch(event: TimelineEvent) {
    this.state.events.push(event);
    switch (event.type) {
      case 'wallet_adjusted': {
        this.state.wallets.set(event.payload.userId, {
          userId: event.payload.userId,
          balance: event.payload.balance,
          updatedAt: event.payload.updatedAt,
        });
        break;
      }
      case 'bet_created': {
        this.state.bets.push(event.payload);
        break;
      }
      case 'bet_resolved': {
        this.state.bets = this.state.bets.map((bet) =>
          bet.id === event.payload.id ? event.payload : bet
        );
        break;
      }
      case 'withdraw_updated': {
        const existingIndex = this.state.withdrawals.findIndex(
          (w) => w.id === event.payload.id
        );
        if (existingIndex >= 0) {
          this.state.withdrawals[existingIndex] = event.payload;
        } else {
          this.state.withdrawals.push(event.payload);
        }
        break;
      }
    }

    this.subscribers.forEach((subscriber) => subscriber(event));
  }

  /** Convenience helper for admin balance adjustments. */
  adjustBalance(params: {
    userId: string;
    delta: number;
    adminId: string;
    reason?: string;
    timestamp?: string;
  }) {
    const currentBalance = this.state.wallets.get(params.userId)?.balance ?? 0;
    const newBalance = currentBalance + params.delta;
    const updatedAt = params.timestamp ?? new Date().toISOString();
    this.dispatch({
      type: 'wallet_adjusted',
      payload: {
        userId: params.userId,
        delta: params.delta,
        balance: newBalance,
        reason: params.reason,
        adminId: params.adminId,
        updatedAt,
      },
    });
  }

  /** Create a bet and automatically push the initial event. */
  createBet(params: Omit<BetRecord, 'status'> & { status?: BetRecord['status'] }) {
    const bet: BetRecord = {
      ...params,
      status: params.status ?? 'pending',
    };
    this.dispatch({ type: 'bet_created', payload: bet });
    return bet;
  }

  resolveBet(params: BetRecord) {
    this.dispatch({ type: 'bet_resolved', payload: params });
  }

  upsertWithdrawal(params: WithdrawRequest) {
    this.dispatch({ type: 'withdraw_updated', payload: params });
  }
}

export function createDemoTimelineMock() {
  const mock = new SupabaseTimelineMock({
    wallets: new Map([
      [
        'high-roller',
        { userId: 'high-roller', balance: 1200, updatedAt: '2025-11-14T12:00:00Z' },
      ],
      ['starter', { userId: 'starter', balance: 75, updatedAt: '2025-11-14T12:05:00Z' }],
    ]),
    bets: [],
    withdrawals: [],
  });

  mock.createBet({
    id: 'bet-001',
    userId: 'starter',
    amount: 25,
    multiplier: 1.8,
    status: 'cashout',
    createdAt: '2025-11-14T12:10:00Z',
  });

  mock.upsertWithdrawal({
    id: 'wd-001',
    userId: 'starter',
    amount: 50,
    status: 'pending',
    createdAt: '2025-11-14T12:15:00Z',
  });

  return mock;
}
