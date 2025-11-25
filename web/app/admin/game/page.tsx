import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { GameControlPanel } from '@/components/admin/GameControlPanel';
import { getCurrentSession } from '@/lib/auth/session';
import { isAdminSession } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Admin • Controle do Jogo',
  description: 'Gerencie o estado do motor do jogo Aviator.',
};

export default async function AdminGamePage() {
  const session = await getCurrentSession();

  if (!isAdminSession(session)) {
    redirect('/');
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-8">
      <GameControlPanel />
    </main>
  );
}
