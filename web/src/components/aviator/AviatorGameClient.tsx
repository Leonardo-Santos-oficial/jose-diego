'use client';

import { useEffect, useTransition, useState } from 'react';
import { AviatorScene } from '@/components/aviator/AviatorScene';
import { AviatorHud } from '@/components/aviator/AviatorHud';
import { AviatorBettingArea } from '@/components/aviator/AviatorBettingArea';
import { AviatorHistoryRail } from '@/components/aviator/AviatorHistoryRail';
import { AviatorSoundtrackToggle } from '@/components/aviator/AviatorSoundtrackToggle';
import { useAviatorController } from '@/modules/aviator/hooks/useAviatorController';
import { useAviatorStore } from '@/modules/aviator/state/useAviatorStore';
import { aviatorAssets } from '@/modules/aviator/config/sceneConfig';
import type { WalletSnapshot } from '@/types/aviator';
import { AviatorHeader } from '@/components/aviator/AviatorHeader';
import { GlobalChatWidget } from '@/components/global-chat/GlobalChatWidget';

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
  const [isMobileChatMinimized, setIsMobileChatMinimized] = useState(false);

  useEffect(() => {
    if (initialWalletSnapshot) {
      startSyncTransition(() => {
        syncWalletSnapshot(initialWalletSnapshot);
      });
    }
  }, [initialWalletSnapshot, startSyncTransition, syncWalletSnapshot]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <AviatorHeader userId={userId} />
      
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Panel: Betting Controls */}
        <div className="order-2 flex flex-1 flex-col overflow-y-auto border-t border-white/10 bg-slate-900 p-2 lg:order-1 lg:w-[320px] lg:flex-none lg:border-r lg:border-t-0 lg:p-4">
          <AviatorBettingArea
            controller={controller}
            currentRoundId={state?.roundId}
            currentPhase={state?.state}
            initialAutoCashoutPreference={initialAutoCashoutPreference}
          />
        </div>

        {/* Right Panel: Game Stage & History */}
        <div className="order-1 flex h-[28vh] min-h-[180px] flex-col bg-black lg:order-2 lg:h-auto lg:flex-1">
          {/* Top Bar: History & Tools */}
          <div className="grid h-12 w-full grid-cols-[1fr_auto] items-center border-b border-white/10 bg-slate-900/50 px-4 backdrop-blur-sm">
            <div className="min-w-0 overflow-hidden">
               <AviatorHistoryRail history={history} />
            </div>
            <div className="ml-4">
              <AviatorSoundtrackToggle
                enabled={musicEnabled}
                onToggle={(value) => controller.toggleMusic(value)}
              />
            </div>
          </div>

          {/* Game Canvas Area */}
          <div className="relative flex-1 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${aviatorAssets.background})` }}
              aria-hidden="true"
            />
            
            <div className="relative z-10 h-full w-full">
               <AviatorScene state={state} history={history} />
            </div>

            {/* HUD Overlay */}
            <div className="absolute right-4 top-4 z-20">
              <AviatorHud
                isConnected={isConnected}
                gameState={state}
                walletSnapshot={walletSnapshot}
                betResult={betResult}
                cashoutResult={cashoutResult}
              />
            </div>
          </div>
        </div>

        {/* Far Right Panel: Chat (Desktop) */}
        <div className="hidden lg:order-3 lg:flex lg:w-[300px] lg:flex-col lg:border-l lg:border-white/10 lg:bg-slate-900 relative z-[60]">
          <div className="flex flex-col" style={{ height: 'calc(100% - 80px)' }}>
            <GlobalChatWidget />
          </div>
        </div>
      </div>

      {/* Mobile Chat Drawer (Optional - or just below betting area) */}
      <div 
        className={`lg:hidden border-t border-white/10 bg-slate-900 flex flex-col relative z-10 transition-all duration-300 ${isMobileChatMinimized ? 'flex-shrink-0' : ''}`}
        style={{ height: isMobileChatMinimized ? 'auto' : 'calc(350px - 80px)' }}
      >
         <GlobalChatWidget onMinimizeChange={setIsMobileChatMinimized} />
      </div>
    </div>
  );
}
