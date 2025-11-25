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
    <div className="absolute inset-0 z-20 pointer-events-none">
      
      {/* Multiplier Container - Posicionado no canto superior esquerdo */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        {/* Multiplier Text */}
        <div className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter transition-all duration-300 ${textColor} ${pulseClass} ${scaleClass}`}>
          {multiplier.toFixed(2)}x
        </div>

        {/* Status Label */}
        <div className="mt-2 text-sm md:text-base font-bold uppercase tracking-[0.15em] text-slate-300 drop-shadow-md">
          {state === 'flying' && isHighMultiplier ? '🔥 SUPER GANHO!' : phaseLabels[state]}
        </div>
      </div>

      {/* Loading Bar for Awaiting Bets - Centralizado na tela com fundo escuro */}
      {state === 'awaitingBets' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Container com fundo escuro para melhor visibilidade */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl px-8 py-6 border border-slate-700/50 shadow-2xl">
            {/* Texto com cor mais vibrante */}
            <div className="text-xl md:text-2xl font-bold text-amber-400 mb-4 text-center drop-shadow-lg">
              ⏱️ Próxima rodada em...
            </div>
            
            {/* Barra de loading maior e mais visível */}
            <div className="w-56 md:w-72 h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-100 ease-linear shadow-lg"
                style={{ 
                  width: `${closesIn ? (closesIn / 5000) * 100 : 100}%`,
                  boxShadow: '0 0 10px rgba(251, 146, 60, 0.5)'
                }}
              />
            </div>
            
            {/* Contador de segundos */}
            <div className="text-center mt-3 text-2xl md:text-3xl font-black text-white">
              {closesIn ? Math.ceil(closesIn / 1000) : 5}s
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
