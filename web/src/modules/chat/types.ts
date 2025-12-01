export type ChatThreadStatus = 'open' | 'closed';

export type ChatMessageRole = 'user' | 'admin';

export type AttachmentType = 'image' | 'document';

export type ChatThreadMetadata = {
  notes?: string | null;
  tags?: string[];
  lastAgentName?: string | null;
};

export type ChatThread = {
  id: string;
  userId: string | null;
  status: ChatThreadStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closedBy: string | null;
  assignedAdminId: string | null;
  metadata: ChatThreadMetadata;
};

export type ChatMessage = {
  id: number;
  threadId: string;
  userId: string | null;
  senderRole: ChatMessageRole;
  body: string;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentType?: AttachmentType | null;
  attachmentName?: string | null;
};
