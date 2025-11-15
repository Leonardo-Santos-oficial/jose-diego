import type { GameHistoryEntry } from '@/types/aviator';
import { bucketPalette } from '@/modules/aviator/config/sceneConfig';

export type AviatorHistoryRailProps = {
  history: GameHistoryEntry[];
};

export function AviatorHistoryRail({ history }: AviatorHistoryRailProps) {
  const items = history.slice(-12).reverse();

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-white">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-300">Últimos resultados</p>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Crash feed
        </span>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400">Sem histórico disponível.</p>
        ) : (
          items.map((entry) => (
            <div
              key={entry.roundId}
              className="flex min-w-[72px] flex-col items-center rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2"
            >
              <span className="text-xs text-slate-500">{entry.roundId.slice(0, 4)}</span>
              <span
                className="text-lg font-semibold"
                style={{ color: bucketPalette[entry.bucket] }}
              >
                {entry.multiplier.toFixed(2)}x
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
