import { NextResponse } from 'next/server';
import { getSerializedTimelineSnapshot } from '@/tests/mocks/adminRealtimeHarness';

function guardE2E() {
  if (process.env.NEXT_PUBLIC_E2E !== '1') {
    return NextResponse.json({ error: 'E2E helpers disabled' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const guard = guardE2E();
  if (guard) {
    return guard;
  }

  const snapshot = getSerializedTimelineSnapshot();
  return NextResponse.json(snapshot);
}
