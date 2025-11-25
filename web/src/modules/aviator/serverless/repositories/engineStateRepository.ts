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
import type { CrashResult } from '@/modules/aviator/serverless/strategies/crashStrategy';

const ENGINE_STATE_TABLE = 'engine_state';
const GAME_ROUNDS_TABLE = 'game_rounds';
const BETS_TABLE = 'bets';

export interface EngineStateRepository {
  ensureState(crashResult: CrashResult, settings?: EngineSettings): Promise<EngineState>;
  updateState(
    id: string,
    data: Partial<{
      phase: GamePhase;
      phaseStartedAt: string;
      currentMultiplier: number;
      targetMultiplier: number;
      roundId: string;
      settings: EngineSettings;
      serverSeed: string;
      serverHash: string;
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
  fetchPendingCommands(): Promise<Array<{ id: string; action: string; payload: any }>>;
  markCommandProcessed(id: string, status: 'processed' | 'failed'): Promise<void>;
}

export class SupabaseEngineStateRepository implements EngineStateRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseServiceRoleClient()) {}

  async fetchPendingCommands() {
    const { data } = await this.client
      .from('admin_game_commands')
      .select('id, action, payload')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    return data ?? [];
  }

  async markCommandProcessed(id: string, status: 'processed' | 'failed') {
    await this.client
      .from('admin_game_commands')
      .update({ status, processed_at: new Date().toISOString() })
      .eq('id', id);
  }

  async ensureState(
    crashResult: CrashResult,
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

    // We'll inject the seed/hash into the settings object stored in DB
    // so we can retrieve it later without changing the schema.
    const settingsWithHash = {
      ...settings,
      serverSeed: crashResult.seed,
      serverHash: crashResult.hash,
    };

    if (data) {
      if (!data.current_round_id) {
        const roundId = await this.createRound('awaitingBets');
        const { data: fixed, error: fixError } = await this.client
          .from(ENGINE_STATE_TABLE)
          .update({ 
            current_round_id: roundId,
            // Update settings to include the new hash/seed if we are starting fresh?
            // Actually, if state exists, we might want to keep existing settings unless we are resetting.
            // But ensureState is called every tick. We shouldn't overwrite settings every tick.
            // However, if we are creating a NEW round, we might want to update the hash.
            // But ensureState is mostly about making sure the ROW exists.
          })
          .eq('id', data.id)
          .select('*')
          .single();

        if (fixError) {
          throw new Error(`Falha ao ajustar engine_state: ${fixError.message}`);
        }

        return mapStateRow(fixed as EngineStateRow, settings);
      }

      // If we already have a state, we return it.
      // Note: The state in DB might have an OLD hash/seed from previous round if we don't update it.
      // But the Facade handles the logic of "if round is over, start new one".
      // ensureState is just "get me the state, create if missing".
      
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
        target_multiplier: crashResult.multiplier,
        settings: settingsWithHash,
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
      serverSeed: string;
      serverHash: string;
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
    
    let settingsToSave = data.settings;
    if (data.serverSeed || data.serverHash) {
      if (settingsToSave) {
        settingsToSave = {
          ...settingsToSave,
          serverSeed: data.serverSeed ?? settingsToSave.serverSeed,
          serverHash: data.serverHash ?? settingsToSave.serverHash,
        };
      }
    }

    if (settingsToSave) {
      payload.settings = settingsToSave;
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
    ...pickNumericSetting(rawSettings, 'rtp'),
    ...pickNumericSetting(rawSettings, 'forcedResult'),
    paused: !!rawSettings['paused'],
  } as EngineSettings;

  const serverSeed = typeof rawSettings['serverSeed'] === 'string' ? rawSettings['serverSeed'] : undefined;
  const serverHash = typeof rawSettings['serverHash'] === 'string' ? rawSettings['serverHash'] : undefined;

  return {
    id: row.id,
    roundId: row.current_round_id ?? '',
    phase: row.phase,
    phaseStartedAt: row.phase_started_at,
    currentMultiplier: Number(row.current_multiplier ?? 1),
    targetMultiplier: Number(row.target_multiplier ?? 2),
    settings,
    serverSeed,
    serverHash,
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
