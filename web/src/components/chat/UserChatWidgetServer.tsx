import { UserChatWidget } from '@/components/chat/UserChatWidget';
import { getUserChatSnapshot } from '@/modules/chat/server/getUserChatSnapshot';

type UserChatWidgetServerProps = {
  userId: string;
  userName: string;
};

export async function UserChatWidgetServer({
  userId,
  userName,
}: UserChatWidgetServerProps) {
  let snapshot: Awaited<ReturnType<typeof getUserChatSnapshot>> | null = null;

  try {
    snapshot = await getUserChatSnapshot(userId);
  } catch (error) {
    console.error('[chat] falha ao carregar widget do usuário', error);
  }

  if (!snapshot) {
    return (
      <section className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
        Não foi possível carregar o chat de suporte agora.
      </section>
    );
  }

  return (
    <UserChatWidget
      userName={userName}
      initialThreadId={snapshot.thread.id}
      initialMessages={snapshot.messages}
    />
  );
}
