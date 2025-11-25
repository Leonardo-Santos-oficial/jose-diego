import { memo } from 'react';

export const FlightCurve = memo(function FlightCurve() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <svg className="w-full h-full" preserveAspectRatio="none">
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="curveGradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(20, 184, 166, 0.2)" />
            <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
          </linearGradient>
        </defs>
        
        {/* The Curve Path */}
        {/* Starts bottom-left, curves up to top-right */}
        <path 
          d="M 0 600 Q 400 600 800 0" 
          fill="none" 
          stroke="url(#curveGradient)" 
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
          className="opacity-50"
        />
      </svg>
    </div>
  );
});
