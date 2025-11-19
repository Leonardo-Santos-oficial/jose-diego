import type { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
        response.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}
