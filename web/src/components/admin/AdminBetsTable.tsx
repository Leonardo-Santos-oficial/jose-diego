'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/components/ui/button';
import type { AdminBetHistoryEntry } from '@/modules/admin/services/betHistoryService';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

type AdminBetsTableProps = {
  bets: AdminBetHistoryEntry[];
  currentPage: number;
  totalPages: number;
};

export function AdminBetsTable({
  bets,
  currentPage,
  totalPages,
}: AdminBetsTableProps) {
  return (
    <section className="rounded-2xl border border-slate-800/60 bg-slate-950/80 p-3 shadow-[0_25px_80px_rgba(2,6,23,0.35)] sm:rounded-3xl sm:p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
            Histórico de Apostas
          </h2>
          <p className="text-xs text-slate-400 sm:text-sm">
            Registro global de apostas.
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/60 p-2 sm:bg-transparent sm:p-0">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            asChild
            className="size-8 sm:size-9"
          >
            <Link
              href={currentPage > 1 ? `/admin?page=${currentPage - 1}` : '#'}
              aria-disabled={currentPage <= 1}
            >
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <span className="text-xs text-slate-400 sm:text-sm">
            {currentPage}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages}
            asChild
            className="size-8 sm:size-9"
          >
            <Link
              href={
                currentPage < totalPages ? `/admin?page=${currentPage + 1}` : '#'
              }
              aria-disabled={currentPage >= totalPages}
            >
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {bets.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma aposta registrada.</p>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="rounded-2xl border border-slate-800/40 bg-slate-900/40 p-4"
              >
                <div className="mb-2 flex justify-between">
                  <span className="font-mono text-xs text-slate-500">
                    #{bet.roundId.slice(0, 8)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {dateTime.format(new Date(bet.createdAt))}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="text-sm text-slate-200">
                    {bet.userEmail ?? bet.userId}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/40 pt-2">
                  <div>
                    <div className="text-xs text-slate-400">Aposta</div>
                    <div className="font-semibold text-slate-200">
                      {currency.format(bet.amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Retorno</div>
                    <div
                      className={`font-semibold ${
                        bet.payout && bet.payout > 0
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {bet.payout ? currency.format(bet.payout) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="border-b border-slate-800/60 pb-3">Data</th>
                  <th className="border-b border-slate-800/60 pb-3">Round</th>
                  <th className="border-b border-slate-800/60 pb-3">Usuário</th>
                  <th className="border-b border-slate-800/60 pb-3">Valor</th>
                  <th className="border-b border-slate-800/60 pb-3">Mult.</th>
                  <th className="border-b border-slate-800/60 pb-3">Retorno</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr
                    key={bet.id}
                    className="border-b border-slate-800/40 last:border-b-0"
                  >
                    <td className="py-4 text-slate-400">
                      {dateTime.format(new Date(bet.createdAt))}
                    </td>
                    <td className="py-4 font-mono text-xs text-slate-500" title={bet.roundId}>
                      {bet.roundId.slice(0, 8)}...
                    </td>
                    <td className="py-4 text-slate-200">
                      {bet.userEmail ?? bet.userId}
                    </td>
                    <td className="py-4 font-medium text-slate-200">
                      {currency.format(bet.amount)}
                    </td>
                    <td className="py-4 text-slate-400">
                      {bet.multiplier ? `${bet.multiplier.toFixed(2)}x` : '—'}
                    </td>
                    <td
                      className={`py-4 font-medium ${
                        bet.payout && bet.payout > 0
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {bet.payout ? currency.format(bet.payout) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
