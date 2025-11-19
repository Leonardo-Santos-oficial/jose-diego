import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { AdminChatInboxSection } from '@/components/chat/AdminChatInboxSection';
import { AdminChatAnalyticsSection } from '@/components/chat/AdminChatAnalyticsSection';
import { fetchAdminUsers } from '@/modules/admin/services/dashboardService';
import { getCurrentSession } from '@/lib/auth/session';
import { isAdminSession } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Admin • Carteiras',
  description: 'Gerencie usuários, saldos e comandos administrativos.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!isAdminSession(session)) {
    redirect('/');
  }

  const users = await fetchAdminUsers();

  return (
    <main className="flex flex-col gap-6 p-4 md:p-8">
      <AdminUserTable users={users} />
      <AdminChatInboxSection />
      <AdminChatAnalyticsSection />
    </main>
  );
}
