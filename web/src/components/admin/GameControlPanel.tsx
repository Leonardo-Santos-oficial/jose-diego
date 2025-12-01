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

  const [rtpInput, setRtpInput] = useState('97.0');
  const [forceResultInput, setForceResultInput] = useState('');

  const fetchStatus = async () => {
    const status = await getEngineStatus();
    setEngineStatus(status);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (engineStatus?.rtp) {
      setRtpInput(engineStatus.rtp.toString());
    }
  }, [engineStatus?.rtp]);

  const handleCommand = (action: 'pause' | 'resume' | 'force_crash' | 'set_result' | 'update_settings', payload?: any) => {
    startTransition(async () => {
      const result = await sendGameCommand(action, payload);
      setLastStatus(result.message);
      setTimeout(() => setLastStatus(null), 3000);
      // Force immediate refresh after command
      setTimeout(fetchStatus, 1000);
    });
  };

  const handleSetRtp = () => {
    const rtp = parseFloat(rtpInput);
    if (isNaN(rtp) || rtp < 0 || rtp > 100) return;
    handleCommand('update_settings', { rtp });
  };

  const handleForceResult = () => {
    const value = parseFloat(forceResultInput);
    if (isNaN(value) || value < 1) return;
    handleCommand('set_result', { value });
    setForceResultInput('');
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_0_60px_rgba(15,118,110,0.15)] sm:rounded-3xl sm:p-6">
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-teal-300 sm:text-xs">
            Controle do Motor
          </p>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Gerenciamento do Jogo</h2>
          <p className="text-xs text-slate-400 sm:text-sm">
            Ações diretas no loop. Use com cautela.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3 sm:flex-col sm:items-end sm:bg-transparent sm:p-0 sm:text-right">
          <div className="flex items-center gap-2">
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
            <span className="text-xs font-medium text-white sm:text-sm">
              {engineStatus?.isPaused ? 'PAUSADO' : 'RODANDO'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 sm:text-xs">
            {engineStatus?.phase ?? '...'} • {engineStatus?.currentMultiplier}x
          </p>
        </div>
      </header>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 sm:rounded-2xl sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">Estado do Loop</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => handleCommand('resume')}
              disabled={isPending || !engineStatus?.isPaused}
              size="sm"
              className="flex-1 min-h-[44px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 text-sm sm:text-sm"
            >
              <Play className="mr-1.5 size-4 sm:mr-2 sm:size-4" /> Iniciar
            </Button>
            <Button
              onClick={() => handleCommand('pause')}
              disabled={isPending || !!engineStatus?.isPaused}
              size="sm"
              className="flex-1 min-h-[44px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50 text-sm sm:text-sm"
            >
              <Pause className="mr-1.5 size-4 sm:mr-2 sm:size-4" /> Pausar
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 sm:text-xs">
            Pausa ou retoma as rodadas.
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 sm:rounded-2xl sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">Emergência</h3>
          <Button
            onClick={() => handleCommand('force_crash')}
            disabled={isPending}
            variant="destructive"
            size="sm"
            className="w-full min-h-[44px] bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-sm sm:text-sm"
          >
            <AlertTriangle className="mr-1.5 size-4 sm:mr-2 sm:size-4" /> Forçar Crash
          </Button>
          <p className="mt-2 text-[10px] text-slate-500 sm:text-xs">
            Encerra a rodada imediatamente.
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 sm:rounded-2xl sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">RTP (%)</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={rtpInput}
              onChange={(e) => setRtpInput(e.target.value)}
              className="w-full rounded bg-slate-950 px-3 py-2.5 min-h-[44px] text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:px-3 sm:py-2 sm:min-h-0 sm:text-sm"
              placeholder="97.0"
              step="0.1"
            />
            <Button
              onClick={handleSetRtp}
              disabled={isPending}
              size="sm"
              className="bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 px-3 min-h-[44px] min-w-[44px] sm:px-3 sm:min-h-0 sm:min-w-0"
            >
              <RefreshCw className="size-4 sm:size-4" />
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 sm:text-xs">
            Taxa de retorno ao jogador.
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 sm:rounded-2xl sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">Forçar Resultado</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={forceResultInput}
              onChange={(e) => setForceResultInput(e.target.value)}
              className="w-full rounded bg-slate-950 px-3 py-2.5 min-h-[44px] text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:px-3 sm:py-2 sm:min-h-0 sm:text-sm"
              placeholder="Ex: 15.00"
              step="0.01"
            />
            <Button
              onClick={handleForceResult}
              disabled={isPending || !forceResultInput}
              size="sm"
              className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-3 min-h-[44px] min-w-[44px] sm:px-3 sm:min-h-0 sm:min-w-0"
            >
              Set
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 sm:text-xs">
            Crash da próxima rodada.
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
