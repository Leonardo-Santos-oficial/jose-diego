import type { Metadata } from 'next';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { fetchAdminUsers } from '@/modules/admin/services/dashboardService';

export const metadata: Metadata = {
  title: 'Admin • Carteiras',
  description: 'Gerencie usuários, saldos e comandos administrativos.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const users = await fetchAdminUsers();

  return (
    <main
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <AdminUserTable users={users} />
    </main>
  );
}
