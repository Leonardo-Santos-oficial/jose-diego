export interface GlobalChatMessage {
  id: string;
  userId: string;
  userName: string; // Denormalized for performance in chat
  body: string;
  createdAt: string;
}

export interface SendGlobalMessageInput {
  userId: string;
  userName: string;
  body: string;
}

export interface GlobalChatRepository {
  saveMessage(message: SendGlobalMessageInput): Promise<GlobalChatMessage>;
  fetchRecentMessages(limit: number): Promise<GlobalChatMessage[]>;
}

export interface GlobalChatPublisher {
  publishMessage(message: GlobalChatMessage): Promise<void>;
}
