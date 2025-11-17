import { NextResponse } from 'next/server';
import { supabaseAuthProxy } from '@/lib/auth/supabaseAuthProxy';

const SUCCESS_PATH = process.env.NEXT_PUBLIC_AUTH_SUCCESS_PATH ?? '/app';
const ERROR_PATH = process.env.NEXT_PUBLIC_AUTH_ERROR_PATH ?? '/';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const nextPath = requestUrl.searchParams.get('next') ?? SUCCESS_PATH;

  const origin = requestUrl.origin;

  if (!code) {
    const message = errorDescription ?? 'Código de autorização não informado.';
    return NextResponse.redirect(
      `${origin}${ERROR_PATH}?authError=${encodeURIComponent(message)}`
    );
  }

  try {
    const { error } = await supabaseAuthProxy.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return NextResponse.redirect(`${origin}${nextPath}`);
  } catch (error) {
    console.error('[auth] falha ao concluir OAuth', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível concluir o login com Google.';
    return NextResponse.redirect(
      `${origin}${ERROR_PATH}?authError=${encodeURIComponent(message)}`
    );
  }
}
