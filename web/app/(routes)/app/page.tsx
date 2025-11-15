import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AviatorGameClient } from '@/components/aviator/AviatorGameClient';
import { getCurrentSession } from '@/lib/auth/session';
import { getWalletSnapshot } from '@/modules/wallet/server/getWalletSnapshot';

export const metadata: Metadata = {
  title: 'Aviator - Demo',
  description:
    'Participe do loop em tempo real com apostas fictícias e HUD inspirado nos assets originais.',
};

export default async function AviatorAppPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  let walletSnapshot: Awaited<ReturnType<typeof getWalletSnapshot>>;

  try {
    walletSnapshot = await getWalletSnapshot(session.user.id);
  } catch (error) {
    console.error('Falha ao buscar carteira inicial do Aviator:', error);
    walletSnapshot = null;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AviatorGameClient
        userId={session.user.id}
        initialWalletSnapshot={walletSnapshot}
      />
    </div>
  );
}
