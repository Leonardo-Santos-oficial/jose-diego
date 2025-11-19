import { ChatService } from '@/modules/chat/services/chatService';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';

export type UserChatSnapshot = {
  thread: ChatThread;
  messages: ChatMessage[];
};

const chatService = new ChatService();

export async function getUserChatSnapshot(userId: string): Promise<UserChatSnapshot> {
  const thread = await chatService.getOrCreateThread(userId);
  const messages = await chatService.listMessages(thread.id);

  return { thread, messages };
}
