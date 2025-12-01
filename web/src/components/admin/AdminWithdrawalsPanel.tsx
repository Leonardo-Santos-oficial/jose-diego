'use client';

import { updateWithdrawStatusAction } from '@/app/actions/withdraw';
import { Button } from '@/components/components/ui/button';
import type { WithdrawRequest } from '@/modules/withdraw/types';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface AdminWithdrawalsPanelProps {
  requests: WithdrawRequest[];
}

export function AdminWithdrawalsPanel({ requests }: AdminWithdrawalsPanelProps) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">Saques</h2>
        <p className="text-xs text-slate-400 sm:text-sm">
          Aprovar ou rejeitar solicitações.
        </p>
      </header>
      <WithdrawalsTable requests={requests} />
    </section>
  );
}

function WithdrawalsTable({ requests }: { requests: WithdrawRequest[] }) {
  if (requests.length === 0) {
    return (
      <p className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 text-xs text-slate-400 sm:rounded-2xl sm:p-6 sm:text-sm">
        Nenhuma solicitação encontrada.
      </p>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {requests.map((request) => (
          <WithdrawCard key={request.id} request={request} />
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/60 sm:rounded-2xl">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-200">
          <thead className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-xs">
            <tr>
              <th className="border-b border-slate-800/60 px-3 py-2 sm:px-4 sm:py-3">Usuário</th>
              <th className="border-b border-slate-800/60 px-3 py-2 sm:px-4 sm:py-3">Valor</th>
              <th className="border-b border-slate-800/60 px-3 py-2 sm:px-4 sm:py-3">Status</th>
              <th className="border-b border-slate-800/60 px-3 py-2 sm:px-4 sm:py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <WithdrawRow key={request.id} request={request} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function WithdrawCard({ request }: { request: WithdrawRequest }) {
  const isPending = request.status === 'pending';

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-950/60 p-3 space-y-2 sm:rounded-xl sm:p-4 sm:space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs">Usuário</span>
          <strong
            className="text-slate-50 text-xs truncate max-w-[150px] sm:text-sm sm:max-w-[200px]"
            title={request.userEmail ?? request.userId}
          >
            {request.userEmail ?? request.userId}
          </strong>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs">Valor</span>
          <span className="text-slate-50 font-semibold text-sm sm:text-base">
            {currency.format(request.amount)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-800/40 pt-2 sm:pt-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs">Data</span>
          <span className="text-[10px] text-slate-500 sm:text-xs">
            {new Date(request.createdAt).toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider sm:text-xs">Status</span>
          <span className="text-xs capitalize text-slate-300 sm:text-sm">
            {translateStatus(request.status)}
          </span>
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2 pt-1 sm:pt-2">
          <form action={updateWithdrawStatusAction} className="flex-1">
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="intent" value="approve" />
            <Button type="submit" size="sm" variant="default" className="w-full text-xs sm:text-sm">
              Aprovar
            </Button>
          </form>
          <form action={updateWithdrawStatusAction} className="flex-1">
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="intent" value="reject" />
            <Button type="submit" size="sm" variant="secondary" className="w-full text-xs sm:text-sm">
              Rejeitar
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function WithdrawRow({ request }: { request: WithdrawRequest }) {
  const isPending = request.status === 'pending';

  return (
    <tr className="border-b border-slate-800/40 last:border-b-0">
      <td className="px-4 py-4 align-top">
        <div className="flex flex-col">
          <strong className="text-slate-50">{request.userEmail ?? request.userId}</strong>
          <small className="text-xs text-slate-500">
            {new Date(request.createdAt).toLocaleString('pt-BR')}
          </small>
        </div>
      </td>
      <td className="px-4 py-4 align-top font-semibold">
        {currency.format(request.amount)}
      </td>
      <td className="px-4 py-4 align-top capitalize">
        {translateStatus(request.status)}
      </td>
      <td className="px-4 py-4 align-top">
        {isPending ? (
          <div className="flex gap-2">
            <form action={updateWithdrawStatusAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <input type="hidden" name="intent" value="approve" />
              <Button type="submit" size="sm" variant="default">
                Aprovar
              </Button>
            </form>
            <form action={updateWithdrawStatusAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <input type="hidden" name="intent" value="reject" />
              <Button type="submit" size="sm" variant="secondary">
                Rejeitar
              </Button>
            </form>
          </div>
        ) : (
          <span className="text-sm text-slate-500">Sem ações</span>
        )}
      </td>
    </tr>
  );
}

function translateStatus(status: WithdrawRequest['status']) {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Rejeitado';
    default:
      return status;
  }
}
