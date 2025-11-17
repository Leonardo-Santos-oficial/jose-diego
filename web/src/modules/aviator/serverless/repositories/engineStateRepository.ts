import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import type { GameHistoryEntry, GamePhase } from '@/types/aviator';
import {
  DEFAULT_ENGINE_SETTINGS,
  type AutoCashoutCandidate,
  type EngineSettings,
  type EngineState,
  type EngineStateRow,
} from '@/modules/aviator/serverless/types';

const ENGINE_STATE_TABLE = 'engine_state';
const GAME_ROUNDS_TABLE = 'game_rounds';
const BETS_TABLE = 'bets';

export interface EngineStateRepository {
  ensureState(targetMultiplier: number, settings?: EngineSettings): Promise<EngineState>;
  updateState(
    id: string,
    data: Partial<{
      phase: GamePhase;
      phaseStartedAt: string;
      currentMultiplier: number;
      targetMultiplier: number;
      roundId: string;
      settings: EngineSettings;
    }>,
    fallbackSettings?: EngineSettings
  ): Promise<EngineState>;
  setRoundStatus(
    roundId: string,
    status: GamePhase,
    crashMultiplier?: number
  ): Promise<void>;
  createRound(status: GamePhase): Promise<string>;
  fetchHistory(limit: number): Promise<GameHistoryEntry[]>;
  listAutoCashoutCandidates(
    roundId: string,
    multiplier: number
  ): Promise<AutoCashoutCandidate[]>;
  getTicketInfo(ticketId: string): Promise<{ roundId: string; userId: string } | null>;
  performBet(params: {
    roundId: string;
    userId: string;
    amount: number;
    autopayoutMultiplier?: number;
  }): Promise<{ ticketId: string; balance: number; updatedAt: string }>;
  performCashout(params: {
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
  }>;
}

export class SupabaseEngineStateRepository implements EngineStateRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseServiceRoleClient()) {}

  async ensureState(
    targetMultiplier: number,
    settings: EngineSettings = DEFAULT_ENGINE_SETTINGS
  ): Promise<EngineState> {
    const { data, error } = await this.client
      .from(ENGINE_STATE_TABLE)
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Falha ao buscar engine_state: ${error.message}`);
    }

    if (data) {
      if (!data.current_round_id) {
        const roundId = await this.createRound('awaitingBets');
        const { data: fixed, error: fixError } = await this.client
          .from(ENGINE_STATE_TABLE)
          .update({ current_round_id: roundId })
          .eq('id', data.id)
          .select('*')
          .single();

        if (fixError) {
          throw new Error(`Falha ao ajustar engine_state: ${fixError.message}`);
        }

        return mapStateRow(fixed as EngineStateRow, settings);
      }

      return mapStateRow(data as EngineStateRow, settings);
    }

    const roundId = await this.createRound('awaitingBets');

    const { data: created, error: createError } = await this.client
      .from(ENGINE_STATE_TABLE)
      .insert({
        current_round_id: roundId,
        phase: 'awaitingBets',
        phase_started_at: new Date().toISOString(),
        current_multiplier: 1,
        target_multiplier: targetMultiplier,
        settings,
      })
      .select('*')
      .single();

    if (createError) {
      throw new Error(`Falha ao inicializar engine_state: ${createError.message}`);
    }

    return mapStateRow(created as EngineStateRow, settings);
  }

  async updateState(
    id: string,
    data: Partial<{
      phase: GamePhase;
      phaseStartedAt: string;
      currentMultiplier: number;
      targetMultiplier: number;
      roundId: string;
      settings: EngineSettings;
    }>,
    fallbackSettings: EngineSettings = DEFAULT_ENGINE_SETTINGS
  ): Promise<EngineState> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (data.phase) {
      payload.phase = data.phase;
    }
    if (data.phaseStartedAt) {
      payload.phase_started_at = data.phaseStartedAt;
    }
    if (typeof data.currentMultiplier === 'number') {
      payload.current_multiplier = data.currentMultiplier;
    }
    if (typeof data.targetMultiplier === 'number') {
      payload.target_multiplier = data.targetMultiplier;
    }
    if (data.roundId) {
      payload.current_round_id = data.roundId;
    }
    if (data.settings) {
      payload.settings = data.settings;
    }

    const { data: updated, error } = await this.client
      .from(ENGINE_STATE_TABLE)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar engine_state: ${error.message}`);
    }

    return mapStateRow(updated as EngineStateRow, fallbackSettings);
  }

  async setRoundStatus(
    roundId: string,
    status: GamePhase,
    crashMultiplier?: number
  ): Promise<void> {
    const payload: Record<string, unknown> = { status };
    if (status === 'crashed') {
      payload.crash_multiplier = crashMultiplier ?? null;
      payload.finished_at = new Date().toISOString();
    } else if (status === 'flying') {
      payload.started_at = new Date().toISOString();
    }

    const { error } = await this.client
      .from(GAME_ROUNDS_TABLE)
      .update(payload)
      .eq('id', roundId);

    if (error) {
      throw new Error(`Falha ao atualizar round (${status}): ${error.message}`);
    }
  }

  async fetchHistory(limit: number): Promise<GameHistoryEntry[]> {
    const { data, error } = await this.client
      .from(GAME_ROUNDS_TABLE)
      .select('id, crash_multiplier, finished_at')
      .not('crash_multiplier', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Falha ao buscar histórico: ${error.message}`);
    }

    return (data ?? []).map((row) => {
      const multiplier = Number(row.crash_multiplier ?? 1);
      return {
        roundId: row.id,
        multiplier,
        finishedAt: row.finished_at ?? new Date().toISOString(),
        bucket: resolveHistoryBucket(multiplier),
      } satisfies GameHistoryEntry;
    });
  }

  async listAutoCashoutCandidates(
    roundId: string,
    multiplier: number
  ): Promise<AutoCashoutCandidate[]> {
    const { data, error } = await this.client
      .from(BETS_TABLE)
      .select('id, user_id, auto_cashout')
      .eq('round_id', roundId)
      .is('cashed_out_at', null)
      .not('auto_cashout', 'is', null)
      .lte('auto_cashout', multiplier)
      .limit(20);

    if (error) {
      throw new Error(`Falha ao buscar auto cashouts: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      ticketId: row.id,
      userId: row.user_id,
      autoCashout: Number(row.auto_cashout ?? 0),
    }));
  }

  async getTicketInfo(
    ticketId: string
  ): Promise<{ roundId: string; userId: string } | null> {
    const { data, error } = await this.client
      .from(BETS_TABLE)
      .select('round_id, user_id')
      .eq('id', ticketId)
      .maybeSingle();

    if (error) {
      throw new Error(`Falha ao buscar ticket: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      roundId: data.round_id,
      userId: data.user_id,
    };
  }

  async performBet(params: {
    roundId: string;
    userId: string;
    amount: number;
    autopayoutMultiplier?: number;
  }): Promise<{ ticketId: string; balance: number; updatedAt: string }> {
    const { data, error } = await this.client.rpc('perform_bet', {
      p_round_id: params.roundId,
      p_user_id: params.userId,
      p_amount: params.amount,
      p_autocashout: params.autopayoutMultiplier ?? null,
    });

    if (error) {
      throw new Error(error.message ?? 'Erro ao executar aposta.');
    }

    const [row] =
      (data as Array<{ ticket_id: string; balance: number; updated_at: string }>) ?? [];

    if (!row) {
      throw new Error('Resposta inesperada ao criar aposta.');
    }

    return {
      ticketId: row.ticket_id,
      balance: Number(row.balance ?? 0),
      updatedAt: row.updated_at,
    };
  }

  async performCashout(params: {
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
    const { data, error } = await this.client.rpc('perform_cashout', {
      p_ticket_id: params.ticketId,
      p_user_id: params.userId,
      p_round_id: params.roundId,
      p_multiplier: params.multiplier,
    });

    if (error) {
      throw new Error(error.message ?? 'Erro ao realizar cashout.');
    }

    const [row] =
      (data as Array<{
        ticket_id: string;
        credited_amount: number;
        payout_multiplier: number;
        balance: number;
        updated_at: string;
      }>) ?? [];

    if (!row) {
      throw new Error('Resposta inesperada do cashout.');
    }

    return {
      ticketId: row.ticket_id,
      creditedAmount: Number(row.credited_amount ?? 0),
      payoutMultiplier: Number(row.payout_multiplier ?? params.multiplier),
      balance: Number(row.balance ?? 0),
      updatedAt: row.updated_at,
    };
  }

  async createRound(status: GamePhase): Promise<string> {
    const { data, error } = await this.client
      .from(GAME_ROUNDS_TABLE)
      .insert({ status })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Falha ao criar round: ${error.message}`);
    }

    return data.id;
  }
}

function mapStateRow(row: EngineStateRow, fallbackSettings: EngineSettings): EngineState {
  const rawSettings = row.settings ?? {};
  const settings: EngineSettings = {
    ...fallbackSettings,
    ...pickNumericSetting(rawSettings, 'bettingWindowMs'),
    ...pickNumericSetting(rawSettings, 'flightDurationMs'),
    ...pickNumericSetting(rawSettings, 'resetDelayMs'),
    ...pickNumericSetting(rawSettings, 'historySize'),
    ...pickNumericSetting(rawSettings, 'minCrashMultiplier'),
    ...pickNumericSetting(rawSettings, 'maxCrashMultiplier'),
  } as EngineSettings;

  return {
    id: row.id,
    roundId: row.current_round_id ?? '',
    phase: row.phase,
    phaseStartedAt: row.phase_started_at,
    currentMultiplier: Number(row.current_multiplier ?? 1),
    targetMultiplier: Number(row.target_multiplier ?? 2),
    settings,
  };
}

function pickNumericSetting(source: Record<string, unknown>, key: keyof EngineSettings) {
  if (typeof source[key] === 'number') {
    return { [key]: source[key] };
  }
  if (typeof source[key] === 'string') {
    const parsed = Number(source[key]);
    if (!Number.isNaN(parsed)) {
      return { [key]: parsed };
    }
  }
  return {};
}

function resolveHistoryBucket(multiplier: number): GameHistoryEntry['bucket'] {
  if (multiplier >= 10) {
    return 'pink';
  }
  if (multiplier >= 2) {
    return 'purple';
  }
  return 'blue';
}
