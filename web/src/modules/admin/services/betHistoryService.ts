import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

export type AdminBetHistoryEntry = {
  id: string;
  roundId: string;
  userId: string;
  amount: number;
  multiplier: number | null;
  payout: number | null;
  status: string;
  createdAt: string;
  userEmail?: string;
};

export async function fetchGlobalBetHistory(limit = 100): Promise<AdminBetHistoryEntry[]> {
  const supabase = getSupabaseServiceRoleClient();

  // TODO: Join with auth.users is not directly possible via PostgREST.
  // We need to fetch users separately or use a view.
  // For now, we'll fetch bets and then enrich with user data if needed.
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[admin] falha ao buscar histórico de apostas', error);
    return [];
  }

  // Fetch user emails
  const userIds = Array.from(new Set(data.map((b) => b.user_id).filter(Boolean))) as string[];
  const userMap = new Map<string, string>();

  // Fetch users in parallel (limit concurrency if needed, but 100 is okay-ish for admin)
  await Promise.all(
    userIds.map(async (uid) => {
      const { data: userData } = await supabase.auth.admin.getUserById(uid);
      if (userData.user?.email) {
        userMap.set(uid, userData.user.email);
      }
    })
  );

  return data.map((row: any) => ({
    id: row.id,
    roundId: row.round_id,
    userId: row.user_id,
    amount: row.amount,
    multiplier: row.multiplier,
    payout: row.payout,
    status: row.status ?? 'pending',
    createdAt: row.created_at,
    userEmail: userMap.get(row.user_id) ?? 'Desconhecido',
  }));
}
