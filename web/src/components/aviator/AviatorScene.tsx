import type { GameHistoryEntry, GameStateMessage } from '@/types/aviator';
import { SceneBackground } from './scene/SceneBackground';
import { FlightCurve } from './scene/FlightCurve';
import { PlayerPlane } from './scene/PlayerPlane';
import { GameStatusDisplay } from './scene/GameStatusDisplay';

export type AviatorSceneProps = {
  state?: GameStateMessage;
  history: GameHistoryEntry[];
};

/**
 * AviatorScene (Facade / Composite)
 * 
 * Coordinates the visual components of the game scene.
 * Implements the State Pattern visually by passing the current game state
 * to child components which handle their own rendering logic.
 */
export function AviatorScene({ state, history }: AviatorSceneProps) {
  // Default values to ensure safety (Clean Code: Defensive Programming)
  const currentState = state?.state ?? 'awaitingBets';
  const currentMultiplier = state?.multiplier ?? 1;
  const closesIn = state?.bettingWindow?.closesInMs ?? null;
  const isFlying = currentState === 'flying';

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-slate-900 select-none">
      
      {/* 1. Background Layer */}
      <SceneBackground multiplier={currentMultiplier} isFlying={isFlying} />

      {/* 2. Trajectory Layer */}
      <FlightCurve />

      {/* 3. Game Objects Layer */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {/* The plane positioning is relative to this container */}
        <div className="absolute bottom-0 left-0 w-full h-full">
           <PlayerPlane 
             multiplier={currentMultiplier} 
             state={currentState} 
           />
        </div>
      </div>

      {/* 4. HUD / UI Layer */}
      <GameStatusDisplay 
        state={currentState} 
        multiplier={currentMultiplier}
        closesIn={closesIn}
      />
      
    </div>
  );
}
