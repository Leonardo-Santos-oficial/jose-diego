'use client';

import { useActionState, useEffect, useState } from 'react';
import { requestWithdrawAction } from '@/app/actions/withdraw';
import { withdrawActionInitialState } from '@/app/actions/withdraw-state';
import { Button } from '@/components/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/components/ui/dialog';
import { Input } from '@/components/components/ui/input';
import { Label } from '@/components/components/ui/label';

type RequestWithdrawDialogProps = {
  userId?: string | null;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export function RequestWithdrawDialog({ userId }: RequestWithdrawDialogProps) {
  const [amount, setAmount] = useState('');
  const [state, formAction] = useActionState(
    requestWithdrawAction,
    withdrawActionInitialState
  );

  useEffect(() => {
    if (state.status === 'success') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Safe reset after successful server action response.
      setAmount('');
    }
  }, [state.status]);

  const disabled = !userId;
  const label = amount ? currencyFormatter.format(Number(amount)) : 'R$ 0,00';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full border border-slate-700 px-3 lg:px-5"
          disabled={disabled}
        >
          <span className="lg:hidden">Saque</span>
          <span className="hidden lg:inline">Solicitar Saque</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-950 text-slate-50">
        <DialogHeader>
          <DialogTitle>Solicitar saque</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Valor</Label>
            <Input
              id="withdraw-amount"
              name="amount"
              type="number"
              min={10}
              step={10}
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="R$ 100,00"
            />
            <p className="text-sm text-slate-400">{label}</p>
          </div>
          <Button type="submit" className="w-full" disabled={state.status === 'success'}>
            Enviar solicitação
          </Button>
          {state.status !== 'idle' && (
            <p
              className={`text-sm ${
                state.status === 'success' ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {state.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
