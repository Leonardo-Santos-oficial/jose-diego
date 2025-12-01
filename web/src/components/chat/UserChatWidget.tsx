'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { sendChatMessageAction } from '@/app/actions/chat';
import { chatActionInitialState, type ChatActionState } from '@/app/actions/chat-state';
import type { ChatMessage, AttachmentType } from '@/modules/chat/types';
import { Button } from '@/components/components/ui/button';
import { ChatRealtimeClient } from '@/lib/realtime/chatClient';
import { ChatAttachmentInput } from './ChatAttachmentInput';
import { ChatMessageAttachment } from './ChatMessageAttachment';
import { useChatAttachmentUpload } from '@/hooks/useChatAttachmentUpload';

type UserChatWidgetProps = {
  userId: string;
  userName: string;
  initialThreadId: string;
  initialMessages: ChatMessage[];
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function UserChatWidget({
  userId,
  userName,
  initialThreadId,
  initialMessages,
}: UserChatWidgetProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [threadId, setThreadId] = useState(initialThreadId);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { state: uploadState, upload: uploadAttachment, reset: resetUpload } = useChatAttachmentUpload(
    userId,
    threadId
  );

  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string;
    type: AttachmentType;
    name: string;
  } | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleFileSelect = useCallback(async (file: File) => {
    const result = await uploadAttachment(file);
    if (result) {
      setPendingAttachment({
        url: result.url,
        type: result.attachmentType,
        name: result.fileName,
      });
    }
  }, [uploadAttachment]);

  const handleClearAttachment = useCallback(() => {
    setPendingAttachment(null);
    resetUpload();
  }, [resetUpload]);

  const handleChatAction = useCallback(
    async (previousState: ChatActionState, formData: FormData) => {
      if (pendingAttachment) {
        formData.set('attachmentUrl', pendingAttachment.url);
        formData.set('attachmentType', pendingAttachment.type);
        formData.set('attachmentName', pendingAttachment.name);
      }

      const result = await sendChatMessageAction(previousState, formData);
      if (result.status === 'success' && result.lastMessage) {
        if (result.threadId) {
          setThreadId(result.threadId);
        }
        setMessages((prev) => [...prev, result.lastMessage as ChatMessage]);
        formRef.current?.reset();
        textareaRef.current?.focus();
        handleClearAttachment();
      }
      return result;
    },
    [pendingAttachment, handleClearAttachment]
  );

  const [state, formAction, pending] = useActionState<ChatActionState, FormData>(
    handleChatAction,
    chatActionInitialState
  );

  useEffect(() => {
    if (!threadId) {
      return;
    }

    const realtime = new ChatRealtimeClient();
    const unsubscribe = realtime.subscribeToThreadMessages(threadId, (incoming) => {
      setMessages((prev) => {
        if (prev.some((message) => message.id === incoming.id)) {
          return prev;
        }
        return [...prev, incoming];
      });
    });

    return () => {
      unsubscribe();
      realtime.dispose();
    };
  }, [threadId]);

  const isUploading = uploadState.status === 'uploading';

  return (
    <section className="rounded-3xl border border-white/5 bg-slate-950/70 p-6 shadow-[0_0_50px_rgba(15,118,110,0.15)]">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-teal-300">Suporte</p>
          <h2 className="text-xl font-semibold text-white">
            Precisa de ajuda, {userName}?
          </h2>
          <p className="text-sm text-slate-400">
            Envie sua mensagem ou anexe prints para a equipe avaliar.
          </p>
        </div>
      </div>

      <div className="mb-4 max-h-80 overflow-y-auto rounded-2xl border border-white/5 bg-slate-950/60 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">Seu histórico aparecerá aqui.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li key={message.id} className="text-sm">
                <div
                  className={`inline-flex max-w-[90%] flex-col rounded-2xl px-4 py-3 text-sm ${
                    message.senderRole === 'user'
                      ? 'bg-teal-500/10 text-teal-100'
                      : 'bg-slate-800/80 text-slate-100'
                  }`}
                >
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {message.senderRole === 'user' ? 'Você' : 'Equipe'} •{' '}
                    {dateFormatter.format(new Date(message.createdAt))}
                  </span>
                  {message.body && (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {message.body}
                    </p>
                  )}
                  {message.attachmentUrl && message.attachmentType && (
                    <ChatMessageAttachment
                      attachmentUrl={message.attachmentUrl}
                      attachmentType={message.attachmentType}
                      attachmentName={message.attachmentName ?? undefined}
                      isOwnMessage={message.senderRole === 'user'}
                    />
                  )}
                </div>
              </li>
            ))}
            <div ref={messagesEndRef} />
          </ul>
        )}
      </div>

      <form ref={formRef} action={formAction} className="space-y-3">
        <textarea
          ref={textareaRef}
          name="body"
          rows={3}
          maxLength={1000}
          placeholder="Descreva sua dúvida ou solicitação..."
          className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
          disabled={pending || isUploading}
        />

        {uploadState.status === 'error' && uploadState.error && (
          <p className="text-sm text-rose-300" role="status">
            {uploadState.error}
          </p>
        )}

        {state.status === 'error' && state.message ? (
          <p className="text-sm text-rose-300" role="status">
            {state.message}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <ChatAttachmentInput
            isUploading={isUploading}
            onFileSelect={handleFileSelect}
            previewUrl={pendingAttachment?.url}
            previewType={pendingAttachment?.type}
            previewName={pendingAttachment?.name}
            onClearPreview={handleClearAttachment}
            disabled={pending}
          />

          <Button type="submit" disabled={pending || isUploading} className="rounded-full px-6">
            {pending ? 'Enviando…' : 'Enviar mensagem'}
          </Button>

          {state.status === 'success' && state.message ? (
            <span className="text-sm text-emerald-300" role="status">
              {state.message}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}
