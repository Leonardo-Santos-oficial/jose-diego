import { memo } from 'react';
import type { GameStateMessage } from '@/types/aviator';

interface PlayerPlaneProps {
  multiplier: number;
  state: GameStateMessage['state'];
}

export const PlayerPlane = memo(function PlayerPlane({ multiplier, state }: PlayerPlaneProps) {
  // Calculate position based on multiplier
  // We use a log scale or bounded linear scale to keep it on screen
  // 1x = bottom left
  // 10x+ = top right (clamped)
  
  const isCrashed = state === 'crashed';
  const isFlying = state === 'flying';
  
  // Visual progress calculation using Logarithmic scale
  // This creates a natural "fast start, slow finish" effect common in crash games
  // The plane will reach "max screen position" at 100x multiplier
  const safeMultiplier = Math.max(multiplier, 1);
  const progress = Math.min(Math.log(safeMultiplier) / Math.log(100), 1);
  
  // Responsive positioning using Percentages relative to the container
  // This ensures the plane stays within the game area on ALL devices (Mobile, Tablet, Desktop)
  // Start: Left 5%, Bottom 10%
  // End: Left 80%, Bottom 80%
  const leftPos = 5 + (progress * 75); 
  const bottomPos = 10 + (progress * 70);

  const style = {
    left: `${leftPos}%`,
    bottom: isCrashed ? '-30%' : `${bottomPos}%`, // Drop well below screen on crash
    transform: isCrashed 
      ? `rotate(45deg)` 
      : `rotate(${-5 - (progress * 15)}deg)`,
    // Using standard CSS transitions for position (widely supported and responsive)
    transition: isCrashed 
      ? 'bottom 0.8s ease-in, left 0.3s linear, transform 0.8s ease-in' 
      : 'bottom 0.3s linear, left 0.3s linear, transform 0.3s linear',
  };

  if (!isFlying && !isCrashed) return null;

  return (
    <div 
      className="absolute z-50 will-change-transform"
      style={style}
    >
      <div className="relative w-16 md:w-24 lg:w-32 drop-shadow-2xl filter">
        {/* Jet Stream / Trail */}
        {isFlying && (
           <div className="absolute top-1/2 right-full w-32 h-1 bg-gradient-to-l from-white/50 to-transparent blur-sm transform -translate-y-1/2" />
        )}
        
        {/* Plane SVG */}
        <svg viewBox="0 0 512 512" className="w-full h-full fill-rose-600 stroke-white stroke-2">
           <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/>
        </svg>
      </div>
    </div>
  );
});
