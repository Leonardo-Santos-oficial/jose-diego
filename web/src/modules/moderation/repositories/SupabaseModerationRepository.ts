import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import type {
  ModerationAction,
  ModerationRepository,
  ApplyModerationInput,
  RevokeModerationInput,
} from '../types';
import { getStrategy } from '../strategies/strategyFactory';

const TABLE_NAME = 'moderation_actions';

export class SupabaseModerationRepository implements ModerationRepository {
  constructor(
    private readonly client: SupabaseClient = getSupabaseServiceRoleClient()
  ) {}

  async createAction(input: ApplyModerationInput): Promise<ModerationAction> {
    const strategy = getStrategy(input.actionType);
    const expiresAt = strategy.getExpirationDate(input.durationMinutes);

    const { data, error } = await this.client
      .from(TABLE_NAME)
      .insert({
        user_id: input.userId,
        action_type: input.actionType,
        reason: input.reason.trim(),
        admin_id: input.adminId,
        admin_name: input.adminName,
        expires_at: expiresAt?.toISOString() ?? null,
        status: 'active',
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Falha ao criar ação de moderação: ${error.message}`);
    }

    return this.mapRowToAction(data);
  }

  async revokeAction(input: RevokeModerationInput): Promise<ModerationAction> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: input.adminId,
      })
      .eq('id', input.actionId)
      .eq('status', 'active')
      .select('*')
      .single();

    if (error) {
      throw new Error(`Falha ao revogar ação de moderação: ${error.message}`);
    }

    return this.mapRowToAction(data);
  }

  async getActiveActionsForUser(userId: string): Promise<ModerationAction[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Falha ao buscar ações ativas: ${error.message}`);
    }

    return (data || []).map(this.mapRowToAction);
  }

  async getActionHistory(userId: string, limit = 50): Promise<ModerationAction[]> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Falha ao buscar histórico de moderação: ${error.message}`);
    }

    return (data || []).map(this.mapRowToAction);
  }

  async getRecentActions(limit = 100): Promise<ModerationAction[]> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Falha ao buscar ações recentes: ${error.message}`);
    }

    return (data || []).map(this.mapRowToAction);
  }

  async countActiveWarnings(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action_type', 'warn')
      .eq('status', 'active');

    if (error) {
      throw new Error(`Falha ao contar advertências: ${error.message}`);
    }

    return count ?? 0;
  }

  private mapRowToAction(row: Record<string, unknown>): ModerationAction {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      actionType: row.action_type as ModerationAction['actionType'],
      reason: row.reason as string,
      adminId: row.admin_id as string,
      adminName: row.admin_name as string,
      expiresAt: row.expires_at as string | null,
      status: row.status as ModerationAction['status'],
      createdAt: row.created_at as string,
      revokedAt: row.revoked_at as string | null,
      revokedBy: row.revoked_by as string | null,
    };
  }
}
