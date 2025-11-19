import { ChatService } from '@/modules/chat/services/chatService';
import type { ChatMessage, ChatThread } from '@/modules/chat/types';

type SendMessageResult = {
  thread: ChatThread;
  message: ChatMessage;
};

export class SendChatMessageCommand {
  constructor(private readonly chatService: ChatService = new ChatService()) {}

  async executeForUser(params: {
    userId: string;
    body: string;
  }): Promise<SendMessageResult> {
    const thread = await this.chatService.getOrCreateThread(params.userId);
    const message = await this.chatService.appendMessage({
      threadId: thread.id,
      userId: params.userId,
      role: 'user',
      body: params.body,
    });

    return { thread, message };
  }

  async executeForAdmin(params: {
    threadId: string;
    body: string;
  }): Promise<SendMessageResult> {
    const thread = await this.chatService.getThreadById(params.threadId);

    if (!thread || !thread.userId) {
      throw new Error('Thread inválida ou sem usuário associado.');
    }

    const message = await this.chatService.appendMessage({
      threadId: thread.id,
      userId: thread.userId,
      role: 'admin',
      body: params.body,
    });

    return { thread, message };
  }
}
