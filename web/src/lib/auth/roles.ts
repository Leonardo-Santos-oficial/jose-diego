import type { Session } from '@supabase/supabase-js';

function extractRole(session: Session | null): string {
  if (!session?.user) {
    return '';
  }

  const metadataRole =
    session.user.app_metadata?.role ?? session.user.user_metadata?.role;
  if (typeof metadataRole === 'string') {
    return metadataRole.toLowerCase();
  }

  return '';
}

export function isAdminSession(session: Session | null): boolean {
  return extractRole(session) === 'admin';
}
