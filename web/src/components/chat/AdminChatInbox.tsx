'use client';

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';
import {
  sendAdminMessageAction,
  closeChatThreadAction,
  updateChatThreadMetadataAction,
} from '@/app/actions/chat';
import { chatActionInitialState, type ChatActionState } from '@/app/actions/chat-state';
import { Button } from '@/components/components/ui/button';
import { ChatRealtimeClient } from '@/lib/realtime/chatClient';

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const timeOnly = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

type ThreadWithMessages = ChatThread & {
  messages: ChatMessage[];
  user?: {
    email?: string;
    displayName?: string;
  };
};

type AdminChatInboxProps = {
  initialThreads: ThreadWithMessages[];
};

const sortThreads = (list: ThreadWithMessages[]) =>
  [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

export function AdminChatInbox({ initialThreads }: AdminChatInboxProps) {
  const [threads, setThreads] = useState(sortThreads(initialThreads));
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreads[0]?.id ?? null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [isClosing, startClosing] = useTransition();

  const selectedThread = useMemo(() => {
    return threads.find((thread) => thread.id === selectedThreadId) ?? null;
  }, [threads, selectedThreadId]);

  const updateThreadMessages = (threadId: string, message: ChatMessage) => {
    setThreads((prev) => {
      const next = prev.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              updatedAt: message.createdAt,
              messages: thread.messages.some((item) => item.id === message.id)
                ? thread.messages
                : [...thread.messages, message],
            }
          : thread
      );
      return sortThreads(next);
    });
  };

  const removeThread = (threadId: string) => {
    setThreads((prev) => {
      const next = prev.filter((thread) => thread.id !== threadId);
      if (selectedThreadId === threadId) {
        setSelectedThreadId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleCloseThread = (threadId: string) => {
    startClosing(async () => {
      const formData = new FormData();
      formData.set('threadId', threadId);
      const result = await closeChatThreadAction(formData);
      if (result.ok) {
        removeThread(threadId);
      }
    });
  };

  useEffect(() => {
    const realtime = new ChatRealtimeClient();

    const unsubscribeMessages = realtime.subscribeToAllMessages((incoming) => {
      setThreads((prev) => {
        const hasThread = prev.some((thread) => thread.id === incoming.threadId);
        if (!hasThread) {
          return prev;
        }
        const next = prev.map((thread) =>
          thread.id === incoming.threadId
            ? {
                ...thread,
                updatedAt: incoming.createdAt,
                messages: thread.messages.some((msg) => msg.id === incoming.id)
                  ? thread.messages
                  : [...thread.messages, incoming],
              }
            : thread
        );
        return sortThreads(next);
      });
    });

    const unsubscribeThreads = realtime.subscribeToThreadUpdates((update) => {
      setThreads((prev) => {
        if (update.status !== 'open') {
          const filtered = prev.filter((thread) => thread.id !== update.id);
          if (selectedThreadId === update.id) {
            setSelectedThreadId(filtered[0]?.id ?? null);
          }
          return filtered;
        }

        const exists = prev.find((thread) => thread.id === update.id);

        if (!exists) {
          return sortThreads([...prev, { ...update, messages: [] }]);
        }

        const next = prev.map((thread) =>
          thread.id === update.id ? { ...thread, ...update } : thread
        );

        return sortThreads(next);
      });
    });

    return () => {
      unsubscribeMessages();
      unsubscribeThreads();
      realtime.dispose();
    };
  }, [selectedThreadId]);

  if (threads.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-center text-sm text-slate-400">
        Nenhuma conversa aberta no momento.
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_0_70px_rgba(15,118,110,0.15)] md:p-6 lg:flex-row">
      <aside
        className={`w-full max-w-sm space-y-3 border-b border-slate-800/60 pb-4 lg:border-b-0 lg:border-r lg:pr-4 ${
          showMobileList ? 'block' : 'hidden'
        } lg:block`}
      >
        <h2 className="text-base font-semibold text-white">Threads em aberto</h2>
        <ul className="space-y-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedThreadId(thread.id);
                  setShowMobileList(false);
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  thread.id === selectedThreadId
                    ? 'border-teal-400/60 bg-teal-500/10 text-white'
                    : 'border-white/5 bg-slate-900/50 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {thread.status === 'open' ? 'Aberta' : 'Fechada'} •{' '}
                  {dateTime.format(new Date(thread.updatedAt))}
                </div>
                <p className="mt-1 text-sm">
                  Usuário:{' '}
                  <span className="font-semibold">
                    {thread.user?.displayName ??
                      thread.user?.email ??
                      thread.userId ??
                      'Anônimo'}
                  </span>
                </p>
                <p className="truncate text-xs text-slate-400">
                  Última mensagem: {thread.messages.at(-1)?.body ?? 'Sem mensagens'}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {selectedThread ? (
        <div
          className={`flex-1 space-y-4 ${
            showMobileList ? 'hidden' : 'block'
          } lg:block`}
        >
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden -ml-2"
                onClick={() => setShowMobileList(true)}
              >
                <ArrowLeft className="size-5 text-slate-400" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Thread
                </p>
                <h3 className="text-xl font-semibold text-white">
                  {selectedThread.user?.displayName ??
                    selectedThread.user?.email ??
                    'Conversa'}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    #{selectedThread.id.slice(0, 8)}
                  </span>
                </h3>
                <p className="text-sm text-slate-400">
                  Usuário associado:{' '}
                  {selectedThread.user?.displayName ??
                    selectedThread.user?.email ??
                    selectedThread.userId ??
                    '—'}
                </p>
                <p className="text-xs text-slate-500">
                  Responsável atual:{' '}
                  {selectedThread.metadata.lastAgentName ?? 'Não atribuído'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isClosing}
                onClick={() => handleCloseThread(selectedThread.id)}
              >
                {isClosing ? 'Encerrando...' : 'Fechar thread'}
              </Button>
            </div>
          </header>

          <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-white/5 bg-slate-950/60 p-4">
            {selectedThread.messages.length === 0 ? (
              <p className="text-sm text-slate-500">Sem mensagens registradas.</p>
            ) : (
              <ul className="space-y-3">
                {selectedThread.messages.map((message) => (
                  <li key={message.id}>
                    <article
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        message.senderRole === 'admin'
                          ? 'border border-teal-400/40 bg-teal-500/10 text-teal-50'
                          : 'border border-white/10 bg-slate-900/80 text-slate-100'
                      }`}
                    >
                      <header className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        {message.senderRole === 'admin' ? 'Admin' : 'Usuário'} •{' '}
                        {timeOnly.format(new Date(message.createdAt))}
                      </header>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                        {message.body}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ThreadReplyForm
            threadId={selectedThread.id}
            onMessageAppended={(message) =>
              updateThreadMessages(selectedThread.id, message)
            }
          />
          <ThreadMetadataForm thread={selectedThread} />
        </div>
      ) : (
        <div className="flex-1 rounded-2xl border border-white/5 bg-slate-900/60 p-6 text-sm text-slate-400">
          Selecione uma thread para visualizar o histórico.
        </div>
      )}
    </section>
  );
}

type ThreadReplyFormProps = {
  threadId: string;
  onMessageAppended: (message: ChatMessage) => void;
};

function ThreadReplyForm({ threadId, onMessageAppended }: ThreadReplyFormProps) {
  const [state, formAction, pending] = useActionState<ChatActionState, FormData>(
    sendAdminMessageAction,
    chatActionInitialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.status === 'success' && state.lastMessage && state.threadId === threadId) {
      onMessageAppended(state.lastMessage);
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state, threadId, onMessageAppended]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="threadId" value={threadId} />
      <textarea
        ref={textareaRef}
        name="body"
        rows={3}
        maxLength={1000}
        placeholder="Responder usuário..."
        className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
        disabled={pending}
      />
      {state.status === 'error' && state.threadId === threadId && state.message ? (
        <p className="text-sm text-rose-300" role="status">
          {state.message}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="rounded-full px-6">
          {pending ? 'Enviando...' : 'Enviar resposta'}
        </Button>
        {state.status === 'success' && state.threadId === threadId ? (
          <span className="text-sm text-emerald-300" role="status">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

type MetadataActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

const metadataInitialState: MetadataActionState = { status: 'idle' };

type ThreadMetadataFormProps = {
  thread: ThreadWithMessages;
};

function ThreadMetadataForm({ thread }: ThreadMetadataFormProps) {
  const [state, formAction, pending] = useActionState<MetadataActionState, FormData>(
    async (_prev, formData) => {
      const result = await updateChatThreadMetadataAction(formData);
      return result.ok
        ? { status: 'success', message: 'Metadados salvos.' }
        : { status: 'error', message: result.message ?? 'Falha ao salvar.' };
    },
    metadataInitialState
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/5 bg-slate-900/70 p-4 text-sm text-slate-200"
    >
      <input type="hidden" name="threadId" value={thread.id} />
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Notas internas
        </label>
        <textarea
          name="notes"
          defaultValue={thread.metadata.notes ?? ''}
          rows={3}
          maxLength={1000}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
          placeholder="Registre detalhes importantes do atendimento"
          disabled={pending}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
        <input
          id={`assign-${thread.id}`}
          type="checkbox"
          name="assignToSelf"
          className="h-4 w-4 rounded border-white/20 bg-slate-900"
          disabled={pending}
        />
        <label htmlFor={`assign-${thread.id}`}>Atribuir para mim</label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="rounded-full px-5">
          {pending ? 'Salvando...' : 'Salvar metadados'}
        </Button>
        {state.status !== 'idle' && state.message ? (
          <span
            className={`text-xs ${
              state.status === 'success' ? 'text-emerald-300' : 'text-rose-300'
            }`}
            role="status"
          >
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
