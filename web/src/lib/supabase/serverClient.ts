import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookieSecurity } from '@/config/security';

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
    console.error('❌ Erro Crítico: Variáveis de ambiente do Supabase não encontradas.');
    console.error('Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas no Vercel.');
    throw new Error(missingEnvMessage);
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (readOnly) {
          return;
        }
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const secureOptions = cookieSecurity.applyToOptions(options);
            cookieStore.set(name, value, secureOptions);
          });
        } catch {
          // Ignorar erro se chamado de Server Component
        }
      },
    },
  });
}
