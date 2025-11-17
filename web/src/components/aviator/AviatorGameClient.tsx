'use client';

import { useEffect, useTransition } from 'react';
import { AviatorScene } from '@/components/aviator/AviatorScene';
import { AviatorHud } from '@/components/aviator/AviatorHud';
import { AviatorBetPanel } from '@/components/aviator/AviatorBetPanel';
import { AviatorHistoryRail } from '@/components/aviator/AviatorHistoryRail';
import { AviatorSoundtrackToggle } from '@/components/aviator/AviatorSoundtrackToggle';
import { useAviatorController } from '@/modules/aviator/hooks/useAviatorController';
import { useAviatorStore } from '@/modules/aviator/state/useAviatorStore';
import { aviatorAssets } from '@/modules/aviator/config/sceneConfig';
import type { WalletSnapshot } from '@/types/aviator';

export type AviatorGameClientProps = {
  userId: string;
  initialWalletSnapshot?: WalletSnapshot | null;
  initialAutoCashoutPreference?: boolean;
};

export function AviatorGameClient({
  userId,
  initialWalletSnapshot,
  initialAutoCashoutPreference,
}: AviatorGameClientProps) {
  const controller = useAviatorController(userId);
  const state = useAviatorStore((store) => store.state);
  const history = useAviatorStore((store) => store.history);
  const betResult = useAviatorStore((store) => store.betResult);
  const cashoutResult = useAviatorStore((store) => store.cashoutResult);
  const walletSnapshot = useAviatorStore((store) => store.walletSnapshot);
  const musicEnabled = useAviatorStore((store) => store.musicEnabled);
  const isConnected = useAviatorStore((store) => store.isConnected);
  const syncWalletSnapshot = useAviatorStore((store) => store.syncWalletSnapshot);
  const [, startSyncTransition] = useTransition();

  useEffect(() => {
    if (initialWalletSnapshot) {
      startSyncTransition(() => {
        syncWalletSnapshot(initialWalletSnapshot);
      });
    }
  }, [initialWalletSnapshot, startSyncTransition, syncWalletSnapshot]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_0_120px_rgba(15,118,110,0.2)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${aviatorAssets.background})` }}
        aria-hidden="true"
      />
      <div className="relative grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <AviatorScene state={state} history={history} />
          <AviatorHud
            isConnected={isConnected}
            gameState={state}
            walletSnapshot={walletSnapshot}
            betResult={betResult}
            cashoutResult={cashoutResult}
          />
        </div>
        <div className="space-y-6">
          <AviatorBetPanel
            controller={controller}
            currentRoundId={state?.roundId}
            currentPhase={state?.state}
            initialAutoCashoutPreference={initialAutoCashoutPreference}
          />
          <AviatorSoundtrackToggle
            enabled={musicEnabled}
            onToggle={(value) => controller.toggleMusic(value)}
          />
          <AviatorHistoryRail history={history} />
        </div>
      </div>
    </section>
  );
}
