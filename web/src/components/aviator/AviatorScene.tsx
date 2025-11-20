import type { CSSProperties } from 'react';
import Image from 'next/image';
import type { GameHistoryEntry, GameStateMessage } from '@/types/aviator';
import {
  aviatorAssets,
  bucketPalette,
  phasePalette,
} from '@/modules/aviator/config/sceneConfig';

export type AviatorSceneProps = {
  state?: GameStateMessage;
  history: GameHistoryEntry[];
};

const bucketLabels: Record<GameHistoryEntry['bucket'], string> = {
  blue: 'Seguro',
  purple: 'Risco médio',
  pink: 'Alta volatilidade',
};

export function AviatorScene({ state, history }: AviatorSceneProps) {
  const multiplier = state?.multiplier ?? 1;
  const closesIn = state?.bettingWindow?.closesInMs ?? null;
  const autopayouts = state?.autopayouts?.length ?? 0;
  const recentHistory = history.slice(-5).reverse();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <div
        className="aviator-particles pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* Central Multiplier */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        <div className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(20,184,166,0.5)] md:text-9xl">
          {multiplier.toFixed(2)}x
        </div>
        <div
          className="mt-2 text-xl font-bold uppercase tracking-widest"
          style={{ color: phasePalette[state?.state ?? 'awaitingBets'] }}
        >
          {labelForPhase(state?.state ?? 'awaitingBets')}
        </div>
      </div>

      {/* Plane Animation Layer */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {state?.state === 'flying' && (
          <div className="relative h-full w-full">
             {/* Simple CSS animation for now - ideally this would be a Canvas or SVG */}
             <Image
              src={aviatorAssets.plane}
              alt="Avião"
              width={300}
              height={150}
              className="absolute left-1/2 top-1/2 w-48 -translate-x-1/2 -translate-y-1/2 animate-pulse transition-transform duration-1000 md:w-[300px]"
              style={{ 
                transform: `translate(-50%, -50%) scale(${1 + Math.min(multiplier / 10, 0.5)}) rotate(-10deg)`
              }}
            />
             <Image
              src={aviatorAssets.ruler}
              alt="Régua"
              fill
              className="object-cover opacity-20 mix-blend-overlay"
            />
          </div>
        )}
        {state?.state === 'crashed' && (
           <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-rose-500">VOOU PARA LONGE!</p>
           </div>
        )}
        {state?.state === 'awaitingBets' && (
           <div className="flex flex-col items-center gap-2">
              <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-800">
                 <div 
                   className="h-full bg-teal-500 transition-all duration-1000 ease-linear"
                   style={{ width: `${closesIn ? (closesIn / 5000) * 100 : 100}%` }}
                 />
              </div>
              <p className="text-sm text-slate-400">Próxima rodada em breve...</p>
           </div>
        )}
      </div>
    </div>
  );
}

function labelForPhase(phase: GameStateMessage['state']) {
  switch (phase) {
    case 'awaitingBets':
      return 'Apostas abertas';
    case 'flying':
      return 'Em voo';
    case 'crashed':
      return 'Caiu';
    default:
      return 'Desconhecida';
  }
}
