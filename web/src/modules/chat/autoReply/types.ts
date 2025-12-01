import type { ChatMessage, ChatThread } from '@/modules/chat/types';

export type AutoReplyContext = {
  thread: ChatThread;
  message: ChatMessage;
  userName: string;
};

export type AutoReplyResult = {
  body: string;
  delayMs?: number;
};

export interface AutoReplyStrategy {
  shouldReply(context: AutoReplyContext): boolean;
  generateReply(context: AutoReplyContext): AutoReplyResult;
}
