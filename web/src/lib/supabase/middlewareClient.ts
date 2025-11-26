import type { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookieSecurity } from '@/config/security';

const missingEnvMessage =
  'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.';

export function getSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(missingEnvMessage);
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        const secureOptions = cookieSecurity.applyToOptions(options);
        response.cookies.set({ name, value, ...secureOptions });
      },
      remove(name, options) {
        const secureOptions = cookieSecurity.applyToOptions(options);
        response.cookies.set({ name, value: '', ...secureOptions, maxAge: 0 });
      },
    },
  });
}
