import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';
import type {
  BetCommandInput,
  BetResult,
  CashoutCommandInput,
  CashoutResult,
  WalletSnapshot
} from '../commands/types.js';
import type { GameStateSnapshot } from '../loop/types.js';
import type { RealtimePublisher } from '../publisher/realtimePublisher.js';

interface BetRpcPayload {
  ticket_id: string;
  balance: number;
  updated_at: string;
}

interface CashoutRpcPayload {
  ticket_id: string;
  credited_amount: number;
  payout_multiplier: number;
  balance: number;
  updated_at: string;
}

export class CommandService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly getState: () => GameStateSnapshot,
    private readonly publisher: RealtimePublisher
  ) {}

  async placeBet(command: BetCommandInput): Promise<BetResult> {
    const response = (await this.supabase.rpc('perform_bet', {
      p_round_id: command.roundId,
      p_user_id: command.userId,
      p_amount: command.amount,
      p_autocashout: command.autopayoutMultiplier ?? null
    })) as PostgrestSingleResponse<BetRpcPayload[]>;

    console.log('[CommandService] perform_bet response:', JSON.stringify(response));

    // RPC with RETURN QUERY returns an array
    const data = Array.isArray(response.data) ? response.data[0] : response.data;

    if (response.error || !data) {
      const reason = response.error?.message ?? 'Falha ao registrar aposta';
      return {
        roundId: command.roundId,
        userId: command.userId,
        status: 'rejected',
        reason,
        snapshot: await this.fetchWalletSnapshot(command.userId)
      };
    }

    const result: BetResult = {
      roundId: command.roundId,
      userId: command.userId,
      status: 'accepted',
      ticketId: data.ticket_id,
      snapshot: {
        balance: Number(data.balance ?? 0),
        updatedAt: data.updated_at
      }
    };

    console.log('[CommandService] BetResult:', JSON.stringify(result));
    await this.publisher.publishBetResult(result);
    return result;
  }

  async cashout(command: CashoutCommandInput): Promise<CashoutResult> {
    const state = this.getState();
    const response = (await this.supabase.rpc('perform_cashout', {
      p_ticket_id: command.ticketId,
      p_user_id: command.userId,
      p_round_id: state.roundId,
      p_multiplier: state.multiplier
    })) as PostgrestSingleResponse<CashoutRpcPayload>;

    if (response.error || !response.data) {
      const reason = response.error?.message ?? 'Falha ao realizar cashout';
      const rejected: CashoutResult = {
        ticketId: command.ticketId,
        status: 'rejected',
        reason,
        snapshot: await this.fetchWalletSnapshot(command.userId)
      };
      await this.publisher.publishCashoutResult(rejected);
      return rejected;
    }

    const result: CashoutResult = {
      ticketId: response.data.ticket_id,
      status: 'credited',
      creditedAmount: Number(response.data.credited_amount ?? 0),
      cashoutMultiplier: Number(response.data.payout_multiplier ?? 1),
      snapshot: {
        balance: Number(response.data.balance ?? 0),
        updatedAt: response.data.updated_at
      }
    };

    await this.publisher.publishCashoutResult(result);
    return result;
  }

  private async fetchWalletSnapshot(userId: string): Promise<WalletSnapshot> {
    const now = new Date().toISOString();
    const { data } = await this.supabase
      .from('wallets')
      .select('balance, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) {
      return { balance: 0, updatedAt: now };
    }

    return {
      balance: Number(data.balance ?? 0),
      updatedAt: data.updated_at ?? now
    };
  }
}
