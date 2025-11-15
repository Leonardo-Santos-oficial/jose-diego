import { createWalletRepository } from '@/modules/admin/repositories/walletRepository';
import type { AdminUserSummary } from '@/modules/admin/types';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

type UserProfileRow = {
  user_id: string;
  display_name: string | null;
};

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const client = getSupabaseServiceRoleClient();
  const walletRepository = createWalletRepository(client);

  const [wallets, profilesResult, usersResult] = await Promise.all([
    walletRepository.listWallets(),
    client
      .from('user_profiles')
      .select('user_id, display_name')
      .returns<UserProfileRow[]>(),
    client.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (profilesResult.error) {
    throw new Error(`Falha ao buscar perfis: ${profilesResult.error.message}`);
  }

  if (usersResult.error) {
    throw new Error(`Falha ao listar usuários: ${usersResult.error.message}`);
  }

  const profileRows = profilesResult.data ?? [];
  const profileMap = new Map(
    profileRows.map((profile) => [profile.user_id, profile.display_name])
  );
  const walletMap = new Map(wallets.map((wallet) => [wallet.user_id, wallet]));

  return usersResult.data.users.map((user) => {
    const wallet = walletMap.get(user.id);

    return {
      id: user.id,
      email: user.email ?? 'sem-email',
      role: (user.role as 'user' | 'admin') ?? 'user',
      displayName: profileMap.get(user.id),
      balance: Number(wallet?.balance ?? 0),
      walletUpdatedAt: wallet?.updated_at ?? null,
    } satisfies AdminUserSummary;
  });
}
