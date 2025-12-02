import type { ChatMessage } from '@/modules/chat/types';

export type ChatActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  threadId?: string;
  lastMessage?: ChatMessage;
  timestamp?: number;
};

export const chatActionInitialState: ChatActionState = {
  status: 'idle',
};
