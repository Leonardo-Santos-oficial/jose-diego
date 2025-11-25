import { memo } from 'react';

export const SceneBackground = memo(function SceneBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-sky-400 to-sky-600">
      {/* Animated Clouds Layer */}
      <div className="absolute inset-0 opacity-30">
        <Cloud className="absolute top-[10%] left-[10%] w-32 animate-[float_20s_linear_infinite]" />
        <Cloud className="absolute top-[20%] left-[60%] w-48 animate-[float_25s_linear_infinite_reverse]" />
        <Cloud className="absolute top-[40%] left-[30%] w-24 animate-[float_15s_linear_infinite]" />
        <Cloud className="absolute top-[15%] left-[80%] w-40 animate-[float_30s_linear_infinite]" />
      </div>
      
      {/* Grid/Horizon Effect (Optional for depth) */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-900/10 to-transparent" />
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
