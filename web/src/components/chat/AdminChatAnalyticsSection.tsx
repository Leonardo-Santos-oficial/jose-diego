import { getChatAnalyticsSnapshot } from '@/modules/chat/server/getChatAnalyticsSnapshot';

export async function AdminChatAnalyticsSection() {
  let snapshot: Awaited<ReturnType<typeof getChatAnalyticsSnapshot>> | null = null;

  try {
    snapshot = await getChatAnalyticsSnapshot();
  } catch (error) {
    console.error('[chat] erro ao carregar analytics', error);
  }

  if (!snapshot) {
    return (
      <section className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-100">
        Não foi possível carregar os analytics do chat agora.
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-slate-100 shadow-[0_0_60px_rgba(15,118,110,0.15)]">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Analytics do chat
        </p>
        <h2 className="text-xl font-semibold text-white">Acompanhamento de threads</h2>
        <p className="text-sm text-slate-400">
          Totais atualizados diretamente do Supabase com histórico das conversas
          encerradas.
        </p>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Abertas</p>
          <p className="text-3xl font-semibold text-white">{snapshot.totals.open}</p>
          <p className="text-xs text-slate-400">Threads aguardando retorno</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fechadas</p>
          <p className="text-3xl font-semibold text-white">{snapshot.totals.closed}</p>
          <p className="text-xs text-slate-400">Conversas finalizadas com histórico</p>
        </div>
      </div>

      {snapshot.recentClosed.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-400">
          Nenhuma thread fechada recentemente.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {snapshot.recentClosed.map((thread) => (
              <div
                key={thread.id}
                className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm"
              >
                <div className="mb-2 flex justify-between">
                  <span className="font-mono text-xs text-slate-400">
                    #{thread.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {thread.closedAt
                      ? new Date(thread.closedAt).toLocaleDateString('pt-BR')
                      : '-'}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="text-slate-200">
                    {thread.user?.displayName ??
                      thread.user?.email ??
                      thread.userId ??
                      'Anônimo'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Resp: {thread.metadata.lastAgentName ?? '—'}
                  </div>
                </div>
                <div className="text-xs italic text-slate-400">
                  "{thread.metadata.notes ?? 'Sem notas'}"
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/60 md:block">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.3em] text-slate-400">
                <tr>
                  <th className="border-b border-white/10 px-4 py-3">Thread</th>
                  <th className="border-b border-white/10 px-4 py-3">Usuário</th>
                  <th className="border-b border-white/10 px-4 py-3">Fechada em</th>
                  <th className="border-b border-white/10 px-4 py-3">Responsável</th>
                  <th className="border-b border-white/10 px-4 py-3">Notas</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recentClosed.map((thread) => (
                  <tr
                    key={thread.id}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      #{thread.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {thread.user?.displayName ??
                        thread.user?.email ??
                        thread.userId ??
                        '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {thread.closedAt
                        ? new Date(thread.closedAt).toLocaleString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {thread.metadata.lastAgentName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {thread.metadata.notes ?? 'Sem notas registradas.'}
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
