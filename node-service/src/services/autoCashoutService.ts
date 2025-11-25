import type { SupabaseClient } from '@supabase/supabase-js';
import type { RealtimePublisher } from '../publisher/realtimePublisher.js';
import type { CashoutResult } from '../commands/types.js';

interface AutoCashoutCandidate {
  ticketId: string;
  userId: string;
  autoCashout: number;
}

export class AutoCashoutService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly publisher: RealtimePublisher
  ) {}

  async run(roundId: string, multiplier: number): Promise<void> {
    const candidates = await this.listAutoCashoutCandidates(roundId, multiplier);

    for (const candidate of candidates) {
      try {
        const result = await this.performCashout({
          ticketId: candidate.ticketId,
          userId: candidate.userId,
          roundId,
          multiplier: candidate.autoCashout, // Use the target auto-cashout value, not current multiplier (usually they match or current is slightly higher)
        });

        // Publish result
        await this.publisher.publishCashoutResult({
          ticketId: result.ticketId,
          status: 'credited',
          creditedAmount: result.creditedAmount,
          cashoutMultiplier: result.payoutMultiplier,
          snapshot: {
            balance: result.balance,
            updatedAt: result.updatedAt,
          },
        });
      } catch (error) {
        console.warn(`Auto cashout failed for ticket ${candidate.ticketId}`, error);
      }
    }
  }

  private async listAutoCashoutCandidates(
    roundId: string,
    multiplier: number
  ): Promise<AutoCashoutCandidate[]> {
    const { data, error } = await this.supabase
      .from('bets')
      .select('id, user_id, auto_cashout')
      .eq('round_id', roundId)
      .is('cashed_out_at', null)
      .not('auto_cashout', 'is', null)
      .lte('auto_cashout', multiplier)
      .limit(50); // Increased limit for node service

    if (error) {
      throw new Error(`Failed to fetch auto cashout candidates: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      ticketId: row.id,
      userId: row.user_id,
      autoCashout: Number(row.auto_cashout ?? 0),
    }));
  }

  private async performCashout(params: {
    ticketId: string;
    userId: string;
    roundId: string;
    multiplier: number;
  }): Promise<{
    ticketId: string;
    creditedAmount: number;
    payoutMultiplier: number;
    balance: number;
    updatedAt: string;
  }> {
    const { data, error } = await this.supabase.rpc('perform_cashout', {
      p_ticket_id: params.ticketId,
      p_user_id: params.userId,
      p_round_id: params.roundId,
      p_multiplier: params.multiplier,
    });

    if (error) {
      throw new Error(error.message ?? 'Error performing cashout');
    }

    // RPC returns an array (or single object depending on definition, but usually array in Supabase JS if not single())
    // Assuming it returns a single row or array of 1
    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      throw new Error('Unexpected response from cashout RPC');
    }

    return {
      ticketId: row.ticket_id,
      creditedAmount: Number(row.credited_amount ?? 0),
      payoutMultiplier: Number(row.payout_multiplier ?? params.multiplier),
      balance: Number(row.balance ?? 0),
      updatedAt: row.updated_at,
    };
  }
}
