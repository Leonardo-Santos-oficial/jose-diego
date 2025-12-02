'use client';

import { useState, useCallback } from 'react';
import { Gift, History, Coins, AlertCircle } from 'lucide-react';
import { VipProgress } from './VipProgress';
import { BenefitCard } from './BenefitCard';
import type { BenefitsSummary } from '@/modules/benefits/types';

interface BenefitsDashboardProps {
  initialSummary: BenefitsSummary | null;
  isAuthenticated: boolean;
}

export function BenefitsDashboard({ initialSummary, isAuthenticated }: BenefitsDashboardProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [isLoading, setIsLoading] = useState(false);

  const handleBenefitClaimed = useCallback(() => {
    window.location.reload();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
        <AlertCircle className="size-12 text-amber-400" />
        <h2 className="text-xl font-semibold text-slate-100">Faça login para acessar seus benefícios</h2>
        <p className="text-slate-400">
          Crie uma conta ou faça login para desbloquear bônus exclusivos, 
          cashback e muito mais!
        </p>
        <a 
          href="/login" 
          className="mt-2 rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition hover:bg-emerald-500"
        >
          Fazer Login
        </a>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-8 text-center">
        <Gift className="size-12 text-slate-500" />
        <h2 className="text-xl font-semibold text-slate-300">Nenhum benefício disponível</h2>
        <p className="text-slate-400">
          Seus benefícios ainda estão sendo configurados. Tente novamente em alguns instantes.
        </p>
        <button 
          onClick={() => window.location.reload()}
          disabled={isLoading}
          className="mt-2 rounded-lg bg-slate-700 px-6 py-2 font-medium text-white transition hover:bg-slate-600 disabled:opacity-50"
        >
          {isLoading ? 'Carregando...' : 'Tentar Novamente'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <VipProgress
        vipLevel={summary.vipLevel}
        currentTier={summary.currentTier}
        nextTier={summary.nextTier}
        progressToNextLevel={summary.progressToNextLevel}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-5">
        <div 
          className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 p-4 shadow-lg transition-transform hover:scale-[1.02] sm:gap-4 sm:p-5"
          role="status"
          aria-label={`${summary.availableBenefits.length} benefícios disponíveis`}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 sm:size-14">
            <Gift className="size-7 text-emerald-400 sm:size-8" aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400 sm:text-3xl">{summary.availableBenefits.length}</p>
            <p className="text-sm text-slate-400">Disponíveis</p>
          </div>
        </div>
        <div 
          className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 to-blue-600/5 p-4 shadow-lg transition-transform hover:scale-[1.02] sm:gap-4 sm:p-5"
          role="status"
          aria-label={`${summary.claimedBenefits.length} benefícios resgatados`}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 sm:size-14">
            <History className="size-7 text-blue-400 sm:size-8" aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400 sm:text-3xl">{summary.claimedBenefits.length}</p>
            <p className="text-sm text-slate-400">Resgatados</p>
          </div>
        </div>
        <div 
          className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-4 shadow-lg transition-transform hover:scale-[1.02] sm:gap-4 sm:p-5"
          role="status"
          aria-label={`Total ganho: R$ ${summary.totalEarned.toFixed(2)}`}
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 sm:size-14">
            <Coins className="size-7 text-amber-400 sm:size-8" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-400 sm:text-2xl">
              R$ {summary.totalEarned.toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">Total Ganho</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 rounded-xl bg-slate-800/50 p-1.5 sm:gap-3 sm:p-2" role="tablist" aria-label="Filtrar benefícios">
        <button
          onClick={() => setActiveTab('available')}
          role="tab"
          aria-selected={activeTab === 'available'}
          aria-controls="available-benefits-panel"
          className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all sm:flex-none sm:gap-2.5 sm:px-5 sm:py-3 sm:text-base ${activeTab === 'available'
              ? 'bg-emerald-500/20 text-emerald-400 shadow-lg'
              : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
          }`}
        >
          <Gift className="size-5 sm:size-6" aria-hidden="true" />
          <span>Disponíveis</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === 'available' ? 'bg-emerald-500/30' : 'bg-slate-700'}`}>
            {summary.availableBenefits.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          role="tab"
          aria-selected={activeTab === 'history'}
          aria-controls="history-benefits-panel"
          className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all sm:flex-none sm:gap-2.5 sm:px-5 sm:py-3 sm:text-base ${activeTab === 'history'
              ? 'bg-blue-500/20 text-blue-400 shadow-lg'
              : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
          }`}
        >
          <History className="size-5 sm:size-6" aria-hidden="true" />
          <span>Histórico</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === 'history' ? 'bg-blue-500/30' : 'bg-slate-700'}`}>
            {summary.claimedBenefits.length}
          </span>
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {summary.availableBenefits.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
              <Gift className="size-10 text-slate-500" />
              <p className="text-slate-400">Nenhum benefício disponível no momento.</p>
              <p className="text-sm text-slate-500">Continue jogando para desbloquear mais benefícios!</p>
            </div>
          ) : (
            summary.availableBenefits.map((benefit) => (
              <BenefitCard
                key={benefit.id}
                benefit={benefit}
                onClaimed={handleBenefitClaimed}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {summary.claimedBenefits.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
              <History className="size-10 text-slate-500" />
              <p className="text-slate-400">Você ainda não resgatou nenhum benefício.</p>
            </div>
          ) : (
            summary.claimedBenefits.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
