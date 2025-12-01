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
    <div className="flex flex-col gap-8">
      <VipProgress
        vipLevel={summary.vipLevel}
        currentTier={summary.currentTier}
        nextTier={summary.nextTier}
        progressToNextLevel={summary.progressToNextLevel}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <Gift className="size-8 text-emerald-400" />
          <div>
            <p className="text-2xl font-bold text-emerald-400">{summary.availableBenefits.length}</p>
            <p className="text-sm text-slate-400">Disponíveis</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <History className="size-8 text-blue-400" />
          <div>
            <p className="text-2xl font-bold text-blue-400">{summary.claimedBenefits.length}</p>
            <p className="text-sm text-slate-400">Resgatados</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <Coins className="size-8 text-amber-400" />
          <div>
            <p className="text-2xl font-bold text-amber-400">
              R$ {summary.totalEarned.toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">Total Ganho</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'available'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Gift className="size-4" />
          Disponíveis ({summary.availableBenefits.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <History className="size-4" />
          Histórico ({summary.claimedBenefits.length})
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
