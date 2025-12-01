import type { AutoReplyStrategy, AutoReplyContext, AutoReplyResult } from './types';
import type { ChatService } from '@/modules/chat/services/chatService';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

type AutoReplyServiceDependencies = {
  chatService: ChatService;
  strategies: AutoReplyStrategy[];
};

export class AutoReplyService {
  private readonly chatService: ChatService;
  private readonly strategies: AutoReplyStrategy[];

  constructor({ chatService, strategies }: AutoReplyServiceDependencies) {
    this.chatService = chatService;
    this.strategies = strategies;
  }

  async processMessage(context: AutoReplyContext): Promise<void> {
    for (const strategy of this.strategies) {
      if (!strategy.shouldReply(context)) {
        continue;
      }

      const reply = strategy.generateReply(context);
      await this.sendAutoReply(context.thread.id, reply);
      break;
    }
  }

  private async sendAutoReply(threadId: string, reply: AutoReplyResult): Promise<void> {
    if (reply.delayMs && reply.delayMs > 0) {
      await this.delay(reply.delayMs);
    }

    await this.chatService.appendMessage({
      threadId,
      userId: SYSTEM_USER_ID,
      role: 'admin',
      body: reply.body,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
