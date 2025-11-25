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

export type BetHistoryResponse = {
  data: AdminBetHistoryEntry[];
  total: number;
  page: number;
  totalPages: number;
};

export async function fetchGlobalBetHistory(
  page = 1,
  limit = 50
): Promise<BetHistoryResponse> {
  const supabase = getSupabaseServiceRoleClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Fetch bets with count
  const { data, error, count } = await supabase
    .from('bets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[admin] falha ao buscar histórico de apostas', error);
    return { data: [], total: 0, page, totalPages: 0 };
  }

  // Fetch user emails
  const userIds = Array.from(new Set(data.map((b) => b.user_id).filter(Boolean))) as string[];
  const userMap = new Map<string, string>();

  await Promise.all(
    userIds.map(async (uid) => {
      const { data: userData } = await supabase.auth.admin.getUserById(uid);
      if (userData.user?.email) {
        userMap.set(uid, userData.user.email);
      }
    })
  );

  const enrichedData = data.map((row: any) => ({
    id: row.id,
    roundId: row.round_id,
    userId: row.user_id,
    amount: Number(row.stake),
    multiplier: row.payout_multiplier ? Number(row.payout_multiplier) : null,
    payout: row.payout_multiplier
      ? Number(row.stake) * Number(row.payout_multiplier)
      : null,
    status: row.cashed_out_at ? 'cashed_out' : 'pending',
    createdAt: row.created_at,
    userEmail: userMap.get(row.user_id) ?? 'Desconhecido',
  }));

  return {
    data: enrichedData,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}
