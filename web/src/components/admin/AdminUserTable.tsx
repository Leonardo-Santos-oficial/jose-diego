'use client';

import { useActionState, useMemo } from 'react';
import type { AdminUserSummary } from '@/modules/admin/types';
import { adminActionInitialState } from '@/modules/admin/types/actionState';
import { adjustBalanceAction } from '@/app/actions/admin';
import { Button } from '@/components/components/ui/button';
import { Input } from '@/components/components/ui/input';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type AdminUserTableProps = {
  users: AdminUserSummary[];
};

export function AdminUserTable({ users }: AdminUserTableProps) {
  const orderedUsers = useMemo(
    () => [...users].sort((a, b) => b.balance - a.balance),
    [users]
  );

  return (
    <section className="rounded-3xl border border-slate-800/60 bg-slate-950/80 p-4 shadow-[0_25px_80px_rgba(2,6,23,0.35)] md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Admin • Usuários e Carteiras
          </h1>
          <p className="text-sm text-slate-400">
            Aplicar comandos de crédito/débito com rastreio em tempo real.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        {orderedUsers.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="border-b border-slate-800/60 pb-3">Usuário</th>
              <th className="border-b border-slate-800/60 pb-3">Display</th>
              <th className="border-b border-slate-800/60 pb-3">Saldo</th>
              <th className="border-b border-slate-800/60 pb-3">
                Ajustar Saldo (Command)
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedUsers.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type UserRowProps = {
  user: AdminUserSummary;
};

function UserRow({ user }: UserRowProps) {
  const [state, formAction] = useActionState(
    adjustBalanceAction,
    adminActionInitialState
  );

  return (
    <tr className="border-b border-slate-800/40 last:border-b-0">
      <td className="py-4 align-top">
        <div className="flex flex-col text-sm text-slate-200">
          <strong className="text-base text-slate-50">{user.email}</strong>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {user.role}
          </span>
        </div>
      </td>
      <td className="py-4 align-top text-slate-200">{user.displayName ?? '—'}</td>
      <td className="py-4 align-top text-base font-semibold text-emerald-300">
        {currency.format(user.balance)}
      </td>
      <td className="py-4 align-top">
        <form className="flex flex-wrap items-center gap-3" action={formAction}>
          <input type="hidden" name="userId" value={user.id} />
          <Input
            type="number"
            step="0.01"
            name="delta"
            placeholder="± R$"
            required
            className="w-24"
          />
          <Input
            type="text"
            name="reason"
            placeholder="Motivo (opcional)"
            className="min-w-[160px] flex-1"
          />
          <Button type="submit" className="px-5">
            Executar
          </Button>
        </form>
        {state.status !== 'idle' && (
          <p
            className={`mt-2 text-sm ${
              state.status === 'success' ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {state.message}
          </p>
        )}
      </td>
    </tr>
  );
}

function UserCard({ user }: UserRowProps) {
  const [state, formAction] = useActionState(
    adjustBalanceAction,
    adminActionInitialState
  );

  return (
    <div className="rounded-2xl border border-slate-800/40 bg-slate-900/40 p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-col overflow-hidden">
          <strong className="truncate text-sm text-slate-50">{user.email}</strong>
          <span className="text-xs uppercase tracking-wider text-slate-500">
            {user.role}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-base font-semibold text-emerald-300">
            {currency.format(user.balance)}
          </div>
          <div className="text-xs text-slate-400">{user.displayName ?? '—'}</div>
        </div>
      </div>

      <form className="flex flex-col gap-3" action={formAction}>
        <input type="hidden" name="userId" value={user.id} />
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            name="delta"
            placeholder="± R$"
            required
            className="w-1/3"
          />
          <Input
            type="text"
            name="reason"
            placeholder="Motivo"
            className="flex-1"
          />
        </div>
        <Button type="submit" className="w-full">
          Executar
        </Button>
      </form>
      {state.status !== 'idle' && (
        <p
          className={`mt-2 text-xs ${
            state.status === 'success' ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
