'use client';

import { useActionState } from 'react';
import { Gift, Check, Lock, Clock } from 'lucide-react';
import { claimBenefitAction, type BenefitsActionState } from '@/app/actions/benefits';
import type { UserBenefit } from '@/modules/benefits/types';

interface BenefitCardProps {
  benefit: UserBenefit;
  onClaimed?: () => void;
}

const categoryIcons: Record<string, string> = {
  welcome: '🎁',
  daily: '📅',
  cashback: '💰',
  vip: '👑',
  promo: '🎉',
};

const categoryColors: Record<string, string> = {
  welcome: 'from-emerald-500/20 to-emerald-900/20 border-emerald-500/30',
  daily: 'from-blue-500/20 to-blue-900/20 border-blue-500/30',
  cashback: 'from-amber-500/20 to-amber-900/20 border-amber-500/30',
  vip: 'from-purple-500/20 to-purple-900/20 border-purple-500/30',
  promo: 'from-rose-500/20 to-rose-900/20 border-rose-500/30',
};

export function BenefitCard({ benefit, onClaimed }: BenefitCardProps) {
  const [state, formAction, isPending] = useActionState<BenefitsActionState, FormData>(
    async (prev, formData) => {
      const result = await claimBenefitAction(prev, formData);
      if (result.status === 'success') {
        onClaimed?.();
      }
      return result;
    },
    { status: 'idle', message: '' }
  );

  const category = benefit.benefitType?.category ?? 'promo';
  const icon = categoryIcons[category];
  const colorClass = categoryColors[category];
  const isAvailable = benefit.status === 'available';
  const isClaimed = benefit.status === 'claimed';
  const isLocked = benefit.status === 'locked';

  const rewardValue = benefit.rewardAmount ?? benefit.benefitType?.rewardValue ?? 0;
  const rewardDisplay = benefit.benefitType?.rewardType === 'percentage'
    ? `${rewardValue}%`
    : `R$ ${rewardValue.toFixed(2)}`;

  return (
    <article className={`
      relative flex flex-col gap-3 rounded-xl border bg-gradient-to-b p-3 transition-all sm:gap-4 sm:rounded-2xl sm:p-4 md:p-5
      ${colorClass}
      ${isAvailable ? 'hover:scale-[1.02] hover:shadow-lg' : 'opacity-70'}
    `}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl md:text-3xl">{icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 sm:text-base md:text-lg">
              {benefit.benefitType?.name ?? 'Benefício'}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 sm:text-sm md:text-base">
              {benefit.benefitType?.description}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-bold text-emerald-400 sm:text-base md:text-lg">{rewardDisplay}</span>
        </div>
      </div>

      {isAvailable && (
        <form action={formAction}>
          <input type="hidden" name="userBenefitId" value={benefit.id} />
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-xs font-medium text-white transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[44px] sm:gap-2 sm:py-3 sm:text-sm md:text-base"
          >
            {isPending ? (
              <>
                <Clock className="size-4 animate-spin sm:size-5" />
                Resgatando...
              </>
            ) : (
              <>
                <Gift className="size-4 sm:size-5" />
                Resgatar Agora
              </>
            )}
          </button>
        </form>
      )}

      {isClaimed && (
        <div className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 py-2 text-emerald-400 sm:min-h-[40px] sm:gap-2">
          <Check className="size-4 sm:size-5" />
          <span className="text-xs font-medium sm:text-sm md:text-base">Resgatado</span>
        </div>
      )}

      {isLocked && (
        <div className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg bg-slate-500/20 py-2 text-slate-400 sm:min-h-[40px] sm:gap-2">
          <Lock className="size-4 sm:size-5" />
          <span className="text-xs font-medium sm:text-sm md:text-base">Bloqueado</span>
        </div>
      )}

      {state.status === 'success' && (
        <p className="text-center text-sm text-emerald-400">{state.message}</p>
      )}
      {state.status === 'error' && (
        <p className="text-center text-sm text-rose-400">{state.message}</p>
      )}
    </article>
  );
}
