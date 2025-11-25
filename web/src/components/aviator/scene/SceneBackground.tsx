import { memo } from 'react';

interface SceneBackgroundProps {
  multiplier: number;
  isFlying?: boolean;
}

/**
 * Nuvem SVG otimizada para performance
 */
function Cloud({ size = 'md', opacity = 0.8 }: { size?: 'sm' | 'md' | 'lg' | 'xl'; opacity?: number }) {
  const sizeClasses = {
    sm: 'w-16 h-10',
    md: 'w-24 h-14',
    lg: 'w-36 h-20',
    xl: 'w-48 h-28',
  };
  
  return (
    <svg 
      viewBox="0 0 100 60" 
      className={`${sizeClasses[size]} fill-white/90`}
      style={{ opacity }}
    >
      <ellipse cx="30" cy="40" rx="25" ry="18" />
      <ellipse cx="55" cy="35" rx="22" ry="20" />
      <ellipse cx="75" cy="42" rx="18" ry="14" />
      <ellipse cx="45" cy="25" rx="20" ry="16" />
      <ellipse cx="65" cy="28" rx="15" ry="12" />
    </svg>
  );
}

/**
 * Estrela com brilho pulsante
 */
function Star({ size, delay, color = 'white' }: { size: number; delay: number; color?: string }) {
  const colorMap: Record<string, string> = {
    white: 'rgba(255,255,255,0.9)',
    blue: 'rgba(147,197,253,0.9)',
    yellow: 'rgba(253,224,71,0.9)',
    pink: 'rgba(249,168,212,0.9)',
  };
  
  return (
    <div 
      className="absolute rounded-full animate-twinkle"
      style={{ 
        width: size, 
        height: size,
        animationDelay: `${delay}ms`,
        backgroundColor: colorMap[color] || colorMap.white,
        boxShadow: `0 0 ${size * 3}px ${size}px ${colorMap[color] || colorMap.white}`
      }}
    />
  );
}

/**
 * Partícula de brilho animada
 */
function Sparkle({ delay, duration }: { delay: number; duration: number }) {
  return (
    <div 
      className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle-float"
      style={{ 
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    />
  );
}

/**
 * Meteoro/Shooting Star
 */
function ShootingStar({ delay }: { delay: number }) {
  return (
    <div 
      className="absolute animate-shooting-star"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-1 h-1 bg-white rounded-full relative">
        <div 
          className="absolute top-0 right-full w-16 h-[2px] bg-gradient-to-l from-white via-white/50 to-transparent"
          style={{ filter: 'blur(0.5px)' }}
        />
      </div>
    </div>
  );
}

/**
 * Pássaro voando
 */
function Bird({ delay, reverse = false }: { delay: number; reverse?: boolean }) {
  return (
    <div 
      className={`absolute ${reverse ? 'animate-bird-fly-reverse' : 'animate-bird-fly'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 24 12" className="w-6 h-3 fill-slate-700/60">
        <path d="M0,6 Q6,0 12,6 Q18,0 24,6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

/**
 * Balão de ar quente
 */
function HotAirBalloon({ delay }: { delay: number }) {
  return (
    <div 
      className="absolute animate-balloon-float"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative w-8 h-12">
        {/* Balão */}
        <div className="absolute top-0 w-8 h-8 rounded-full bg-gradient-to-b from-rose-400 via-orange-400 to-amber-400" />
        {/* Cesta */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-amber-800 rounded-sm" />
        {/* Cordas */}
        <div className="absolute top-7 left-2 w-[1px] h-3 bg-amber-900/50" />
        <div className="absolute top-7 right-2 w-[1px] h-3 bg-amber-900/50" />
      </div>
    </div>
  );
}

/**
 * Moeda flutuante (elemento de gamificação)
 */
function FloatingCoin({ delay, size = 'md' }: { delay: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  return (
    <div 
      className={`absolute animate-coin-float ${sizeClasses[size]}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-2 border-yellow-600 shadow-lg animate-coin-spin">
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-200 to-amber-300 flex items-center justify-center">
          <span className="text-amber-700 font-bold text-[8px]">$</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Raios de luz (God rays)
 */
function SunRays({ opacity }: { opacity: number }) {
  return (
    <div 
      className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ opacity }}
    >
      <div 
        className="absolute -top-1/4 -right-1/4 w-full h-full"
        style={{
          background: `conic-gradient(from 180deg, transparent 0deg, rgba(255,255,255,0.1) 20deg, transparent 40deg, transparent 60deg, rgba(255,255,255,0.08) 80deg, transparent 100deg, transparent 120deg, rgba(255,255,255,0.06) 140deg, transparent 160deg, transparent 180deg, transparent 360deg)`,
          animation: 'spin 120s linear infinite',
        }}
      />
    </div>
  );
}

export const SceneBackground = memo(function SceneBackground({ 
  multiplier, 
  isFlying = false 
}: SceneBackgroundProps) {
  // Calculate atmosphere darkness based on multiplier
  const darkness = Math.min((multiplier - 1) / 9, 1);
  const cloudOpacity = Math.max(0.3, 1 - darkness * 0.7);
  const dayElementsOpacity = 1 - darkness;
  const nightElementsOpacity = Math.max(0, (darkness - 0.3) * 1.4);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      
      {/* === BASE SKY GRADIENT === */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-500 to-cyan-600" />

      {/* === SPACE/NIGHT OVERLAY === */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-900 transition-opacity duration-1000 ease-out"
        style={{ opacity: darkness }}
      />

      {/* === SUN === */}
      <div 
        className="absolute top-[8%] right-[10%] transition-all duration-1000"
        style={{ opacity: dayElementsOpacity }}
      >
        <div className="relative">
          {/* Sun glow */}
          <div className="absolute -inset-8 bg-yellow-200/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -inset-4 bg-yellow-300/40 rounded-full blur-xl" />
          {/* Sun body */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-400 shadow-2xl" />
        </div>
      </div>

      {/* === SUN RAYS === */}
      <SunRays opacity={dayElementsOpacity * 0.4} />

      {/* === MOON (night) === */}
      <div 
        className="absolute top-[10%] left-[15%] transition-opacity duration-1000"
        style={{ opacity: nightElementsOpacity }}
      >
        <div className="relative">
          <div className="absolute -inset-4 bg-slate-300/20 rounded-full blur-xl" />
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 shadow-lg">
            {/* Crateras */}
            <div className="absolute top-2 left-3 w-2 h-2 rounded-full bg-slate-300/50" />
            <div className="absolute top-5 right-2 w-3 h-3 rounded-full bg-slate-300/40" />
            <div className="absolute bottom-2 left-4 w-1.5 h-1.5 rounded-full bg-slate-300/30" />
          </div>
        </div>
      </div>

      {/* === STARS LAYER === */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: nightElementsOpacity }}
      >
        {/* Estrelas variadas */}
        <div className="absolute top-[5%] left-[10%]"><Star size={2} delay={100} color="white" /></div>
        <div className="absolute top-[15%] left-[25%]"><Star size={1.5} delay={300} color="blue" /></div>
        <div className="absolute top-[8%] left-[45%]"><Star size={2.5} delay={500} color="white" /></div>
        <div className="absolute top-[20%] left-[65%]"><Star size={1} delay={700} color="yellow" /></div>
        <div className="absolute top-[12%] left-[85%]"><Star size={2} delay={900} color="white" /></div>
        <div className="absolute top-[25%] left-[15%]"><Star size={1.5} delay={1100} color="pink" /></div>
        <div className="absolute top-[18%] left-[75%]"><Star size={3} delay={1300} color="blue" /></div>
        <div className="absolute top-[30%] left-[55%]"><Star size={1} delay={1500} color="white" /></div>
        <div className="absolute top-[35%] left-[35%]"><Star size={2} delay={1700} color="yellow" /></div>
        <div className="absolute top-[22%] left-[92%]"><Star size={1.5} delay={1900} color="white" /></div>
        <div className="absolute top-[40%] left-[8%]"><Star size={2} delay={2100} color="blue" /></div>
        <div className="absolute top-[28%] left-[48%]"><Star size={1} delay={2300} color="pink" /></div>
        
        {/* Shooting stars */}
        <div className="absolute top-[15%] left-[70%]"><ShootingStar delay={3} /></div>
        <div className="absolute top-[25%] left-[30%]"><ShootingStar delay={8} /></div>
        <div className="absolute top-[10%] left-[50%]"><ShootingStar delay={15} /></div>
      </div>

      {/* === FLOATING COINS (gamification) === */}
      {isFlying && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[80%]"><FloatingCoin delay={0} size="md" /></div>
          <div className="absolute top-[40%] left-[15%]"><FloatingCoin delay={2} size="sm" /></div>
          <div className="absolute top-[60%] left-[70%]"><FloatingCoin delay={4} size="lg" /></div>
          <div className="absolute top-[30%] left-[40%]"><FloatingCoin delay={6} size="md" /></div>
          <div className="absolute top-[50%] left-[90%]"><FloatingCoin delay={8} size="sm" /></div>
        </div>
      )}

      {/* === SPARKLES (excitement particles) === */}
      {isFlying && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[25%] left-[20%]"><Sparkle delay={0} duration={3000} /></div>
          <div className="absolute top-[45%] left-[60%]"><Sparkle delay={500} duration={2500} /></div>
          <div className="absolute top-[35%] left-[80%]"><Sparkle delay={1000} duration={3500} /></div>
          <div className="absolute top-[55%] left-[30%]"><Sparkle delay={1500} duration={2800} /></div>
          <div className="absolute top-[15%] left-[50%]"><Sparkle delay={2000} duration={3200} /></div>
          <div className="absolute top-[65%] left-[45%]"><Sparkle delay={2500} duration={2600} /></div>
        </div>
      )}

      {/* === BIRDS (day only) === */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{ opacity: dayElementsOpacity * 0.7 }}
      >
        <div className="absolute top-[12%] left-[5%]"><Bird delay={0} /></div>
        <div className="absolute top-[18%] left-[8%]"><Bird delay={0.5} /></div>
        <div className="absolute top-[45%] right-[10%]"><Bird delay={3} reverse /></div>
        <div className="absolute top-[50%] right-[15%]"><Bird delay={3.8} reverse /></div>
      </div>

      {/* === HOT AIR BALLOONS (day only) === */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{ opacity: dayElementsOpacity * 0.6 }}
      >
        <div className="absolute top-[20%] left-[85%]"><HotAirBalloon delay={0} /></div>
        <div className="absolute top-[40%] left-[5%]"><HotAirBalloon delay={5} /></div>
      </div>

      {/* === CLOUDS PARALLAX LAYERS === */}
      {/* Camada de fundo - mais lenta */}
      <div 
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: cloudOpacity * 0.4 }}
      >
        <div className={`absolute top-[5%] ${isFlying ? 'animate-cloud-drift-slow' : ''}`} style={{ left: '0%' }}>
          <Cloud size="xl" opacity={0.3} />
        </div>
        <div className={`absolute top-[25%] ${isFlying ? 'animate-cloud-drift-slow' : ''}`} style={{ left: '60%', animationDelay: '-15s' }}>
          <Cloud size="lg" opacity={0.25} />
        </div>
        <div className={`absolute top-[45%] ${isFlying ? 'animate-cloud-drift-slow' : ''}`} style={{ left: '30%', animationDelay: '-8s' }}>
          <Cloud size="xl" opacity={0.2} />
        </div>
      </div>

      {/* Camada média */}
      <div 
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: cloudOpacity * 0.6 }}
      >
        <div className={`absolute top-[10%] ${isFlying ? 'animate-cloud-drift-medium' : ''}`} style={{ left: '20%' }}>
          <Cloud size="lg" opacity={0.5} />
        </div>
        <div className={`absolute top-[35%] ${isFlying ? 'animate-cloud-drift-medium' : ''}`} style={{ left: '70%', animationDelay: '-10s' }}>
          <Cloud size="md" opacity={0.45} />
        </div>
        <div className={`absolute top-[55%] ${isFlying ? 'animate-cloud-drift-medium' : ''}`} style={{ left: '5%', animationDelay: '-5s' }}>
          <Cloud size="lg" opacity={0.4} />
        </div>
        <div className={`absolute top-[20%] ${isFlying ? 'animate-cloud-drift-medium' : ''}`} style={{ left: '85%', animationDelay: '-18s' }}>
          <Cloud size="md" opacity={0.5} />
        </div>
      </div>

      {/* Camada frontal - mais rápida */}
      <div 
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: cloudOpacity * 0.9 }}
      >
        <div className={`absolute top-[15%] ${isFlying ? 'animate-cloud-drift-fast' : ''}`} style={{ left: '10%' }}>
          <Cloud size="md" opacity={0.7} />
        </div>
        <div className={`absolute top-[40%] ${isFlying ? 'animate-cloud-drift-fast' : ''}`} style={{ left: '50%', animationDelay: '-7s' }}>
          <Cloud size="sm" opacity={0.65} />
        </div>
        <div className={`absolute top-[60%] ${isFlying ? 'animate-cloud-drift-fast' : ''}`} style={{ left: '80%', animationDelay: '-3s' }}>
          <Cloud size="md" opacity={0.6} />
        </div>
        <div className={`absolute top-[30%] ${isFlying ? 'animate-cloud-drift-fast' : ''}`} style={{ left: '35%', animationDelay: '-12s' }}>
          <Cloud size="sm" opacity={0.75} />
        </div>
      </div>
      
      {/* === HORIZON GLOW === */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-orange-400/30 via-amber-300/15 to-transparent transition-opacity duration-1000"
        style={{ opacity: dayElementsOpacity }}
      />

      {/* === ATMOSPHERIC OVERLAY === */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none" />
      
      {/* === VIGNETTE EFFECT === */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)'
        }}
      />
    </div>
  );
});
