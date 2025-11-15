import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const missingEnvMessage =
  'Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local.';

let serviceClient: SupabaseClient | null = null;

export function getSupabaseServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(missingEnvMessage);
  }

  if (serviceClient) {
    return serviceClient;
  }

  serviceClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClient;
}
