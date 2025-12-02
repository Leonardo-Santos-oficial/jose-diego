'use client';

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  ArrowLeft,
  Send,
  X,
  MessageCircle,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  MoreVertical,
  Search,
  UserCheck,
  StickyNote,
} from 'lucide-react';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';
import {
  sendAdminMessageAction,
  closeChatThreadAction,
  updateChatThreadMetadataAction,
} from '@/app/actions/chat';
import { chatActionInitialState, type ChatActionState } from '@/app/actions/chat-state';
import { Button } from '@/components/components/ui/button';
import { ChatRealtimeClient } from '@/lib/realtime/chatClient';
import { ChatMessageAttachment } from './ChatMessageAttachment';

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

const relativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return dateTime.format(date);
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);

  const selectedThread = useMemo(() => {
    return threads.find((thread) => thread.id === selectedThreadId) ?? null;
  }, [threads, selectedThreadId]);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const query = searchQuery.toLowerCase();
    return threads.filter(
      (thread) =>
        thread.user?.displayName?.toLowerCase().includes(query) ||
        thread.user?.email?.toLowerCase().includes(query) ||
        thread.messages.some((msg) => msg.body.toLowerCase().includes(query))
    );
  }, [threads, searchQuery]);

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
      <section className="flex min-h-[500px] items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/90 to-slate-900/70 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
            <MessageCircle className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white">Nenhuma conversa aberta</h3>
          <p className="mt-1 text-sm text-slate-400">
            Quando usuários iniciarem conversas, elas aparecerão aqui.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-[calc(100vh-200px)] min-h-[600px] max-h-[800px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 to-slate-900/80 shadow-2xl shadow-teal-500/5">
      {/* Sidebar - Lista de Threads */}
      <aside
        className={`flex w-full flex-col border-r border-white/5 bg-slate-950/50 lg:w-80 xl:w-96 ${
          showMobileList ? 'flex' : 'hidden'
        } lg:flex`}
      >
        {/* Header da Sidebar */}
        <div className="border-b border-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-teal-400" />
              <h2 className="text-lg font-semibold text-white">Suporte</h2>
            </div>
            <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-medium text-teal-300">
              {threads.length} {threads.length === 1 ? 'aberta' : 'abertas'}
            </span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Lista de Threads */}
        <div className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {filteredThreads.map((thread) => {
              const lastMessage = thread.messages.at(-1);
              const isSelected = thread.id === selectedThreadId;
              const userName = thread.user?.displayName || thread.user?.email?.split('@')[0] || 'Anônimo';
              const userInitial = userName.charAt(0).toUpperCase();
              const hasUnread = lastMessage?.senderRole === 'user';

              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setShowMobileList(false);
                    }}
                    className={`group relative w-full rounded-xl p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 shadow-lg shadow-teal-500/5'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Indicador de seleção */}
                    {isSelected && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-teal-400" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        isSelected ? 'bg-teal-500/30' : 'bg-slate-700/50'
                      }`}>
                        <span className={`text-sm font-semibold ${isSelected ? 'text-teal-300' : 'text-slate-300'}`}>
                          {userInitial}
                        </span>
                        {hasUnread && (
                          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-teal-400" />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {userName}
                          </span>
                          <span className="flex-shrink-0 text-xs text-slate-500">
                            {relativeTime(new Date(thread.updatedAt))}
                          </span>
                        </div>
                        <p className={`mt-0.5 truncate text-xs ${
                          hasUnread ? 'font-medium text-slate-300' : 'text-slate-500'
                        }`}>
                          {lastMessage?.body || 'Sem mensagens'}
                        </p>
                        {thread.metadata.lastAgentName && (
                          <div className="mt-1 flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-slate-600" />
                            <span className="text-xs text-slate-600">{thread.metadata.lastAgentName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {filteredThreads.length === 0 && searchQuery && (
            <div className="py-8 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-2 text-sm text-slate-500">Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main - Conversa Selecionada */}
      {selectedThread ? (
        <div className={`flex flex-1 flex-col ${showMobileList ? 'hidden' : 'flex'} lg:flex`}>
          {/* Header da Conversa */}
          <header className="flex items-center justify-between border-b border-white/5 bg-slate-900/30 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden -ml-2 h-10 w-10 rounded-xl"
                onClick={() => setShowMobileList(true)}
              >
                <ArrowLeft className="h-5 w-5 text-slate-400" />
              </Button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/30 to-teal-600/20">
                <span className="text-sm font-semibold text-teal-300">
                  {(selectedThread.user?.displayName || selectedThread.user?.email || 'A').charAt(0).toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                  {selectedThread.user?.displayName || selectedThread.user?.email?.split('@')[0] || 'Usuário'}
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                    #{selectedThread.id.slice(0, 6)}
                  </span>
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {dateTime.format(new Date(selectedThread.createdAt))}
                  </span>
                  {selectedThread.user?.email && (
                    <span className="hidden sm:inline">{selectedThread.user.email}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl ${showMetadata ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setShowMetadata(!showMetadata)}
                title="Notas e metadados"
              >
                <StickyNote className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isClosing}
                onClick={() => handleCloseThread(selectedThread.id)}
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 text-rose-400 hover:bg-rose-500/20"
              >
                <X className="mr-1.5 h-4 w-4" />
                {isClosing ? 'Fechando...' : 'Encerrar'}
              </Button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Área de Mensagens */}
            <div className="flex flex-1 flex-col">
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                {selectedThread.messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-slate-700" />
                      <p className="mt-3 text-sm text-slate-500">Nenhuma mensagem ainda</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedThread.messages.map((message, index) => {
                      const isAdmin = message.senderRole === 'admin';
                      const showTimestamp = index === 0 || 
                        new Date(message.createdAt).getTime() - new Date(selectedThread.messages[index - 1].createdAt).getTime() > 300000;

                      return (
                        <div key={message.id}>
                          {showTimestamp && (
                            <div className="mb-4 flex justify-center">
                              <span className="rounded-full bg-slate-800/50 px-3 py-1 text-xs text-slate-500">
                                {dateTime.format(new Date(message.createdAt))}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`group relative max-w-[75%] ${isAdmin ? 'order-1' : ''}`}>
                              <div
                                className={`rounded-2xl px-4 py-3 ${
                                  isAdmin
                                    ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/20'
                                    : 'border border-white/10 bg-slate-800/80 text-slate-100'
                                }`}
                              >
                                {message.body && (
                                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {message.body}
                                  </p>
                                )}
                                {message.attachmentUrl && message.attachmentType && (
                                  <div className="mt-2">
                                    <ChatMessageAttachment
                                      attachmentUrl={message.attachmentUrl}
                                      attachmentType={message.attachmentType}
                                      attachmentName={message.attachmentName ?? undefined}
                                      isOwnMessage={isAdmin}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className={`mt-1 flex items-center gap-1.5 text-xs text-slate-500 ${isAdmin ? 'justify-end' : ''}`}>
                                <span>{timeOnly.format(new Date(message.createdAt))}</span>
                                {isAdmin && <CheckCircle2 className="h-3 w-3 text-teal-400" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form de Resposta */}
              <ThreadReplyForm
                threadId={selectedThread.id}
                onMessageAppended={(message) =>
                  updateThreadMessages(selectedThread.id, message)
                }
              />
            </div>

            {/* Sidebar de Metadados */}
            {showMetadata && (
              <div className="hidden w-72 flex-shrink-0 border-l border-white/5 bg-slate-950/50 lg:block xl:w-80">
                <ThreadMetadataForm thread={selectedThread} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/30">
              <MessageCircle className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-400">Selecione uma conversa</h3>
            <p className="mt-1 text-sm text-slate-600">
              Escolha uma thread na lista para visualizar
            </p>
          </div>
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={formAction} className="border-t border-white/5 bg-slate-900/30 p-4">
      <input type="hidden" name="threadId" value={threadId} />
      <div className="flex items-end gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            name="body"
            rows={2}
            maxLength={1000}
            placeholder="Digite sua resposta... (Enter para enviar, Shift+Enter para quebra de linha)"
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
            disabled={pending}
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-11 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 p-0 shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-teal-500"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {state.status === 'error' && state.threadId === threadId && state.message && (
        <div className="mt-2 flex items-center gap-2 text-sm text-rose-400">
          <AlertCircle className="h-4 w-4" />
          {state.message}
        </div>
      )}
      {state.status === 'success' && state.threadId === threadId && (
        <div className="mt-2 flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Mensagem enviada
        </div>
      )}
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
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-teal-400" />
        <h4 className="text-sm font-medium text-white">Detalhes do Atendimento</h4>
      </div>

      {/* Info do usuário */}
      <div className="mb-4 rounded-xl bg-slate-800/30 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <User className="h-3.5 w-3.5" />
          <span>Informações do Usuário</span>
        </div>
        <div className="mt-2 space-y-1.5 text-sm">
          <p className="text-white">{thread.user?.displayName || 'Nome não informado'}</p>
          <p className="text-slate-400">{thread.user?.email || 'Email não disponível'}</p>
        </div>
      </div>

      {/* Status da thread */}
      <div className="mb-4 rounded-xl bg-slate-800/30 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>Timeline</span>
        </div>
        <div className="mt-2 space-y-1.5 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Criada em</span>
            <span className="text-slate-300">{dateTime.format(new Date(thread.createdAt))}</span>
          </div>
          <div className="flex justify-between">
            <span>Última atividade</span>
            <span className="text-slate-300">{dateTime.format(new Date(thread.updatedAt))}</span>
          </div>
          <div className="flex justify-between">
            <span>Mensagens</span>
            <span className="text-slate-300">{thread.messages.length}</span>
          </div>
        </div>
      </div>

      <form action={formAction} className="flex-1 space-y-4">
        <input type="hidden" name="threadId" value={thread.id} />

        {/* Notas */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <StickyNote className="h-3.5 w-3.5" />
            Notas internas
          </label>
          <textarea
            name="notes"
            defaultValue={thread.metadata.notes ?? ''}
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
            placeholder="Adicione notas sobre este atendimento..."
            disabled={pending}
          />
        </div>

        {/* Atribuição */}
        <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-800/30 p-3 transition hover:bg-slate-800/50">
          <input
            type="checkbox"
            name="assignToSelf"
            className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500/30"
            disabled={pending}
          />
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300">Atribuir para mim</span>
          </div>
        </label>

        {/* Responsável atual */}
        {thread.metadata.lastAgentName && (
          <div className="rounded-xl bg-teal-500/10 p-3">
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Responsável atual: {thread.metadata.lastAgentName}</span>
            </div>
          </div>
        )}

        {/* Botão salvar */}
        <Button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-slate-700 hover:bg-slate-600"
        >
          {pending ? 'Salvando...' : 'Salvar alterações'}
        </Button>

        {state.status !== 'idle' && state.message && (
          <div
            className={`flex items-center justify-center gap-2 text-xs ${
              state.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {state.status === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {state.message}
          </div>
        )}
      </form>
    </div>
  );
}
