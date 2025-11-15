import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { getAdminRealtimeUsers } from '@/tests/mocks/adminRealtimeHarness';

export const metadata: Metadata = {
  title: 'Admin • Realtime (E2E)',
  description: 'Ambiente isolado para validar comandos de saldo em tempo real.',
};

export const dynamic = 'force-dynamic';

export default function AdminRealtimeE2EPage() {
  if (process.env.NEXT_PUBLIC_E2E !== '1') {
    notFound();
  }

  const users = getAdminRealtimeUsers();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-100">
        <p className="font-semibold">Modo E2E ligado</p>
        <p>
          Esta página usa o <code>SupabaseTimelineMock</code> para simular eventos e
          permitir que o Playwright injete resultados determinísticos.
        </p>
      </div>
      <AdminUserTable users={users} />
    </main>
  );
}
