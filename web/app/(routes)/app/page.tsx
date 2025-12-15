import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AviatorGameClient } from '@/components/aviator/AviatorGameClient';
import { getCurrentSession, getDisplayName } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/serverClient';
import { getWalletSnapshot } from '@/modules/wallet/server/getWalletSnapshot';
import { getCashoutPreference } from '@/modules/preferences/server/getCashoutPreference';

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

  const displayName = getDisplayName(session);

  // Token necessário para autenticar no WebSocket da engine.
  // Em fluxos SSR, o browser pode não ter acesso ao access_token via supabase.auth.getSession().
  const supabase = await getSupabaseServerClient({ readOnly: true });
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  const engineAccessToken = authSession?.access_token ?? null;

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
        engineAccessToken={engineAccessToken}
        initialWalletSnapshot={walletSnapshot}
        initialAutoCashoutPreference={autoCashoutPreference}
      />
    </div>
  );
}
