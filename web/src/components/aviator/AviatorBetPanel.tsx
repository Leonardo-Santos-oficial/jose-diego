'use client';

import { useActionState, useMemo, useState } from 'react';
import type { AviatorController } from '@/modules/aviator/controllers/aviatorController';
import { placeBetAction, cashoutAction } from '@/app/actions/aviator';
import { createInitialAviatorActionState } from '@/app/actions/aviator-state';
import type {
  BetResultMessage,
  CashoutResultMessage,
  GamePhase,
} from '@/types/aviator';
import { cn } from '@/components/lib/utils';

export type AviatorBetPanelProps = {
  userId: string;
  controller: AviatorController;
  currentRoundId?: string;
  currentPhase?: GamePhase;
};

export function AviatorBetPanel({
  userId,
  controller,
  currentRoundId,
  currentPhase,
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

  const isBetDisabled = !currentRoundId || currentPhase !== 'awaitingBets';

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

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-white">
      <h3 className="text-xl font-semibold">Comandos</h3>
      <p className="text-sm text-slate-400">
        Faça apostas fictícias e teste o fluxo completo do node-service.
      </p>

      <div className="mt-4 space-y-5">
        <form action={betAction} className="space-y-3" data-testid="aviator-bet-form">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="roundId" value={currentRoundId ?? ''} />
          <div>
            <label className="text-sm text-slate-200" htmlFor="bet-amount">
              Valor da aposta
            </label>
            <input
              id="bet-amount"
              name="amount"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
              disabled={betPending || isBetDisabled}
            />
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
              className="mt-2 w-full accent-teal-400"
              disabled={betPending || isBetDisabled}
            />
          </div>

          <button
            type="submit"
            disabled={betPending || isBetDisabled}
            className={cn(
              'w-full rounded-xl border border-teal-400/40 bg-teal-500/80 px-4 py-2 font-semibold text-slate-900 transition',
              (betPending || isBetDisabled) && 'cursor-not-allowed opacity-50'
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
          <input type="hidden" name="userId" value={userId} />
          <div>
            <label className="text-sm text-slate-200" htmlFor="cashout-ticket">
              Ticket
            </label>
            <input
              id="cashout-ticket"
              name="ticketId"
              type="text"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
              placeholder="Cole o UUID do ticket"
              disabled={cashoutPending}
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="radio"
                name="kind"
                value="manual"
                defaultChecked
                className="accent-teal-400"
              />
              Manual
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input type="radio" name="kind" value="auto" className="accent-teal-400" />
              Auto
            </label>
          </div>

          <button
            type="submit"
            disabled={cashoutPending}
            className={cn(
              'w-full rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/80 px-4 py-2 font-semibold text-slate-900 transition',
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
