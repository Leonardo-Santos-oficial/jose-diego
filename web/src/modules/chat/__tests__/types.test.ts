import { describe, it, expect } from 'vitest';
import type { ChatMessage, ChatThread, AttachmentType } from '../types';

describe('Chat Types', () => {
  describe('ChatMessage type', () => {
    it('should accept message with attachment fields', () => {
      const message: ChatMessage = {
        id: 1,
        threadId: 'thread-123',
        userId: 'user-456',
        senderRole: 'user',
        body: 'Test message',
        createdAt: '2025-12-01T00:00:00Z',
        attachmentUrl: 'https://example.com/image.jpg',
        attachmentType: 'image',
        attachmentName: 'screenshot.jpg',
      };

      expect(message.attachmentUrl).toBe('https://example.com/image.jpg');
      expect(message.attachmentType).toBe('image');
      expect(message.attachmentName).toBe('screenshot.jpg');
    });

    it('should accept message without attachment fields', () => {
      const message: ChatMessage = {
        id: 2,
        threadId: 'thread-123',
        userId: 'user-456',
        senderRole: 'admin',
        body: 'Response from admin',
        createdAt: '2025-12-01T00:00:00Z',
      };

      expect(message.attachmentUrl).toBeUndefined();
      expect(message.attachmentType).toBeUndefined();
    });

    it('should accept null attachment fields', () => {
      const message: ChatMessage = {
        id: 3,
        threadId: 'thread-123',
        userId: null,
        senderRole: 'user',
        body: 'Message',
        createdAt: '2025-12-01T00:00:00Z',
        attachmentUrl: null,
        attachmentType: null,
        attachmentName: null,
      };

      expect(message.attachmentUrl).toBeNull();
    });
  });

  describe('AttachmentType', () => {
    it('should only allow "image" or "document"', () => {
      const imageType: AttachmentType = 'image';
      const documentType: AttachmentType = 'document';

      expect(imageType).toBe('image');
      expect(documentType).toBe('document');
    });
  });

  describe('ChatThread type', () => {
    it('should have all required fields', () => {
      const thread: ChatThread = {
        id: 'thread-123',
        userId: 'user-456',
        status: 'open',
        createdAt: '2025-12-01T00:00:00Z',
        updatedAt: '2025-12-01T00:00:00Z',
        closedAt: null,
        closedBy: null,
        assignedAdminId: null,
        metadata: {},
      };

      expect(thread.id).toBe('thread-123');
      expect(thread.status).toBe('open');
    });

    it('should accept closed thread with closedAt and closedBy', () => {
      const thread: ChatThread = {
        id: 'thread-456',
        userId: 'user-789',
        status: 'closed',
        createdAt: '2025-12-01T00:00:00Z',
        updatedAt: '2025-12-01T01:00:00Z',
        closedAt: '2025-12-01T01:00:00Z',
        closedBy: 'admin-123',
        assignedAdminId: 'admin-123',
        metadata: {
          notes: 'Resolved issue',
          lastAgentName: 'Support Agent',
        },
      };

      expect(thread.status).toBe('closed');
      expect(thread.closedAt).toBe('2025-12-01T01:00:00Z');
      expect(thread.metadata.notes).toBe('Resolved issue');
    });
  });
});
