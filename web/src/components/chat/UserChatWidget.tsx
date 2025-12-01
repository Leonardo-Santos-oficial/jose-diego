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
  const inputRef = useRef<HTMLInputElement>(null);
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
        inputRef.current?.focus();
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-slate-400 text-sm">
              Olá {userName}! 👋
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Como podemos ajudar você hoje?
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {uploadState.status === 'error' && uploadState.error && (
        <p className="px-4 text-sm text-rose-300">{uploadState.error}</p>
      )}

      {state.status === 'error' && state.message && (
        <p className="px-4 text-sm text-rose-300">{state.message}</p>
      )}

      <form ref={formRef} action={formAction} className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2">
          <ChatAttachmentInput
            isUploading={isUploading}
            onFileSelect={handleFileSelect}
            previewUrl={pendingAttachment?.url}
            previewType={pendingAttachment?.type}
            previewName={pendingAttachment?.name}
            onClearPreview={handleClearAttachment}
            disabled={pending}
          />
          <input
            ref={inputRef}
            name="body"
            type="text"
            maxLength={1000}
            placeholder="Digite sua mensagem..."
            autoComplete="off"
            className="flex-1 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
            disabled={pending || isUploading}
          />
          <Button
            type="submit"
            disabled={pending || isUploading}
            size="sm"
            className="rounded-full h-10 w-10 p-0"
          >
            {pending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.senderRole === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-teal-500 text-white rounded-br-md'
            : 'bg-slate-800 text-slate-100 rounded-bl-md'
        }`}
      >
        {message.body && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
        )}
        {message.attachmentUrl && message.attachmentType && (
          <ChatMessageAttachment
            attachmentUrl={message.attachmentUrl}
            attachmentType={message.attachmentType}
            attachmentName={message.attachmentName ?? undefined}
            isOwnMessage={isUser}
          />
        )}
        <span className={`text-[10px] mt-1 block ${isUser ? 'text-teal-100' : 'text-slate-500'}`}>
          {dateFormatter.format(new Date(message.createdAt))}
        </span>
      </div>
    </div>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
