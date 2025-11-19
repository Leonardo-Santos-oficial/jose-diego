import type { CSSProperties } from 'react';
import Image from 'next/image';
import type { GameHistoryEntry, GameStateMessage } from '@/types/aviator';
import {
  aviatorAssets,
  bucketPalette,
  phasePalette,
} from '@/modules/aviator/config/sceneConfig';

export type AviatorSceneProps = {
  state?: GameStateMessage;
  history: GameHistoryEntry[];
};

const bucketLabels: Record<GameHistoryEntry['bucket'], string> = {
  blue: 'Seguro',
  purple: 'Risco médio',
  pink: 'Alta volatilidade',
};

export function AviatorScene({ state, history }: AviatorSceneProps) {
  const multiplier = state?.multiplier ?? 1;
  const closesIn = state?.bettingWindow?.closesInMs ?? null;
  const autopayouts = state?.autopayouts?.length ?? 0;
  const recentHistory = history.slice(-5).reverse();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-white md:p-6">
      <div
        className="aviator-particles pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-teal-200">
            Aviator Paper
          </p>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">Loop em tempo real</h2>
          <p className="text-sm text-slate-300">
            Canal `game.state` sincroniza HUD e histórico enquanto o node-service publica
            mudanças via Observer.
          </p>
        </div>
        <Image
          src={aviatorAssets.logo}
          alt="Logo Aviator"
          width={96}
          height={48}
          priority
          className="opacity-80"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-xl border border-slate-800/60 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-4">
          <div
            className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/90 to-transparent"
            aria-hidden="true"
          />
          <div className="relative flex h-40 items-center overflow-hidden rounded-lg bg-slate-900/40">
            <Image
              src={aviatorAssets.ruler}
              alt="Régua de velocidade"
              width={1200}
              height={72}
              className="pointer-events-none absolute inset-x-0 bottom-2 opacity-70"
            />
            <Image
              src={aviatorAssets.plane}
              alt="Avião em voo"
              width={190}
              height={90}
              priority
              className="aviator-plane"
              style={{ '--plane-loop': '5s' } as CSSProperties}
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">Multiplicador atual</p>
              <p className="text-5xl font-bold text-teal-300">{multiplier.toFixed(2)}x</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-400">Fase</p>
              <p
                className="text-2xl font-semibold"
                style={{ color: phasePalette[state?.state ?? 'awaitingBets'] }}
              >
                {labelForPhase(state?.state ?? 'awaitingBets')}
              </p>
              {closesIn !== null && state?.state === 'awaitingBets' ? (
                <p className="text-xs text-slate-400">
                  Fecha em {Math.max(0, Math.ceil(closesIn / 1000))}s
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-300">Autocashouts ativos</p>
            <p className="text-4xl font-semibold text-fuchsia-300">{autopayouts}</p>
            <p className="text-xs text-slate-400">
              Tickets com cashout automático pendente
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-300">Janela de apostas</p>
            <p className="text-4xl font-semibold text-amber-200">
              {state?.bettingWindow?.minBet
                ? `R$ ${state.bettingWindow.minBet.toFixed(2)}`
                : 'Livre'}
            </p>
            <p className="text-xs text-slate-400">
              Até{' '}
              {state?.bettingWindow?.maxBet
                ? `R$ ${state.bettingWindow.maxBet.toFixed(2)}`
                : 'limite dinâmico'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 rounded-xl border border-white/5 bg-slate-900/50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-200">Histórico recente</p>
        <div className="flex flex-wrap gap-2">
          {recentHistory.length === 0 ? (
            <p className="text-xs text-slate-400">Aguardando primeiros resultados...</p>
          ) : (
            recentHistory.map((entry) => (
              <div
                key={entry.roundId}
                className="rounded-full border border-white/5 px-4 py-1 text-sm font-semibold"
                style={{
                  backgroundImage: `url(${aviatorAssets.historyBadge})`,
                  backgroundSize: 'cover',
                  color: bucketPalette[entry.bucket],
                }}
                title={bucketLabels[entry.bucket]}
              >
                {entry.multiplier.toFixed(2)}x
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function labelForPhase(phase: GameStateMessage['state']) {
  switch (phase) {
    case 'awaitingBets':
      return 'Apostas abertas';
    case 'flying':
      return 'Em voo';
    case 'crashed':
      return 'Caiu';
    default:
      return 'Desconhecida';
  }
}
