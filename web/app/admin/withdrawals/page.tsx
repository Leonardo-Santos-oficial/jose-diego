import { updateWithdrawStatusAction } from '@/app/actions/withdraw';
import { Button } from '@/components/components/ui/button';
import { WithdrawService } from '@/modules/withdraw/services/withdrawService';
import type { WithdrawRequest } from '@/modules/withdraw/types';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const dynamic = 'force-dynamic';

export default async function AdminWithdrawalsPage() {
  const service = new WithdrawService();
  const requests = await service.listAll();

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Saques</h1>
          <p className="text-sm text-slate-400">
            Aprovar ou rejeitar solicitações enviadas pelos usuários.
          </p>
        </div>
      </header>
      <WithdrawalsTable requests={requests} />
    </section>
  );
}

type WithdrawalsTableProps = {
  requests: WithdrawRequest[];
};

function WithdrawalsTable({ requests }: WithdrawalsTableProps) {
  if (requests.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 text-slate-400">
        Nenhuma solicitação encontrada.
      </p>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {requests.map((request) => (
          <WithdrawCard key={request.id} request={request} />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/60">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-200">
          <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="border-b border-slate-800/60 px-4 py-3">Usuário</th>
              <th className="border-b border-slate-800/60 px-4 py-3">Valor</th>
              <th className="border-b border-slate-800/60 px-4 py-3">Status</th>
              <th className="border-b border-slate-800/60 px-4 py-3">Ações</th>
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
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/60 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            Usuário
          </span>
          <strong
            className="text-slate-50 text-sm truncate max-w-[200px]"
            title={request.userEmail ?? request.userId}
          >
            {request.userEmail ?? request.userId}
          </strong>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            Valor
          </span>
          <span className="text-slate-50 font-semibold">
            {currency.format(request.amount)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            Data
          </span>
          <span className="text-xs text-slate-500">
            {new Date(request.createdAt).toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            Status
          </span>
          <span className="text-sm capitalize text-slate-300">
            {translateStatus(request.status)}
          </span>
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2 pt-2">
          <form action={updateWithdrawStatusAction} className="flex-1">
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="intent" value="approve" />
            <Button type="submit" size="sm" variant="default" className="w-full">
              Aprovar
            </Button>
          </form>
          <form action={updateWithdrawStatusAction} className="flex-1">
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="intent" value="reject" />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="w-full"
            >
              Rejeitar
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

type WithdrawRowProps = {
  request: WithdrawRequest;
};

function WithdrawRow({ request }: WithdrawRowProps) {
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
