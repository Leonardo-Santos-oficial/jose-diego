'use client';

import { Trophy, TrendingUp, Star } from 'lucide-react';
import type { VipLevel, VipTier } from '@/modules/benefits/types';

interface VipProgressProps {
  vipLevel: VipLevel;
  currentTier: VipTier;
  nextTier: VipTier | null;
  progressToNextLevel: number;
}

const tierColors: Record<number, { accent: string; glow: string }> = {
  0: { accent: 'text-slate-400', glow: 'from-slate-500 to-slate-400' },
  1: { accent: 'text-amber-500', glow: 'from-amber-600 to-amber-400' },
  2: { accent: 'text-zinc-300', glow: 'from-zinc-400 to-zinc-300' },
  3: { accent: 'text-yellow-400', glow: 'from-yellow-500 to-yellow-300' },
  4: { accent: 'text-cyan-400', glow: 'from-cyan-500 to-cyan-300' },
  5: { accent: 'text-violet-400', glow: 'from-violet-500 to-violet-300' },
};

export function VipProgress({ vipLevel, currentTier, nextTier, progressToNextLevel }: VipProgressProps) {
  const colors = tierColors[currentTier.level] ?? tierColors[0];

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 sm:rounded-2xl sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 sm:size-14 md:size-16">
            <span className="text-xl sm:text-2xl md:text-3xl">{currentTier.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Trophy className={`size-4 sm:size-5 md:size-6 ${colors.accent}`} />
              <h2 className="text-base font-bold text-white sm:text-lg md:text-xl">
                Nível <span className={colors.accent}>{currentTier.name}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 sm:text-sm md:text-base">
              {vipLevel.points.toLocaleString()} pontos acumulados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-1.5 sm:flex-none sm:gap-2 sm:px-3 sm:py-2 md:px-4">
            <TrendingUp className="size-4 text-emerald-500 sm:size-5" />
            <div className="text-right">
              <p className="text-[10px] text-slate-300 sm:text-xs md:text-sm">Total Apostado</p>
              <p className="text-xs font-semibold text-white sm:text-sm md:text-base">
                R$ {vipLevel.totalWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {currentTier.cashbackRate > 0 && (
            <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-1.5 sm:flex-none sm:gap-2 sm:px-3 sm:py-2 md:px-4">
              <Star className="size-4 text-amber-500 sm:size-5" />
              <div className="text-right">
                <p className="text-[10px] text-slate-300 sm:text-xs md:text-sm">Cashback</p>
                <p className="text-xs font-semibold text-white sm:text-sm md:text-base">{currentTier.cashbackRate}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {nextTier && (
        <div className="mt-4 sm:mt-6">
          <div className="mb-1.5 flex items-center justify-between text-xs sm:mb-2 sm:text-sm">
            <span className="text-slate-200">
              Progresso para {nextTier.icon} {nextTier.name}
            </span>
            <span className="font-medium text-white">
              {Math.round(progressToNextLevel)}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800 sm:h-3">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colors.glow} transition-all duration-500`}
              style={{ width: `${progressToNextLevel}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-300 sm:mt-2 sm:text-sm">
            Aposte mais R$ {(nextTier.minWagered - vipLevel.totalWagered).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para subir de nível
          </p>
        </div>
      )}

      <div className="mt-4 border-t border-slate-800 pt-3 sm:mt-6 sm:pt-4">
        <h3 className="mb-2 text-xs font-medium text-slate-200 sm:mb-3 sm:text-sm">Benefícios do seu nível:</h3>
        <ul className="flex flex-wrap gap-1.5 sm:gap-2">
          {currentTier.benefits.map((benefit) => (
            <li
              key={benefit}
              className="rounded-full border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-xs text-white sm:px-3 sm:py-1 sm:text-sm"
            >
              ✓ {benefit}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
