import { memo, useEffect, useRef, useState } from 'react';
import type { GameStateMessage } from '@/types/aviator';

interface PlayerPlaneProps {
  multiplier: number;
  state: GameStateMessage['state'];
}

/**
 * PlayerPlane com movimento fluido e constante - TELA INFINITA.
 * 
 * IMPORTANTE: A velocidade visual do avião NÃO está vinculada ao multiplicador.
 * Isso evita que jogadores identifiquem padrões baseados na velocidade.
 * 
 * Comportamento:
 * 1. Decolagem: Aceleração inicial suave até posição de cruzeiro
 * 2. Voo: Posição FIXA com oscilação suave (efeito de voo contínuo infinito)
 * 3. Crash: Queda dramática
 */
export const PlayerPlane = memo(function PlayerPlane({ multiplier, state }: PlayerPlaneProps) {
  const isCrashed = state === 'crashed';
  const isFlying = state === 'flying';
  const wasFlying = useRef(false);
  const flightStartTime = useRef<number | null>(null);
  const [phase, setPhase] = useState<'takeoff' | 'cruising'>('takeoff');
  const [takeoffProgress, setTakeoffProgress] = useState(0);
  const [oscillation, setOscillation] = useState({ x: 0, y: 0, rotation: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // Configurações de voo
  const TAKEOFF_DURATION = 1500; // ms para decolagem completa
  const CRUISE_POSITION = { left: 55, bottom: 55 }; // Posição central de cruzeiro (%)

  useEffect(() => {
    // Quando começa a voar
    if (isFlying && !wasFlying.current) {
      wasFlying.current = true;
      flightStartTime.current = performance.now();
      setPhase('takeoff');
      setTakeoffProgress(0);
      setOscillation({ x: 0, y: 0, rotation: 0 });
    }

    // Quando crasha ou para de voar
    if (!isFlying && wasFlying.current) {
      wasFlying.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (!isCrashed) {
        setPhase('takeoff');
        setTakeoffProgress(0);
      }
    }
  }, [isFlying, isCrashed]);

  // Loop de animação
  useEffect(() => {
    if (!isFlying) return;

    const animate = (currentTime: number) => {
      const flightTime = flightStartTime.current 
        ? currentTime - flightStartTime.current 
        : 0;
      
      if (phase === 'takeoff') {
        // Fase de decolagem - ease-out cubic
        const progress = Math.min(flightTime / TAKEOFF_DURATION, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setTakeoffProgress(easedProgress);
        
        if (progress >= 1) {
          setPhase('cruising');
        }
      } else {
        // Fase de cruzeiro - oscilação suave infinita (simula turbulência leve)
        const time = flightTime / 1000; // tempo em segundos
        
        // Múltiplas ondas senoidais para movimento orgânico
        const xOsc = Math.sin(time * 0.8) * 2 + Math.sin(time * 1.3) * 1;
        const yOsc = Math.sin(time * 0.6) * 3 + Math.cos(time * 1.1) * 1.5;
        const rotOsc = Math.sin(time * 0.5) * 3 + Math.cos(time * 0.9) * 2;
        
        setOscillation({
          x: xOsc,
          y: yOsc,
          rotation: rotOsc,
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isFlying, phase]);

  // Posicionamento
  let leftPos: number;
  let bottomPos: number;
  let rotation: number;

  if (isCrashed) {
    // Crash - cai da posição atual
    leftPos = CRUISE_POSITION.left + oscillation.x;
    bottomPos = -30; // Abaixo da tela
    rotation = 90; // Rotação de queda (nariz para baixo)
  } else if (phase === 'takeoff') {
    // Decolagem - começa RETO (0°) e vai inclinando para cima gradualmente
    leftPos = 5 + (takeoffProgress * (CRUISE_POSITION.left - 5));
    bottomPos = 10 + (takeoffProgress * (CRUISE_POSITION.bottom - 10));
    // Começa em 0° e vai até -25° (nariz para cima) gradualmente
    rotation = -(takeoffProgress * 25);
  } else {
    // Cruzeiro - posição fixa com oscilação suave
    leftPos = CRUISE_POSITION.left + oscillation.x;
    bottomPos = CRUISE_POSITION.bottom + oscillation.y;
    // Mantém inclinação de subida com leve oscilação (-25° base)
    rotation = -25 + oscillation.rotation;
  }

  const style: React.CSSProperties = {
    left: `${leftPos}%`,
    bottom: isCrashed ? '-30%' : `${bottomPos}%`,
    transform: `rotate(${rotation}deg)`,
    transition: isCrashed 
      ? 'bottom 1.2s cubic-bezier(0.55, 0, 1, 0.45), transform 0.8s ease-in'
      : 'none', // Sem transition durante voo - controlado por requestAnimationFrame
  };

  if (!isFlying && !isCrashed) return null;

  return (
    <div 
      className="absolute z-50 will-change-transform"
      style={style}
    >
      <div className="relative w-16 md:w-24 lg:w-32">
        
        {/* === EFEITOS DE VOO === */}
        {isFlying && (
          <>
            {/* Rastro de fumaça principal - longo e denso */}
            <div 
              className="absolute top-1/2 right-[70%] w-40 md:w-56 lg:w-72 h-4 md:h-6 -translate-y-1/2 origin-right animate-smoke-trail"
              style={{
                background: 'linear-gradient(to left, rgba(251,146,60,0.9), rgba(255,200,100,0.6) 15%, rgba(200,200,200,0.4) 40%, rgba(150,150,150,0.2) 70%, transparent)',
                filter: 'blur(3px)',
                borderRadius: '50%',
              }}
            />
            
            {/* Camada de fumaça secundária - mais leve */}
            <div 
              className="absolute top-[45%] right-[75%] w-32 md:w-44 lg:w-56 h-6 md:h-8 -translate-y-1/2 origin-right"
              style={{
                background: 'linear-gradient(to left, rgba(255,255,255,0.5), rgba(200,200,200,0.3) 30%, rgba(150,150,150,0.1) 60%, transparent)',
                filter: 'blur(5px)',
                borderRadius: '50%',
                animation: 'smoke-wave 0.8s ease-in-out infinite alternate',
              }}
            />
            
            {/* Partículas de fumaça flutuando */}
            <div className="absolute top-[30%] right-[100%] animate-smoke-particle-1">
              <div className="w-3 h-3 bg-gray-300/60 rounded-full blur-sm" />
            </div>
            <div className="absolute top-[50%] right-[110%] animate-smoke-particle-2">
              <div className="w-4 h-4 bg-gray-400/50 rounded-full blur-sm" />
            </div>
            <div className="absolute top-[70%] right-[105%] animate-smoke-particle-3">
              <div className="w-2 h-2 bg-gray-300/40 rounded-full blur-sm" />
            </div>
            
            {/* Chamas do motor */}
            <div className="absolute top-1/2 right-[65%] -translate-y-1/2">
              <div className="relative">
                {/* Chama principal */}
                <div 
                  className="w-8 h-4 md:w-10 md:h-5 rounded-full animate-flame"
                  style={{
                    background: 'linear-gradient(to left, #ff6b35, #ff9500, #ffcc00)',
                    filter: 'blur(1px)',
                    boxShadow: '0 0 15px 5px rgba(255,150,0,0.6)',
                  }}
                />
                {/* Núcleo da chama */}
                <div 
                  className="absolute top-1/2 left-1 -translate-y-1/2 w-4 h-2 md:w-5 md:h-3 rounded-full"
                  style={{
                    background: 'linear-gradient(to left, #fff, #ffff80)',
                    filter: 'blur(1px)',
                  }}
                />
              </div>
            </div>
            
            {/* Partículas de fogo/faíscas */}
            <div className="absolute top-[40%] right-[80%] -translate-y-1/2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping opacity-80" />
            </div>
            <div className="absolute top-[60%] right-[85%] -translate-y-1/2">
              <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-70" style={{ animationDelay: '0.15s' }} />
            </div>
            <div className="absolute top-[35%] right-[90%] -translate-y-1/2">
              <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="absolute top-[65%] right-[95%] -translate-y-1/2">
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.45s' }} />
            </div>
          </>
        )}

        {/* === EFEITO DE EXPLOSÃO NO CRASH === */}
        {isCrashed && (
          <>
            {/* Explosão central - onda de choque */}
            <div className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
              <div 
                className="w-32 h-32 md:w-48 md:h-48 rounded-full animate-explosion-ring"
                style={{
                  border: '4px solid rgba(255,150,0,0.8)',
                  boxShadow: '0 0 30px 10px rgba(255,100,0,0.5)',
                }}
              />
            </div>
            
            {/* Bola de fogo principal */}
            <div className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 animate-explosion-flash">
              <div 
                className="w-24 h-24 md:w-36 md:h-36 rounded-full"
                style={{
                  background: 'radial-gradient(circle, #fff 0%, #ffff00 20%, #ff9500 40%, #ff4500 60%, #8b0000 80%, transparent 100%)',
                  filter: 'blur(8px)',
                  boxShadow: '0 0 60px 30px rgba(255,100,0,0.8)',
                }}
              />
            </div>
            
            {/* Fragmentos/detritos voando */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-3 bg-gray-600 rounded animate-debris-1" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-gray-500 rounded animate-debris-2" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-2 bg-rose-700 rounded animate-debris-3" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-3 bg-gray-400 rounded animate-debris-4" />
            </div>
            
            {/* Fumaça preta subindo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-smoke-rise">
              <div 
                className="w-16 h-16 md:w-24 md:h-24 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(50,50,50,0.8) 0%, rgba(30,30,30,0.5) 50%, transparent 100%)',
                  filter: 'blur(6px)',
                }}
              />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-smoke-rise-delayed">
              <div 
                className="w-12 h-12 md:w-20 md:h-20 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(80,80,80,0.6) 0%, rgba(50,50,50,0.3) 50%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              />
            </div>
            
            {/* Faíscas espalhando */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-yellow-400 rounded-full animate-spark-1" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-orange-500 rounded-full animate-spark-2" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-red-500 rounded-full animate-spark-3" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-yellow-300 rounded-full animate-spark-4" />
            </div>
          </>
        )}
        
        {/* Avião SVG */}
        <svg 
          viewBox="0 0 512 512" 
          className={`w-full h-full transition-all duration-300 ${
            isCrashed 
              ? 'fill-rose-800 stroke-rose-400 opacity-60' 
              : 'fill-rose-500 stroke-white'
          } stroke-[8]`}
          style={{
            filter: isFlying 
              ? 'drop-shadow(0 4px 12px rgba(244,63,94,0.5))' 
              : isCrashed 
                ? 'drop-shadow(0 0 20px rgba(255,100,0,0.8)) brightness(0.7)'
                : 'drop-shadow(0 8px 24px rgba(244,63,94,0.8))'
          }}
        >
          <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/>
        </svg>
      </div>
    </div>
  );
});
