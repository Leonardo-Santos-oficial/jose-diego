import { memo } from 'react';
import type { GameStateMessage } from '@/types/aviator';

interface GameStatusDisplayProps {
  state: GameStateMessage['state'];
  multiplier: number;
  closesIn?: number | null;
}

const phaseColors = {
  awaitingBets: 'text-sky-400',
  flying: 'text-white',
  crashed: 'text-rose-500',
};

const phaseLabels = {
  awaitingBets: 'Apostas Abertas',
  flying: 'Em Voo',
  crashed: 'Voou para Longe',
};

export const GameStatusDisplay = memo(function GameStatusDisplay({ state, multiplier, closesIn }: GameStatusDisplayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
      
      {/* Multiplier Text */}
      <div className={`text-7xl md:text-9xl font-black tracking-tighter transition-colors duration-300 drop-shadow-2xl ${phaseColors[state]}`}>
        {multiplier.toFixed(2)}x
      </div>

      {/* Status Label */}
      <div className="mt-4 text-xl font-bold uppercase tracking-[0.2em] text-slate-300 drop-shadow-md">
        {phaseLabels[state]}
      </div>

      {/* Loading Bar for Awaiting Bets */}
      {state === 'awaitingBets' && (
        <div className="mt-8 w-64 h-2 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-sky-500 transition-all duration-100 ease-linear"
            style={{ width: `${closesIn ? (closesIn / 5000) * 100 : 100}%` }}
          />
        </div>
      )}
    </div>
  );
});
