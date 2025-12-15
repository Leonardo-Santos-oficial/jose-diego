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

type WsServerMessage =
  | { type: 'ready'; userId: string }
  | { type: 'event'; topic: 'game.state' | 'game.history'; payload: unknown }
  | { type: 'error'; message: string }
  | { type: 'pong' };

function getEngineWsUrl(): string {
  const base = process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:8081';
  const url = new URL(base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}

export class AviatorRealtimeClient {
  private stateChannel?: RealtimeChannel;
  private historyChannel?: RealtimeChannel;
  private betChannel?: RealtimeChannel;
  private cashoutChannel?: RealtimeChannel;
  private walletChannel?: RealtimeChannel;

  private ws?: WebSocket;
  private wsShouldRun = false;
  private wsReconnectTimer?: number;

  constructor(private readonly supabase: SupabaseClient = getSupabaseClient()) {}

  subscribe(handlers: HandlerOptions, options?: SubscribeOptions): void {
    // Prevent duplicate subscriptions (e.g. re-mounts / repeated calls)
    this.unsubscribe();

    this.wsShouldRun = true;
    void this.connectWs(handlers);

    // game.state + game.history agora vêm via WebSocket (VPS)

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
    this.wsShouldRun = false;

    if (this.wsReconnectTimer) {
      window.clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = undefined;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = undefined;
    }

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

  private async connectWs(handlers: HandlerOptions): Promise<void> {
    if (!this.wsShouldRun) {
      return;
    }

    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      return;
    }

    const wsUrl = getEngineWsUrl();
    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event) => {
      let parsed: WsServerMessage | null = null;
      try {
        parsed = JSON.parse(String(event.data)) as WsServerMessage;
      } catch {
        return;
      }

      if (parsed.type === 'event') {
        if (parsed.topic === 'game.state') {
          handlers.onState?.(parsed.payload as GameStateMessage);
        }
        if (parsed.topic === 'game.history') {
          handlers.onHistory?.(parsed.payload as GameHistoryMessage);
        }
      }
    };

    ws.onclose = () => {
      if (!this.wsShouldRun) {
        return;
      }
      // reconexão simples
      this.wsReconnectTimer = window.setTimeout(() => {
        void this.connectWs(handlers);
      }, 1000);
    };

    ws.onerror = () => {
      // o onclose cuidará da reconexão
    };
  }
}
