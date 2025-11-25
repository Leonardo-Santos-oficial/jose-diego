'use client';

import { useState, useTransition, useEffect } from 'react';
import { sendGameCommand } from '@/app/actions/admin-game';
import { getEngineStatus, type EngineStatus } from '@/app/actions/admin-engine';
import { Button } from '@/components/components/ui/button';
import { Play, Pause, AlertTriangle, RefreshCw } from 'lucide-react';

export function GameControlPanel() {
  const [isPending, startTransition] = useTransition();
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);

  const fetchStatus = async () => {
    const status = await getEngineStatus();
    setEngineStatus(status);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCommand = (action: 'pause' | 'resume' | 'force_crash') => {
    startTransition(async () => {
      const result = await sendGameCommand(action);
      setLastStatus(result.message);
      setTimeout(() => setLastStatus(null), 3000);
      // Force immediate refresh after command
      setTimeout(fetchStatus, 1000);
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_60px_rgba(15,118,110,0.15)]">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
            Controle do Motor
          </p>
          <h2 className="text-xl font-semibold text-white">Gerenciamento do Jogo</h2>
          <p className="text-sm text-slate-400">
            Ações diretas no loop do jogo. Use com cautela em produção.
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="relative flex size-3">
              <span
                className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
                  engineStatus?.isPaused ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex size-3 rounded-full ${
                  engineStatus?.isPaused ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              ></span>
            </span>
            <span className="text-sm font-medium text-white">
              {engineStatus?.isPaused ? 'PAUSADO' : 'RODANDO'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Fase: {engineStatus?.phase ?? '...'} • {engineStatus?.currentMultiplier}x
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
          <h3 className="mb-2 font-semibold text-white">Estado do Loop</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => handleCommand('resume')}
              disabled={isPending || !engineStatus?.isPaused}
              className="flex-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <Play className="mr-2 size-4" /> Iniciar
            </Button>
            <Button
              onClick={() => handleCommand('pause')}
              disabled={isPending || !!engineStatus?.isPaused}
              className="flex-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
            >
              <Pause className="mr-2 size-4" /> Pausar
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Pausa ou retoma a geração de novas rodadas.
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
          <h3 className="mb-2 font-semibold text-white">Emergência</h3>
          <Button
            onClick={() => handleCommand('force_crash')}
            disabled={isPending}
            variant="destructive"
            className="w-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
          >
            <AlertTriangle className="mr-2 size-4" /> Forçar Crash Agora
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            Encerra a rodada atual imediatamente (Crash em 1.00x ou atual).
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 opacity-50">
          <h3 className="mb-2 font-semibold text-white">Configuração RTP</h3>
          <div className="flex items-center justify-between rounded bg-slate-950 p-2">
            <span className="text-sm text-slate-400">Atual</span>
            <span className="font-mono text-teal-300">97.0%</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Configuração de retorno teórico (Em breve).
          </p>
        </div>
      </div>

      {lastStatus && (
        <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-center text-sm text-teal-300">{lastStatus}</p>
        </div>
      )}
    </section>
  );
}
