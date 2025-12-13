'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentSession } from '@/lib/auth/session';
import { isAdminSession } from '@/lib/auth/roles';
import { ModerationService } from '@/modules/moderation';
import { UserDataPurgeService } from '@/modules/moderation';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import type { ModerationActionType } from '@/modules/moderation';
import type { ModerationActionState } from './moderation-state';

const moderationService = new ModerationService();
const userDataPurgeService = new UserDataPurgeService();

export type UserSearchResult = {
  id: string;
  email: string;
  displayName: string | null;
};

const applyModerationSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido.'),
  actionType: z.enum(['warn', 'suspend', 'block', 'ban']),
  reason: z.string().min(5, 'O motivo deve ter pelo menos 5 caracteres.'),
  durationMinutes: z.coerce.number().int().positive().optional(),
});

const revokeSchema = z.object({
  actionId: z.string().uuid('ID da ação inválido.'),
});

export async function applyModerationAction(
  _prevState: ModerationActionState,
  formData: FormData
): Promise<ModerationActionState> {
  const session = await getCurrentSession();

  if (!isAdminSession(session) || !session) {
    return { status: 'error', message: 'Acesso não autorizado.' };
  }

  const parsed = applyModerationSchema.safeParse({
    userId: formData.get('userId'),
    actionType: formData.get('actionType'),
    reason: formData.get('reason'),
    durationMinutes: formData.get('durationMinutes') || undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Dados inválidos.';
    return { status: 'error', message: firstIssue };
  }

  const { userId, actionType, reason, durationMinutes } = parsed.data;

  try {
    const adminName =
      (session.user_metadata?.display_name as string | undefined) ??
      session.email ??
      'Admin';

    await moderationService.applyAction({
      userId,
      actionType: actionType as ModerationActionType,
      reason,
      adminId: session.id,
      adminName,
      durationMinutes,
    });

    revalidatePath('/admin');

    const actionLabels: Record<ModerationActionType, string> = {
      warn: 'Advertência aplicada',
      suspend: 'Suspensão aplicada',
      block: 'Bloqueio aplicado',
      ban: 'Banimento aplicado',
    };

    return {
      status: 'success',
      message: `${actionLabels[actionType as ModerationActionType]} com sucesso.`,
    };
  } catch (error) {
    console.error('[moderation] erro ao aplicar ação', error);
    const message = error instanceof Error ? error.message : 'Erro ao aplicar ação.';
    return { status: 'error', message };
  }
}

export async function revokeModerationAction(
  _prevState: ModerationActionState,
  formData: FormData
): Promise<ModerationActionState> {
  const session = await getCurrentSession();

  if (!isAdminSession(session) || !session) {
    return { status: 'error', message: 'Acesso não autorizado.' };
  }

  const parsed = revokeSchema.safeParse({
    actionId: formData.get('actionId'),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Dados inválidos.';
    return { status: 'error', message: firstIssue };
  }

  try {
    await moderationService.revokeAction({
      actionId: parsed.data.actionId,
      adminId: session.id,
    });

    revalidatePath('/admin');

    return { status: 'success', message: 'Ação revogada com sucesso.' };
  } catch (error) {
    console.error('[moderation] erro ao revogar ação', error);
    const message = error instanceof Error ? error.message : 'Erro ao revogar ação.';
    return { status: 'error', message };
  }
}

export async function getUserModerationState(userId: string) {
  const session = await getCurrentSession();

  if (!isAdminSession(session)) {
    return null;
  }

  try {
    return await moderationService.getUserModerationState(userId);
  } catch (error) {
    console.error('[moderation] erro ao buscar estado do usuário', error);
    return null;
  }
}

export async function getUserModerationHistory(userId: string) {
  const session = await getCurrentSession();

  if (!isAdminSession(session)) {
    return [];
  }

  try {
    return await moderationService.getUserActionHistory(userId);
  } catch (error) {
    console.error('[moderation] erro ao buscar histórico', error);
    return [];
  }
}

export async function getRecentModerationActions() {
  const session = await getCurrentSession();

  if (!isAdminSession(session)) {
    return [];
  }

  try {
    return await moderationService.getRecentActions(100);
  } catch (error) {
    console.error('[moderation] erro ao buscar ações recentes', error);
    return [];
  }
}

export async function searchUsersForModeration(
  query: string
): Promise<UserSearchResult[]> {
  const session = await getCurrentSession();

  if (!isAdminSession(session)) {
    return [];
  }

  if (!query || query.length < 2) {
    return [];
  }

  try {
    const client = getSupabaseServiceRoleClient();
    const searchQuery = query.toLowerCase().trim();

    // Busca usuários pelo email ou ID
    const { data: usersData, error: usersError } =
      await client.auth.admin.listUsers({ perPage: 1000 });

    if (usersError) {
      console.error('[moderation] erro ao listar usuários', usersError);
      return [];
    }

    // Busca perfis para obter displayName
    const { data: profiles } = await client
      .from('user_profiles')
      .select('user_id, display_name');

    const profileMap = new Map(
      (profiles ?? []).map((p: { user_id: string; display_name: string | null }) => [
        p.user_id,
        p.display_name,
      ])
    );

    // Filtra usuários pelo email, ID ou displayName
    const filtered = usersData.users
      .filter((user) => {
        const email = user.email?.toLowerCase() ?? '';
        const id = user.id.toLowerCase();
        const displayName = (profileMap.get(user.id) ?? '').toLowerCase();

        return (
          email.includes(searchQuery) ||
          id.includes(searchQuery) ||
          displayName.includes(searchQuery)
        );
      })
      .slice(0, 10); // Limita a 10 resultados

    return filtered.map((user) => ({
      id: user.id,
      email: user.email ?? 'sem-email',
      displayName: profileMap.get(user.id) ?? null,
    }));
  } catch (error) {
    console.error('[moderation] erro ao buscar usuários', error);
    return [];
  }
}

const purgeUserSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido.'),
});

export type PurgeUserPlatformDataResult =
  | {
      status: 'success';
      message: string;
      deleted: {
        globalChatMessages: number;
        chatMessages: number;
        chatThreads: number;
        withdrawRequests: number;
        bets: number;
      };
    }
  | { status: 'error'; message: string };

export async function purgeUserPlatformData(userId: string): Promise<PurgeUserPlatformDataResult> {
  const session = await getCurrentSession();

  if (!isAdminSession(session) || !session) {
    return { status: 'error', message: 'Acesso não autorizado.' };
  }

  const parsed = purgeUserSchema.safeParse({ userId });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Dados inválidos.';
    return { status: 'error', message: firstIssue };
  }

  try {
    const result = await userDataPurgeService.purgeUserData(parsed.data.userId);

    revalidatePath('/admin');

    return {
      status: 'success',
      message: 'Conversas e pedidos do usuário foram apagados com sucesso.',
      deleted: result.deleted,
    };
  } catch (error) {
    console.error('[moderation] erro ao apagar dados do usuário', error);
    const message = error instanceof Error ? error.message : 'Erro ao apagar dados do usuário.';
    return { status: 'error', message };
  }
}
