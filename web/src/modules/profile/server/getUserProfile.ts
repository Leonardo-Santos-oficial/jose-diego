import { getSupabaseServerClient } from '@/lib/supabase/serverClient';

export type UserProfile = {
  displayName: string;
  pixKey: string;
};

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('display_name, pix_key')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Falha ao carregar perfil do usuário: ${error.message}`);
  }

  return {
    displayName: data?.display_name ?? '',
    pixKey: data?.pix_key ?? '',
  };
}
