import { getAdminChatSnapshot } from '@/modules/chat/server/getAdminChatSnapshot';
import { AdminChatInbox } from '@/components/chat/AdminChatInbox';

export async function AdminChatInboxSection() {
  let snapshot: Awaited<ReturnType<typeof getAdminChatSnapshot>> | null = null;

  try {
    snapshot = await getAdminChatSnapshot();
  } catch (error) {
    console.error('[chat] não foi possível montar inbox admin', error);
  }

  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-6 text-sm text-rose-100">
        Falha ao carregar a inbox de suporte.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Inbox do suporte</h2>
        <p className="text-sm text-slate-400">
          Acompanhe e responda rapidamente os usuários que abriram threads.
        </p>
      </div>
      <AdminChatInbox initialThreads={snapshot.threads} />
    </div>
  );
}
