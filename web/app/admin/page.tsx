import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminChatInboxSection } from '@/components/chat/AdminChatInboxSection';
import { AdminChatAnalyticsSection } from '@/components/chat/AdminChatAnalyticsSection';
import { fetchAdminUsers } from '@/modules/admin/services/dashboardService';
import { fetchGlobalBetHistory } from '@/modules/admin/services/betHistoryService';
import { WithdrawService } from '@/modules/withdraw/services/withdrawService';
import { getCurrentSession } from '@/lib/auth/session';
import { isAdminSession } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Admin • Painel Administrativo',
  description: 'Gerencie usuários, jogo, apostas e saques.',
};

export const dynamic = 'force-dynamic';

interface AdminPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getCurrentSession();

  if (!isAdminSession(session)) {
    redirect('/');
  }

  const resolvedSearchParams = await searchParams;
  const betsPage = Number(resolvedSearchParams.page) || 1;

  const [users, betsResult, withdrawRequests] = await Promise.all([
    fetchAdminUsers(),
    fetchGlobalBetHistory(betsPage, 50),
    new WithdrawService().listAll(),
  ]);

  return (
    <main className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-4 md:p-6 lg:p-8">
      <AdminDashboard
        users={users}
        bets={betsResult.data}
        betsCurrentPage={betsPage}
        betsTotalPages={betsResult.totalPages}
        withdrawRequests={withdrawRequests}
        chatInboxSection={<AdminChatInboxSection />}
        chatAnalyticsSection={<AdminChatAnalyticsSection />}
      />
    </main>
  );
}
