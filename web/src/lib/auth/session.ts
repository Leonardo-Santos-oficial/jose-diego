import type { Session } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/serverClient';

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  } catch (error) {
    console.warn('Não foi possível recuperar sessão atual:', error);
    return null;
  }
}

export function getDisplayName(session: Session | null): string {
  const metadataName = session?.user.user_metadata?.display_name;
  if (typeof metadataName === 'string' && metadataName.trim().length > 0) {
    return metadataName;
  }

  const email = session?.user.email;
  if (email) {
    const [localPart] = email.split('@');
    return localPart ?? email;
  }

  return 'Visitante';
}
