import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import {
  PlayerCommandError,
  PlayerCommandService,
} from '@/modules/aviator/services/playerCommandService';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const roundId = String(payload.roundId ?? '').trim();
  const amount = Number(payload.amount);
  const autopayoutMultiplier =
    payload.autopayoutMultiplier !== undefined
      ? Number(payload.autopayoutMultiplier)
      : undefined;

  const session = await getCurrentSession();
  const bearer = readBearerToken(request.headers.get('authorization'));
  const adminBearer = process.env.AVIATOR_ADMIN_BEARER?.trim();
  const isAdminRequest = Boolean(adminBearer && bearer && bearer === adminBearer);

  if (!session?.id && !isAdminRequest) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const service = session?.id
      ? await PlayerCommandService.forCurrentUser({ session })
      : PlayerCommandService.forUser(String(payload.userId ?? '').trim());

    const result = await service.placeBet({
      roundId,
      amount,
      autopayoutMultiplier,
    });

    const status = result.status === 'accepted' ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof PlayerCommandError) {
      const status = error.code === 'UNAUTHENTICATED' ? 401 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error('aviator.bets failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao processar aposta.' },
      { status: 500 }
    );
  }
}

function readBearerToken(headerValue: string | null): string {
  if (!headerValue) {
    return '';
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? '';
}
