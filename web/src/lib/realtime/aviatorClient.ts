import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type {
  BetResultMessage,
  CashoutResultMessage,
  GameHistoryMessage,
  GameStateMessage,
  WalletSnapshot,
} from '@/types/aviator';

type StateHandler = (payload: GameStateMessage) => void;
type HistoryHandler = (payload: GameHistoryMessage) => void;
type BetHandler = (payload: BetResultMessage) => void;
type CashoutHandler = (payload: CashoutResultMessage) => void;
type WalletHandler = (payload: WalletSnapshot) => void;

type HandlerOptions = {
  onState?: StateHandler;
  onHistory?: HistoryHandler;
  onBetResult?: BetHandler;
  onCashoutResult?: CashoutHandler;
  onWalletSnapshot?: WalletHandler;
};

type SubscribeOptions = {
  userId?: string;
};

export class AviatorRealtimeClient {
  private stateChannel?: RealtimeChannel;
  private historyChannel?: RealtimeChannel;
  private betChannel?: RealtimeChannel;
  private cashoutChannel?: RealtimeChannel;
  private walletChannel?: RealtimeChannel;

  constructor(private readonly supabase: SupabaseClient = getSupabaseClient()) {}

  subscribe(handlers: HandlerOptions, options?: SubscribeOptions): void {
    // Prevent duplicate subscriptions (e.g. re-mounts / repeated calls)
    this.unsubscribe();

    this.stateChannel = this.supabase
      .channel('game.state')
      .on('broadcast', { event: 'state' }, (payload) => {
        handlers.onState?.(payload.payload as GameStateMessage);
      })
      .subscribe();

    this.historyChannel = this.supabase
      .channel('game.history')
      .on('broadcast', { event: 'history' }, (payload) => {
        handlers.onHistory?.(payload.payload as GameHistoryMessage);
      })
      .subscribe();

    this.betChannel = this.supabase
      .channel('commands.bet')
      .on('broadcast', { event: 'commands.bet' }, (payload) => {
        handlers.onBetResult?.(payload.payload as BetResultMessage);
      })
      .subscribe();

    this.cashoutChannel = this.supabase
      .channel('commands.cashout')
      .on('broadcast', { event: 'commands.cashout' }, (payload) => {
        handlers.onCashoutResult?.(payload.payload as CashoutResultMessage);
      })
      .subscribe();

    if (options?.userId && handlers.onWalletSnapshot) {
      this.walletChannel = this.supabase
        .channel(`wallets:user_id=eq.${options.userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${options.userId}`,
          },
          (payload) => {
            const nextRow = (payload.new || payload.old) as {
              balance?: number;
              updated_at?: string;
            } | null;
            if (!nextRow) {
              return;
            }

            handlers.onWalletSnapshot?.({
              balance: Number(nextRow.balance ?? 0),
              updatedAt: nextRow.updated_at ?? new Date().toISOString(),
            });
          }
        )
        .subscribe();
    }
  }

  unsubscribe(): void {
    if (this.stateChannel) {
      void this.supabase.removeChannel(this.stateChannel);
      this.stateChannel = undefined;
    }

    if (this.historyChannel) {
      void this.supabase.removeChannel(this.historyChannel);
      this.historyChannel = undefined;
    }

    if (this.betChannel) {
      void this.supabase.removeChannel(this.betChannel);
      this.betChannel = undefined;
    }

    if (this.cashoutChannel) {
      void this.supabase.removeChannel(this.cashoutChannel);
      this.cashoutChannel = undefined;
    }

    if (this.walletChannel) {
      void this.supabase.removeChannel(this.walletChannel);
      this.walletChannel = undefined;
    }
  }
}
