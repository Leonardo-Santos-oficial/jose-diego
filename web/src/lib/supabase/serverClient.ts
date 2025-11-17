import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const missingEnvMessage =
  'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.';

type ServerClientOptions = {
  readOnly?: boolean;
};

export async function getSupabaseServerClient(options: ServerClientOptions = {}) {
  const { readOnly = false } = options;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(missingEnvMessage);
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        if (readOnly) {
          return;
        }
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        if (readOnly) {
          return;
        }
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}
