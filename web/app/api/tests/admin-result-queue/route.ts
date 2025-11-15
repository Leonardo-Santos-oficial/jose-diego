import { NextResponse } from 'next/server';
import type { AdminActionState } from '@/modules/admin/types/actionState';
import { replaceAdminResultQueue } from '@/tests/mocks/adminRealtimeHarness';

function guardE2E() {
  if (process.env.NEXT_PUBLIC_E2E !== '1') {
    return NextResponse.json({ error: 'E2E helpers disabled' }, { status: 403 });
  }
  return null;
}

export async function POST(request: Request) {
  const guard = guardE2E();
  if (guard) {
    return guard;
  }

  let payload: { queue?: AdminActionState[] };
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload', detail: String(error) },
      { status: 400 }
    );
  }

  if (!Array.isArray(payload.queue)) {
    return NextResponse.json(
      { error: 'Body must include `queue` array' },
      { status: 400 }
    );
  }

  replaceAdminResultQueue(payload.queue);
  return NextResponse.json({ ok: true, size: payload.queue.length });
}
