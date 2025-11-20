import type { GameHistoryEntry } from '@/types/aviator';
import { bucketPalette } from '@/modules/aviator/config/sceneConfig';

export type AviatorHistoryRailProps = {
  history: GameHistoryEntry[];
};

export function AviatorHistoryRail({ history }: AviatorHistoryRailProps) {
  const items = history.slice(-20).reverse();

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div 
        className="flex h-full items-center gap-2 overflow-x-auto pr-8"
        style={{ 
          whiteSpace: 'nowrap', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {items.map((entry) => (
          <div
            key={entry.roundId}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-800 px-2 py-1 text-[10px] font-bold lg:px-3 lg:text-xs"
            style={{
              color: bucketPalette[entry.bucket],
              backgroundColor: `${bucketPalette[entry.bucket]}20`,
            }}
          >
            {entry.multiplier.toFixed(2)}x
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900/80 to-transparent" />
    </div>
  );
}
