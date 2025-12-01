import { ChatService } from '@/modules/chat/services/chatService';
import type { ChatMessage, ChatThread, AttachmentType } from '@/modules/chat/types';
import { AutoReplyService, WelcomeAutoReplyStrategy } from '@/modules/chat/autoReply';

type SendMessageResult = {
  thread: ChatThread;
  message: ChatMessage;
};

type MessageAttachment = {
  attachmentUrl?: string;
  attachmentType?: AttachmentType;
  attachmentName?: string;
};

type SendChatMessageCommandDeps = {
  chatService?: ChatService;
  autoReplyService?: AutoReplyService;
};

export class SendChatMessageCommand {
  private readonly chatService: ChatService;
  private readonly autoReplyService: AutoReplyService;

  constructor(deps: SendChatMessageCommandDeps = {}) {
    this.chatService = deps.chatService ?? new ChatService();
    this.autoReplyService = deps.autoReplyService ?? new AutoReplyService({
      chatService: this.chatService,
      strategies: [new WelcomeAutoReplyStrategy()],
    });
  }

  async executeForUser(params: {
    userId: string;
    body: string;
    userName?: string;
  } & MessageAttachment): Promise<SendMessageResult> {
    const thread = await this.chatService.getOrCreateThread(params.userId);
    const isFirstMessage = await this.isFirstUserMessage(thread.id, params.userId);
    
    const message = await this.chatService.appendMessage({
      threadId: thread.id,
      userId: params.userId,
      role: 'user',
      body: params.body,
      attachmentUrl: params.attachmentUrl,
      attachmentType: params.attachmentType,
      attachmentName: params.attachmentName,
    });

    if (isFirstMessage) {
      this.triggerAutoReply(thread, message, params.userName ?? 'Usuário');
    }

    return { thread, message };
  }

  async executeForAdmin(params: {
    threadId: string;
    body: string;
  } & MessageAttachment): Promise<SendMessageResult> {
    const thread = await this.chatService.getThreadById(params.threadId);

    if (!thread || !thread.userId) {
      throw new Error('Thread inválida ou sem usuário associado.');
    }

    const message = await this.chatService.appendMessage({
      threadId: thread.id,
      userId: thread.userId,
      role: 'admin',
      body: params.body,
      attachmentUrl: params.attachmentUrl,
      attachmentType: params.attachmentType,
      attachmentName: params.attachmentName,
    });

    return { thread, message };
  }

  private async isFirstUserMessage(threadId: string, userId: string): Promise<boolean> {
    const messages = await this.chatService.listMessages(threadId, 10);
    const userMessages = messages.filter(
      (m) => m.senderRole === 'user' && m.userId === userId
    );
    return userMessages.length === 1;
  }

  private triggerAutoReply(thread: ChatThread, message: ChatMessage, userName: string): void {
    void this.autoReplyService.processMessage({ thread, message, userName });
  }
}
