'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';

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
    setCashoutKind((current) => {
      const nextKind = current === 'manual' ? 'auto' : 'manual';
      startPreferenceTransition(async () => {
        await updateAutoCashoutPreferenceAction({
          autoCashoutEnabled: nextKind === 'auto',
        });
      });
      return nextKind;
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-white">
      <h3 className="text-xl font-semibold">Comandos</h3>
      <p className="text-sm text-slate-400">
        Faça apostas fictícias e teste o fluxo completo do node-service.
      </p>

      <div className="mt-4 space-y-5">
        <form action={betAction} className="space-y-3" data-testid="aviator-bet-form">
          <input type="hidden" name="roundId" value={currentRoundId ?? ''} />
          <div>
            <label className="text-sm text-slate-200" htmlFor="bet-amount">
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
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-lg text-white focus:border-teal-400 focus:outline-none"
              disabled={betPending || isPhaseBlocked}
            />
            {!amountValidation.ok ? (
              <p className="mt-1 text-sm text-amber-300">{amountValidation.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm text-slate-200" htmlFor="bet-autopayout">
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
              className="mt-4 w-full accent-teal-400 h-6"
              disabled={betPending || isPhaseBlocked}
            />
          </div>

          <button
            type="submit"
            disabled={isBetDisabled}
            className={cn(
              'w-full rounded-xl border border-teal-400/40 bg-teal-500/80 px-4 py-4 text-lg font-bold text-slate-900 transition active:scale-[0.98]',
              isBetDisabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {isBetDisabled
              ? 'Aguardando próxima rodada'
              : betPending
                ? 'Enviando...'
                : 'Apostar agora'}
          </button>
          {betFormState.message ? (
            <p
              className={cn(
                'text-sm',
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
          className="space-y-3"
          data-testid="aviator-cashout-form"
        >
          <div>
            <div className="flex items-end justify-between gap-2">
              <label className="text-sm text-slate-200" htmlFor="cashout-ticket">
                Ticket
              </label>
              <button
                type="button"
                onClick={handlePasteLastTicket}
                disabled={!lastBetResult?.ticketId || cashoutPending}
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide text-teal-300 transition',
                  (!lastBetResult?.ticketId || cashoutPending) && 'opacity-40'
                )}
              >
                Usar última aposta
              </button>
            </div>
            <input
              id="cashout-ticket"
              name="ticketId"
              type="text"
              value={ticketId}
              onChange={(event) => setTicketId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white focus:border-teal-400 focus:outline-none"
              placeholder="Cole o UUID do ticket"
              disabled={cashoutPending}
              required
            />
          </div>

          <input type="hidden" name="kind" value={cashoutKind} />
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
            <div>
              <p className="font-semibold">Auto cashout</p>
              <p className="text-xs text-slate-400">
                {cashoutKind === 'auto'
                  ? 'Ativo: o servidor encerrará automaticamente.'
                  : 'Manual: use o botão principal para encerrar.'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAutoCashout}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition',
                cashoutKind === 'auto'
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/20 bg-transparent text-slate-300'
              )}
            >
              {cashoutKind === 'auto' ? 'Ativado' : 'Desativado'}
            </button>
          </div>

          <button
            type="submit"
            disabled={cashoutPending}
            className={cn(
              'w-full rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/80 px-4 py-4 text-lg font-bold text-slate-900 transition active:scale-[0.98]',
              cashoutPending && 'cursor-not-allowed opacity-50'
            )}
          >
            {cashoutPending ? 'Solicitando...' : 'Solicitar cashout'}
          </button>
          {cashoutFormState.message ? (
            <p
              className={cn(
                'text-sm',
                cashoutFormState.status === 'error' ? 'text-rose-300' : 'text-emerald-300'
              )}
            >
              {cashoutFormState.message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
