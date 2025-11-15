import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

const isE2EEnabled = process.env.NEXT_PUBLIC_E2E === '1';

export async function POST(request: Request) {
  if (!isE2EEnabled) {
    return NextResponse.json({ error: 'E2E helpers are disabled.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const amount = Number(body?.amount);

  if (!email || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: 'Informe email e valor numérico para atualizar a carteira.' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const normalizedEmail = email.toLowerCase();
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    const user = userData?.users?.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          error: userError?.message ?? 'Usuário não encontrado para o seed de carteira.',
        },
        { status: 404 }
      );
    }

    const userId = user.id;
    const payload = {
      user_id: userId,
      balance: amount,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('wallets')
      .upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false });

    if (error) {
      return NextResponse.json(
        { error: error.message ?? 'Falha ao atualizar carteira.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ userId, balance: payload.balance });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro inesperado ao atualizar carteira de testes.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
