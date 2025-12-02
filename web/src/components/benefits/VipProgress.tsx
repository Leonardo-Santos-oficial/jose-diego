'use client';

import { Trophy, TrendingUp, Star, Sparkles } from 'lucide-react';
import type { VipLevel, VipTier } from '@/modules/benefits/types';

interface VipProgressProps {
  vipLevel: VipLevel;
  currentTier: VipTier;
  nextTier: VipTier | null;
  progressToNextLevel: number;
}

const tierColors: Record<number, { accent: string; glow: string; bg: string; border: string }> = {
  0: { accent: 'text-emerald-400', glow: 'from-emerald-600 to-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  1: { accent: 'text-amber-500', glow: 'from-amber-600 to-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  2: { accent: 'text-zinc-300', glow: 'from-zinc-400 to-zinc-300', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' },
  3: { accent: 'text-yellow-400', glow: 'from-yellow-500 to-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  4: { accent: 'text-cyan-400', glow: 'from-cyan-500 to-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  5: { accent: 'text-violet-400', glow: 'from-violet-500 to-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
};

export function VipProgress({ vipLevel, currentTier, nextTier, progressToNextLevel }: VipProgressProps) {
  const colors = tierColors[currentTier.level] ?? tierColors[0];

  return (
    <section 
      className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/90 p-4 shadow-xl sm:rounded-3xl sm:p-5 md:p-6"
      aria-labelledby="vip-level-heading"
      role="region"
    >
      {/* Header com Nível e Stats */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
        {/* Nível atual */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div 
            className={`flex size-14 items-center justify-center rounded-2xl ${colors.bg} ${colors.border} border-2 shadow-lg sm:size-16 md:size-20`}
            aria-hidden="true"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl" role="img" aria-label={`Ícone do nível ${currentTier.name}`}>
              {currentTier.icon}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Trophy className={`size-5 sm:size-6 md:size-7 ${colors.accent}`} aria-hidden="true" />
              <h2 
                id="vip-level-heading" 
                className="text-lg font-bold text-white sm:text-xl md:text-2xl"
              >
                Nível <span className={colors.accent}>{currentTier.name}</span>
              </h2>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-300 sm:text-base">
              <Sparkles className={`size-4 ${colors.accent}`} aria-hidden="true" />
              <span>{vipLevel.points.toLocaleString()} pontos acumulados</span>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <div 
            className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 sm:flex-none sm:gap-3 sm:px-4 sm:py-3"
            role="status"
            aria-label={`Total apostado: R$ ${vipLevel.totalWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/20 sm:size-10">
              <TrendingUp className="size-5 text-emerald-400 sm:size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-400 sm:text-sm">Total Apostado</p>
              <p className="text-sm font-bold text-white sm:text-base md:text-lg">
                R$ {vipLevel.totalWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {currentTier.cashbackRate > 0 && (
            <div 
              className="flex flex-1 items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 sm:flex-none sm:gap-3 sm:px-4 sm:py-3"
              role="status"
              aria-label={`Cashback: ${currentTier.cashbackRate}%`}
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/20 sm:size-10">
                <Star className="size-5 text-amber-400 sm:size-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-slate-400 sm:text-sm">Cashback</p>
                <p className="text-sm font-bold text-white sm:text-base md:text-lg">{currentTier.cashbackRate}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Progresso */}
      {nextTier && (
        <div className="mt-5 sm:mt-6" role="progressbar" aria-valuenow={Math.round(progressToNextLevel)} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso para ${nextTier.name}: ${Math.round(progressToNextLevel)}%`}>
          <div className="mb-2 flex items-center justify-between text-sm sm:text-base">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              Progresso para <span className="text-lg" role="img" aria-hidden="true">{nextTier.icon}</span> <span className={colors.accent}>{nextTier.name}</span>
            </span>
            <span className={`font-bold ${colors.accent}`}>
              {Math.round(progressToNextLevel)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800 shadow-inner sm:h-4">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colors.glow} shadow-lg transition-all duration-700 ease-out`}
              style={{ width: `${Math.max(progressToNextLevel, 2)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Aposte mais <span className="font-semibold text-white">R$ {(nextTier.minWagered - vipLevel.totalWagered).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> para subir de nível
          </p>
        </div>
      )}

      {/* Benefícios do Nível */}
      <div className="mt-5 border-t border-slate-700/50 pt-4 sm:mt-6 sm:pt-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200 sm:mb-4 sm:text-base">
          Benefícios do seu nível:
        </h3>
        <ul className="flex flex-wrap gap-2 sm:gap-2.5" aria-label="Lista de benefícios">
          {currentTier.benefits.map((benefit) => (
            <li
              key={benefit}
              className={`flex items-center gap-1.5 rounded-full ${colors.border} ${colors.bg} px-3 py-1.5 text-sm font-medium text-white transition-transform hover:scale-105 sm:px-4 sm:py-2 sm:text-base`}
            >
              <span className="text-emerald-400" aria-hidden="true">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
