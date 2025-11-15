import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/serverClient';

const isE2EEnabled = process.env.NEXT_PUBLIC_E2E === '1';

export async function POST(request: Request) {
  if (!isE2EEnabled) {
    return NextResponse.json({ error: 'E2E helpers are disabled.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password.trim() : '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email e senha são obrigatórios para o login de testes.' },
      { status: 400 }
    );
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ userId: data.user?.id ?? null });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha inesperada ao autenticar usuário de testes.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
