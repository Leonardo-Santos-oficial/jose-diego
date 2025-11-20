import type { User } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/serverClient';

export async function getCurrentSession(): Promise<User | null> {
  try {
    const supabase = await getSupabaseServerClient({ readOnly: true });
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch (error) {
    console.warn('Não foi possível recuperar sessão atual:', error);
    return null;
  }
}

export function getDisplayName(user: User | null): string {
  const metadataName = user?.user_metadata?.display_name;
  if (typeof metadataName === 'string' && metadataName.trim().length > 0) {
    return metadataName;
  }

  const email = user?.email;
  if (email) {
    const [localPart] = email.split('@');
    return localPart ?? email;
  }

  return 'Visitante';
}

export function getUserEmail(user: User | null): string | undefined {
  return user?.email;
}
