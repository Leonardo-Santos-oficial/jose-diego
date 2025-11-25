import type {
  GlobalChatMessage,
  GlobalChatPublisher,
  GlobalChatRepository,
  SendGlobalMessageInput,
} from '../types';

export class SendGlobalMessageCommand {
  constructor(
    private readonly repository: GlobalChatRepository,
    private readonly publisher: GlobalChatPublisher
  ) {}

  async execute(input: SendGlobalMessageInput): Promise<GlobalChatMessage> {
    // 1. Validate input (Clean Code: Fail fast)
    if (!input.body || input.body.trim().length === 0) {
      throw new Error('Message body cannot be empty');
    }
    if (input.body.length > 500) {
      throw new Error('Message too long (max 500 chars)');
    }

    // 2. Persist message
    const message = await this.repository.saveMessage(input);

    // 3. Publish to realtime (Observer pattern via Publisher)
    await this.publisher.publishMessage(message);

    return message;
  }
}
