import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminBetsTable } from '@/components/admin/AdminBetsTable';
import { fetchGlobalBetHistory } from '@/modules/admin/services/betHistoryService';
import { getCurrentSession } from '@/lib/auth/session';
import { isAdminSession } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Admin • Histórico de Apostas',
  description: 'Visualize todas as apostas realizadas na plataforma.',
};

export const dynamic = 'force-dynamic';

export default async function AdminBetsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await getCurrentSession();

  if (!isAdminSession(session)) {
    redirect('/');
  }

  const page = Number(searchParams.page) || 1;
  const { data: bets, totalPages } = await fetchGlobalBetHistory(page, 50);

  return (
    <main className="flex flex-col gap-6 p-4 md:p-8">
      <AdminBetsTable bets={bets} currentPage={page} totalPages={totalPages} />
    </main>
  );
}
