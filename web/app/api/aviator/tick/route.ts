import { NextResponse } from 'next/server';
import { createAviatorEngineFacade } from '@/modules/aviator/serverless/AviatorEngineFacade';

const TICK_SECRET = process.env.AVIATOR_TICK_SECRET;

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const facade = createAviatorEngineFacade();
    const result = await facade.tick();
    return NextResponse.json({
      roundId: result.state.roundId,
      phase: result.state.phase,
      multiplier: result.state.currentMultiplier,
    });
  } catch (error) {
    console.error('aviator.tick failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tick falhou.' },
      { status: 500 }
    );
  }
}

function isAuthorized(request: Request): boolean {
  if (!TICK_SECRET) {
    return true;
  }

  const headerSecret = request.headers.get('x-aviator-secret');
  if (headerSecret && headerSecret === TICK_SECRET) {
    return true;
  }

  const auth = request.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    return token === TICK_SECRET;
  }

  return false;
}
