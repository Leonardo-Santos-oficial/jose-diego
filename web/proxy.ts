import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseMiddlewareClient } from '@/lib/supabase/middlewareClient';
import { isAdminSession } from '@/lib/auth/roles';

const ADMIN_PATH = '/admin';
const APP_PATH = '/app';
const PUBLIC_REDIRECT = '/';
const isE2EEnabled = process.env.NEXT_PUBLIC_E2E === '1';
const E2E_BYPASS_PATHS = ['/admin/realtime-e2e'];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  let session = null;
  try {
    const supabase = getSupabaseMiddlewareClient(request, response);
    const { data } = await supabase.auth.getSession();
    session = data.session ?? null;
  } catch (error) {
    console.warn('[proxy] Supabase não configurado corretamente:', error);
  }

  const pathname = request.nextUrl.pathname;
  if (isE2EEnabled && E2E_BYPASS_PATHS.some((route) => pathname.startsWith(route))) {
    return response;
  }

  const requiresAuth = pathname.startsWith(APP_PATH);
  const requiresAdmin = pathname.startsWith(ADMIN_PATH);

  if (!session && (requiresAuth || requiresAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = PUBLIC_REDIRECT;
    url.searchParams.set('unauthorized', '1');
    return NextResponse.redirect(url);
  }

  if (requiresAdmin) {
    if (!session || !isAdminSession(session)) {
      const url = request.nextUrl.clone();
      url.pathname = PUBLIC_REDIRECT;
      url.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
