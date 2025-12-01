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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 md:size-16">
            <span className="text-2xl md:text-3xl">{currentTier.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Trophy className={`size-5 md:size-6 ${colors.accent}`} />
              <h2 className="text-lg font-bold text-white md:text-xl">
                Nível <span className={colors.accent}>{currentTier.name}</span>
              </h2>
            </div>
            <p className="text-sm text-slate-300 md:text-base">
              {vipLevel.points.toLocaleString()} pontos acumulados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 md:px-4">
            <TrendingUp className="size-5 text-emerald-500 md:size-5" />
            <div className="text-right">
              <p className="text-xs text-slate-300 md:text-sm">Total Apostado</p>
              <p className="text-sm font-semibold text-white md:text-base">
                R$ {vipLevel.totalWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {currentTier.cashbackRate > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 md:px-4">
              <Star className="size-5 text-amber-500 md:size-5" />
              <div className="text-right">
                <p className="text-xs text-slate-300 md:text-sm">Cashback</p>
                <p className="text-sm font-semibold text-white md:text-base">{currentTier.cashbackRate}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {nextTier && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">
              Progresso para {nextTier.icon} {nextTier.name}
            </span>
            <span className="font-medium text-white">
              {Math.round(progressToNextLevel)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colors.glow} transition-all duration-500`}
              style={{ width: `${progressToNextLevel}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Aposte mais R$ {(nextTier.minWagered - vipLevel.totalWagered).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para subir de nível
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-slate-800 pt-4">
        <h3 className="mb-3 text-sm font-medium text-slate-200">Benefícios do seu nível:</h3>
        <ul className="flex flex-wrap gap-2">
          {currentTier.benefits.map((benefit) => (
            <li
              key={benefit}
              className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-sm text-white"
            >
              ✓ {benefit}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
