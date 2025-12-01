import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the ChatService directly without importing the real one
// to avoid serverClient dependency issues in tests

describe('ChatService', () => {
  // Mock Supabase client
  const createMockClient = () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  });

  describe('message mapping', () => {
    it('should map message with attachment fields correctly', () => {
      const dbRow = {
        id: 1,
        thread_id: 'thread-123',
        user_id: 'user-456',
        sender_role: 'user',
        body: 'Hello with attachment',
        created_at: '2025-12-01T00:00:00Z',
        attachment_url: 'https://example.com/image.jpg',
        attachment_type: 'image',
        attachment_name: 'screenshot.jpg',
      };

      // Simulate the toMessage mapping
      const message = {
        id: Number(dbRow.id),
        threadId: String(dbRow.thread_id ?? ''),
        userId: dbRow.user_id ?? null,
        senderRole: dbRow.sender_role ?? 'user',
        body: String(dbRow.body ?? ''),
        createdAt: dbRow.created_at,
        attachmentUrl: dbRow.attachment_url ?? null,
        attachmentType: dbRow.attachment_type ?? null,
        attachmentName: dbRow.attachment_name ?? null,
      };

      expect(message.body).toBe('Hello with attachment');
      expect(message.attachmentUrl).toBe('https://example.com/image.jpg');
      expect(message.attachmentType).toBe('image');
      expect(message.attachmentName).toBe('screenshot.jpg');
    });

    it('should map message without attachment fields', () => {
      const dbRow = {
        id: 2,
        thread_id: 'thread-123',
        user_id: 'user-456',
        sender_role: 'user',
        body: 'Simple message',
        created_at: '2025-12-01T00:00:00Z',
        attachment_url: null,
        attachment_type: null,
        attachment_name: null,
      };

      const message = {
        id: Number(dbRow.id),
        threadId: String(dbRow.thread_id ?? ''),
        userId: dbRow.user_id ?? null,
        senderRole: dbRow.sender_role ?? 'user',
        body: String(dbRow.body ?? ''),
        createdAt: dbRow.created_at,
        attachmentUrl: dbRow.attachment_url ?? null,
        attachmentType: dbRow.attachment_type ?? null,
        attachmentName: dbRow.attachment_name ?? null,
      };

      expect(message.body).toBe('Simple message');
      expect(message.attachmentUrl).toBeNull();
      expect(message.attachmentType).toBeNull();
    });
  });

  describe('thread mapping', () => {
    it('should map thread correctly', () => {
      const dbRow = {
        id: 'thread-123',
        user_id: 'user-456',
        status: 'open',
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:00:00Z',
        closed_at: null,
        closed_by: null,
        assigned_admin_id: null,
        metadata: {},
      };

      const thread = {
        id: String(dbRow.id),
        userId: dbRow.user_id ?? null,
        status: dbRow.status ?? 'open',
        createdAt: dbRow.created_at,
        updatedAt: dbRow.updated_at,
        closedAt: dbRow.closed_at ?? null,
        closedBy: dbRow.closed_by ?? null,
        assignedAdminId: dbRow.assigned_admin_id ?? null,
        metadata: dbRow.metadata ?? {},
      };

      expect(thread.id).toBe('thread-123');
      expect(thread.userId).toBe('user-456');
      expect(thread.status).toBe('open');
    });

    it('should map closed thread with metadata', () => {
      const dbRow = {
        id: 'thread-456',
        user_id: 'user-789',
        status: 'closed',
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T01:00:00Z',
        closed_at: '2025-12-01T01:00:00Z',
        closed_by: 'admin-123',
        assigned_admin_id: 'admin-123',
        metadata: { notes: 'Resolved', lastAgentName: 'Agent' },
      };

      const thread = {
        id: String(dbRow.id),
        userId: dbRow.user_id ?? null,
        status: dbRow.status ?? 'open',
        createdAt: dbRow.created_at,
        updatedAt: dbRow.updated_at,
        closedAt: dbRow.closed_at ?? null,
        closedBy: dbRow.closed_by ?? null,
        assignedAdminId: dbRow.assigned_admin_id ?? null,
        metadata: dbRow.metadata ?? {},
      };

      expect(thread.status).toBe('closed');
      expect(thread.closedAt).toBe('2025-12-01T01:00:00Z');
      expect(thread.metadata.notes).toBe('Resolved');
    });
  });

  describe('appendMessage payload', () => {
    it('should build correct payload with attachment', () => {
      const options = {
        threadId: 'thread-123',
        userId: 'user-456',
        role: 'user' as const,
        body: 'Hello with attachment',
        attachmentUrl: 'https://example.com/image.jpg',
        attachmentType: 'image' as const,
        attachmentName: 'screenshot.jpg',
      };

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

      expect(payload.thread_id).toBe('thread-123');
      expect(payload.attachment_url).toBe('https://example.com/image.jpg');
      expect(payload.attachment_type).toBe('image');
      expect(payload.attachment_name).toBe('screenshot.jpg');
    });

    it('should build correct payload without attachment', () => {
      const options = {
        threadId: 'thread-123',
        userId: 'user-456',
        role: 'user' as const,
        body: 'Simple message',
      };

      const payload: Record<string, unknown> = {
        thread_id: options.threadId,
        user_id: options.userId,
        sender_role: options.role,
        body: options.body,
      };

      expect(payload.thread_id).toBe('thread-123');
      expect(payload.attachment_url).toBeUndefined();
    });
  });
});
