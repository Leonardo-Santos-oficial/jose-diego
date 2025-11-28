import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseServiceClient } from '../clients/supabaseClient.js';
import { logger } from '../logger.js';

export interface RoundService {
  createRound(roundId: string): Promise<void>;
  finishRound(roundId: string, crashMultiplier: number): Promise<void>;
}

export class SupabaseRoundService implements RoundService {
  constructor(private readonly supabase: SupabaseClient = supabaseServiceClient) {}

  async createRound(roundId: string): Promise<void> {
    const { error } = await this.supabase
      .from('game_rounds')
      .insert({
        id: roundId,
        status: 'awaitingBets',
        started_at: new Date().toISOString()
      });

    if (error) {
      logger.error({ error, roundId }, 'Failed to create round in database');
      throw new Error(`Failed to create round: ${error.message}`);
    }

    logger.info({ roundId }, 'Round created in database');
  }

  async finishRound(roundId: string, crashMultiplier: number): Promise<void> {
    const { error } = await this.supabase
      .from('game_rounds')
      .update({
        status: 'crashed',
        crash_multiplier: crashMultiplier,
        finished_at: new Date().toISOString()
      })
      .eq('id', roundId);

    if (error) {
      logger.error({ error, roundId, crashMultiplier }, 'Failed to finish round in database');
    } else {
      logger.info({ roundId, crashMultiplier }, 'Round finished in database');
    }
  }
}

export class NoOpRoundService implements RoundService {
  async createRound(_roundId: string): Promise<void> {
    // No-op for testing
  }

  async finishRound(_roundId: string, _crashMultiplier: number): Promise<void> {
    // No-op for testing
  }
}
