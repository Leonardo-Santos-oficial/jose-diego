import { getSupabaseServerClient } from '@/lib/supabase/serverClient';

export async function getCashoutPreference(userId: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('cashout_auto_pref')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Falha ao buscar preferências de cashout: ${error.message}`);
  }

  return Boolean(data?.cashout_auto_pref);
}
