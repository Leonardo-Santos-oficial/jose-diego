import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_PATH = '/admin';
const APP_PATH = '/app';
const PUBLIC_REDIRECT = '/';
const isE2EEnabled = process.env.NEXT_PUBLIC_E2E === '1';
const E2E_BYPASS_PATHS = ['/admin/realtime-e2e'];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('Supabase env vars ausentes para proxy.');
    return response;
  }

  const supabase = await createServerClient(url, anonKey, {
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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  if (isE2EEnabled && E2E_BYPASS_PATHS.some((route) => pathname.startsWith(route))) {
    return response;
  }

  const requiresAuth = pathname.startsWith(APP_PATH);
  const requiresAdmin = pathname.startsWith(ADMIN_PATH);

  if (!session && (requiresAuth || requiresAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = PUBLIC_REDIRECT;
    return NextResponse.redirect(url);
  }

  if (requiresAdmin) {
    const role = session?.user.app_metadata?.role;
    if (role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = APP_PATH;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
