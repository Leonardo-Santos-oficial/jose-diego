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
  
  // Dynamic styling based on multiplier value
  const isHighMultiplier = multiplier >= 10;
  const isMediumMultiplier = multiplier >= 2 && multiplier < 10;

  // Pulse speed increases with multiplier (Heartbeat effect)
  const pulseClass = state === 'flying' ? (
    isHighMultiplier ? 'animate-[pulse_0.4s_ease-in-out_infinite]' : 
    isMediumMultiplier ? 'animate-[pulse_0.8s_ease-in-out_infinite]' : ''
  ) : '';

  // Color progression: White -> Gold -> Red/Pink (Intense)
  const textColor = state === 'crashed' ? 'text-slate-500' :
                    isHighMultiplier ? 'text-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.6)]' :
                    isMediumMultiplier ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]' :
                    'text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]';

  const scaleClass = state === 'flying' ? 'scale-100' : 
                     state === 'crashed' ? 'scale-90 opacity-80 grayscale' : 'scale-100';

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
      
      {/* Multiplier Text */}
      <div className={`text-7xl md:text-9xl font-black tracking-tighter transition-all duration-300 ${textColor} ${pulseClass} ${scaleClass}`}>
        {multiplier.toFixed(2)}x
      </div>

      {/* Status Label */}
      <div className="mt-4 text-xl font-bold uppercase tracking-[0.2em] text-slate-300 drop-shadow-md">
        {state === 'flying' && isHighMultiplier ? 'SUPER GANHO!' : phaseLabels[state]}
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
