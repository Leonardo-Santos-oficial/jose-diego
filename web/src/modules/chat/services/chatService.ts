import { getSupabaseServerClient } from '@/lib/supabase/serverClient';
import type {
  AttachmentType,
  ChatMessage,
  ChatMessageRole,
  ChatThread,
  ChatThreadMetadata,
  ChatThreadStatus,
} from '@/modules/chat/types';

const DEFAULT_LIMIT = 50;

type SupabaseClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

type ClientFactory = () => Promise<SupabaseClient>;

export class ChatService {
  constructor(private readonly clientFactory: ClientFactory = getSupabaseServerClient) {}

  private async getClient() {
    return this.clientFactory();
  }

  async getOrCreateThread(userId: string): Promise<ChatThread> {
    const client = await this.getClient();

    const { data: existing, error: fetchError } = await client
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existing) {
      return this.toThread(existing);
    }

    const { data, error } = await client
      .from('chat_threads')
      .insert({ user_id: userId })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return this.toThread(data);
  }

  async getThreadById(threadId: string): Promise<ChatThread | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('chat_threads')
      .select('*')
      .eq('id', threadId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? this.toThread(data) : null;
  }

  async listMessages(threadId: string, limit = DEFAULT_LIMIT): Promise<ChatMessage[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => this.toMessage(row));
  }

  async appendMessage(options: {
    threadId: string;
    userId: string;
    role: ChatMessageRole;
    body: string;
    attachmentUrl?: string;
    attachmentType?: AttachmentType;
    attachmentName?: string;
  }): Promise<ChatMessage> {
    const client = await this.getClient();
    const payload: Record<string, unknown> = {
      thread_id: options.threadId,
      user_id: options.userId,
      sender_role: options.role,
      body: options.body,
    };

    if (options.attachmentUrl) {
      payload.attachment_url = options.attachmentUrl;
      payload.attachment_type = options.attachmentType ?? 'document';
      payload.attachment_name = options.attachmentName ?? null;
    }

    const { data, error } = await client
      .from('chat_messages')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    // Update thread's updated_at timestamp
    await client
      .from('chat_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', options.threadId);

    return this.toMessage(data);
  }

  async updateThreadStatus(
    threadId: string,
    status: ChatThreadStatus,
    options?: { closedBy?: string | null }
  ): Promise<ChatThread> {
    const client = await this.getClient();
    const updatePayload: Record<string, unknown> = { status };

    if (status === 'closed') {
      updatePayload.closed_at = new Date().toISOString();
      updatePayload.closed_by = options?.closedBy ?? null;
    } else {
      updatePayload.closed_at = null;
      updatePayload.closed_by = null;
    }

    const { data, error } = await client
      .from('chat_threads')
      .update(updatePayload)
      .eq('id', threadId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return this.toThread(data);
  }

  async listThreadsForAdmin(options?: {
    status?: ChatThreadStatus;
    limit?: number;
  }): Promise<ChatThread[]> {
    const client = await this.getClient();
    let query = client.from('chat_threads').select('*');

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('updated_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => this.toThread(row));
  }

  async listClosedThreads(options?: { limit?: number }): Promise<ChatThread[]> {
    const client = await this.getClient();
    const query = client
      .from('chat_threads')
      .select('*')
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(options?.limit ?? 50);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => this.toThread(row));
  }

  async updateThreadMetadata(threadId: string, metadata: Partial<ChatThreadMetadata>) {
    const current = await this.getThreadById(threadId);

    if (!current) {
      throw new Error('Thread não encontrada para atualizar metadados.');
    }

    const nextMetadata = {
      ...current.metadata,
      ...metadata,
    } satisfies ChatThreadMetadata;

    const client = await this.getClient();
    const { data, error } = await client
      .from('chat_threads')
      .update({ metadata: nextMetadata })
      .eq('id', threadId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return this.toThread(data);
  }

  async assignThread(threadId: string, adminId: string | null): Promise<ChatThread> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('chat_threads')
      .update({ assigned_admin_id: adminId })
      .eq('id', threadId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return this.toThread(data);
  }

  private toThread(row: Record<string, unknown>): ChatThread {
    return {
      id: String(row.id),
      userId: (row.user_id as string | null) ?? null,
      status: (row.status as ChatThread['status']) ?? 'open',
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      closedAt: (row.closed_at as string | null) ?? null,
      closedBy: (row.closed_by as string | null) ?? null,
      assignedAdminId: (row.assigned_admin_id as string | null) ?? null,
      metadata: (row.metadata as ChatThreadMetadata | null) ?? {},
    };
  }

  private toMessage(row: Record<string, unknown>): ChatMessage {
    return {
      id: Number(row.id),
      threadId: String(row.thread_id ?? ''),
      userId: (row.user_id as string | null) ?? null,
      senderRole: (row.sender_role as ChatMessage['senderRole']) ?? 'user',
      body: String(row.body ?? ''),
      createdAt: row.created_at as string,
      attachmentUrl: (row.attachment_url as string | null) ?? null,
      attachmentType: (row.attachment_type as AttachmentType | null) ?? null,
      attachmentName: (row.attachment_name as string | null) ?? null,
    };
  }
}
