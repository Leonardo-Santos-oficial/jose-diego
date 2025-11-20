import type { User } from '@supabase/supabase-js';

function extractRole(user: User | null): string {
  if (!user) {
    return '';
  }

  const metadataRole =
    user.app_metadata?.role ?? user.user_metadata?.role;
  if (typeof metadataRole === 'string') {
    return metadataRole.toLowerCase();
  }

  return '';
}

export function isAdminSession(user: User | null): boolean {
  return extractRole(user) === 'admin';
}
