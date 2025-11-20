import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AviatorGameClient } from '@/components/aviator/AviatorGameClient';
import { UserChatWidgetServer } from '@/components/chat/UserChatWidgetServer';
import { getCurrentSession, getDisplayName } from '@/lib/auth/session';
import { getWalletSnapshot } from '@/modules/wallet/server/getWalletSnapshot';
import { getCashoutPreference } from '@/modules/preferences/server/getCashoutPreference';

export const metadata: Metadata = {
  title: 'Aviator - Demo',
  description:
    'Participe do loop em tempo real com apostas fictícias e HUD inspirado nos assets originais.',
};

import { ChatWrapper } from '@/components/chat/ChatWrapper';

export default async function AviatorAppPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  const displayName = getDisplayName(session);

  let walletSnapshot: Awaited<ReturnType<typeof getWalletSnapshot>>;
  let autoCashoutPreference = false;

  try {
    const [snapshot, preference] = await Promise.all([
      getWalletSnapshot(session.id),
      getCashoutPreference(session.id).catch((error) => {
        console.error('Falha ao buscar preferência de cashout:', error);
        return false;
      }),
    ]);
    walletSnapshot = snapshot;
    autoCashoutPreference = preference;
  } catch (error) {
    console.error('Falha ao buscar carteira inicial do Aviator:', error);
    walletSnapshot = null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AviatorGameClient
        userId={session.id}
        initialWalletSnapshot={walletSnapshot}
        initialAutoCashoutPreference={autoCashoutPreference}
      />
      <ChatWrapper>
        <UserChatWidgetServer userId={session.id} userName={displayName} />
      </ChatWrapper>
    </div>
  );
}
