'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';

import type { AviatorController } from '@/modules/aviator/controllers/aviatorController';
import { placeBetAction, cashoutAction } from '@/app/actions/aviator';
import { createInitialAviatorActionState } from '@/app/actions/aviator-state';
import type { BetResultMessage, CashoutResultMessage, GamePhase } from '@/types/aviator';
import { cn } from '@/components/lib/utils';
import {
  MIN_BET_AMOUNT,
  MAX_BET_AMOUNT,
  validateBetAmount,
} from '@/modules/aviator/validation/validateBetAmount';
import { useAviatorStore } from '@/modules/aviator/state/useAviatorStore';
import { updateAutoCashoutPreferenceAction } from '@/app/actions/preferences';

export type AviatorBetPanelProps = {
  controller: AviatorController;
  currentRoundId?: string;
  currentPhase?: GamePhase;
  initialAutoCashoutPreference?: boolean;
};

export function AviatorBetPanel({
  controller,
  currentRoundId,
  currentPhase,
  initialAutoCashoutPreference,
}: AviatorBetPanelProps) {
  const [betFormState, dispatchBet, betPending] = useActionState(
    placeBetAction,
    createInitialAviatorActionState<BetResultMessage>()
  );
  const [cashoutFormState, dispatchCashout, cashoutPending] = useActionState(
    cashoutAction,
    createInitialAviatorActionState<CashoutResultMessage>()
  );

  const [amount, setAmount] = useState('25');
  const [autopayout, setAutopayout] = useState('2');
  const [ticketId, setTicketId] = useState('');
  const [cashoutKind, setCashoutKind] = useState<'manual' | 'auto'>(
    initialAutoCashoutPreference ? 'auto' : 'manual'
  );
  const lastBetResult = useAviatorStore((state) => state.betResult);
  const [, startPreferenceTransition] = useTransition();

  useEffect(() => {
    if (betFormState.status === 'success' && betFormState.data?.ticketId) {
      setTicketId(betFormState.data.ticketId);
    }
  }, [betFormState]);

  const parsedAmount = useMemo(() => Number(amount.replace(',', '.')), [amount]);
  const amountValidation = useMemo(() => validateBetAmount(parsedAmount), [parsedAmount]);

  const isPhaseBlocked = !currentRoundId || currentPhase !== 'awaitingBets';
  const isBetDisabled = betPending || isPhaseBlocked || !amountValidation.ok;

  const betAction = useMemo(
    () => async (formData: FormData) => {
      controller.playClick();
      return dispatchBet(formData);
    },
    [controller, dispatchBet]
  );

  const cashoutActionWithAudio = useMemo(
    () => async (formData: FormData) => {
      controller.playClick();
      return dispatchCashout(formData);
    },
    [controller, dispatchCashout]
  );

  const handlePasteLastTicket = () => {
    const lastTicketId = lastBetResult?.ticketId;
    if (!lastTicketId) {
      return;
    }
    setTicketId(lastTicketId);
  };

  const toggleAutoCashout = () => {
    const nextKind = cashoutKind === 'manual' ? 'auto' : 'manual';
    setCashoutKind(nextKind);
    
    startPreferenceTransition(async () => {
      await updateAutoCashoutPreferenceAction({
        autoCashoutEnabled: nextKind === 'auto',
      });
    });
  };

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900 p-3 text-white shadow-lg lg:p-4">
      <div className="mb-3 flex items-center justify-between lg:mb-4">
         <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${currentPhase === 'awaitingBets' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
               {currentPhase === 'awaitingBets' ? 'Apostas Abertas' : 'Aguarde'}
            </span>
         </div>
      </div>

      <div className="mt-3 space-y-3 lg:mt-4 lg:space-y-5">
        <form action={betAction} className="space-y-2 lg:space-y-3" data-testid="aviator-bet-form">
          <input type="hidden" name="roundId" value={currentRoundId ?? ''} />
          <div>
            <label className="text-xs text-slate-200 lg:text-sm" htmlFor="bet-amount">
              Valor da aposta
            </label>
            <input
              id="bet-amount"
              name="amount"
              type="number"
              min={MIN_BET_AMOUNT}
              max={MAX_BET_AMOUNT}
              step={0.5}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none lg:rounded-xl lg:px-4 lg:py-3 lg:text-lg"
              disabled={betPending || isPhaseBlocked}
            />
            {!amountValidation.ok ? (
              <p className="mt-1 text-sm text-amber-300">{amountValidation.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-xs text-slate-200 lg:text-sm" htmlFor="bet-autopayout">
              Auto cashout ({autopayout}x)
            </label>
            <input
              id="bet-autopayout"
              name="autopayoutMultiplier"
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={autopayout}
              onChange={(event) => setAutopayout(event.target.value)}
              className="mt-2 h-4 w-full accent-teal-400 lg:mt-4 lg:h-6"
              disabled={betPending || isPhaseBlocked}
            />
          </div>

          <button
            type="submit"
            disabled={isBetDisabled}
            className={cn(
              'w-full whitespace-nowrap rounded-lg border border-teal-400/40 bg-teal-500/80 px-4 py-2 text-xs font-bold text-slate-900 transition active:scale-[0.98] lg:rounded-xl lg:py-4 lg:text-lg',
              isBetDisabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {isBetDisabled
              ? 'Aguardando...'
              : betPending
                ? 'Enviando...'
                : 'Apostar'}
          </button>
          {betFormState.message ? (
            <p
              className={cn(
                'text-[10px] lg:text-sm',
                betFormState.status === 'error' ? 'text-rose-300' : 'text-emerald-300'
              )}
            >
              {betFormState.message}
            </p>
          ) : null}
        </form>

        <div className="h-px bg-white/5" aria-hidden="true" />

        <form
          action={cashoutActionWithAudio}
          className="space-y-2 lg:space-y-3"
          data-testid="aviator-cashout-form"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] text-slate-400 lg:text-sm" htmlFor="cashout-ticket">
                Ticket (UUID)
              </label>
              <button
                type="button"
                onClick={handlePasteLastTicket}
                disabled={!lastBetResult?.ticketId || cashoutPending}
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide text-teal-300 transition lg:text-xs',
                  (!lastBetResult?.ticketId || cashoutPending) && 'opacity-40'
                )}
              >
                Colar último
              </button>
            </div>
            <input
              id="cashout-ticket"
              name="ticketId"
              type="text"
              value={ticketId}
              onChange={(event) => setTicketId(event.target.value)}
              className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-900/50 px-2 py-1.5 text-[10px] text-white focus:border-teal-400 focus:outline-none lg:mt-1 lg:rounded-xl lg:px-4 lg:py-3 lg:text-base"
              placeholder="Cole o UUID do ticket"
              disabled={cashoutPending}
              required
            />
          </div>

          <input type="hidden" name="kind" value={cashoutKind} />
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-slate-900/40 px-2 py-1.5 text-[10px] text-slate-200 lg:rounded-xl lg:px-4 lg:py-3 lg:text-sm">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Auto Cashout</p>
              <span className="hidden text-[10px] text-slate-500 sm:inline">
                {cashoutKind === 'auto' ? '(Automático)' : '(Manual)'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAutoCashout}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition lg:px-4 lg:py-2 lg:text-xs',
                cashoutKind === 'auto'
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/20 bg-transparent text-slate-300'
              )}
            >
              {cashoutKind === 'auto' ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            type="submit"
            disabled={cashoutPending}
            className={cn(
              'w-full whitespace-nowrap rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/80 px-4 py-2 text-xs font-bold text-slate-900 transition active:scale-[0.98] lg:rounded-xl lg:py-4 lg:text-lg',
              cashoutPending && 'cursor-not-allowed opacity-50'
            )}
          >
            {cashoutPending ? 'Solicitando...' : 'Cashout'}
          </button>
          {cashoutFormState.message ? (
            <p
              className={cn(
                'text-[10px] lg:text-sm',
                cashoutFormState.status === 'error' ? 'text-rose-300' : 'text-emerald-300'
              )}
            >
              {cashoutFormState.message}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
