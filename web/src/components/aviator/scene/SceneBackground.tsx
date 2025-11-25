import { memo } from 'react';

interface SceneBackgroundProps {
  multiplier: number;
}

export const SceneBackground = memo(function SceneBackground({ multiplier }: SceneBackgroundProps) {
  // Calculate atmosphere darkness based on multiplier
  // 1x = 0% darkness (Blue Sky)
  // 10x = 100% darkness (Space)
  const darkness = Math.min((multiplier - 1) / 10, 1);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-sky-500 transition-colors duration-1000">
      
      {/* Base Sky Gradient (Day) */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-600" />

      {/* Space/Night Overlay (Fade in based on multiplier) */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-sky-900 transition-opacity duration-700 ease-linear"
        style={{ opacity: darkness }}
      />

      {/* Stars (Only visible when dark) */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: Math.max(0, darkness - 0.3) }} // Stars appear after 3x
      >
        <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full animate-pulse" />
        <div className="absolute top-40 left-80 w-1 h-1 bg-white rounded-full animate-pulse delay-75" />
        <div className="absolute top-20 right-40 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-150" />
        <div className="absolute bottom-40 left-10 w-1 h-1 bg-white rounded-full animate-pulse delay-300" />
        <div className="absolute top-1/2 right-10 w-1 h-1 bg-white rounded-full animate-pulse delay-500" />
      </div>

      {/* Animated Clouds Layer (Fades out slightly in space) */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: 1 - (darkness * 0.5) }}
      >
        <Cloud className="absolute top-[10%] left-[10%] w-32 animate-[float_20s_linear_infinite] opacity-80" />
        <Cloud className="absolute top-[20%] left-[60%] w-48 animate-[float_25s_linear_infinite_reverse] opacity-60" />
        <Cloud className="absolute top-[40%] left-[30%] w-24 animate-[float_15s_linear_infinite] opacity-40" />
      </div>
      
      {/* Horizon Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/10 to-transparent mix-blend-overlay" />
    </div>
  );
});

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`text-white ${className}`}>
      <path d="M18.5,12c0-1.7-1.1-3.2-2.6-3.8c0.1-0.4,0.1-0.8,0.1-1.2c0-3.3-2.7-6-6-6c-2.8,0-5.2,2-5.8,4.7C2.6,6.2,1.5,7.5,1.5,9c0,0.2,0,0.4,0.1,0.6C0.7,10.1,0,11,0,12c0,1.7,1.3,3,3,3h15.5C20.2,15,21.5,13.7,21.5,12z" />
    </svg>
  );
}
