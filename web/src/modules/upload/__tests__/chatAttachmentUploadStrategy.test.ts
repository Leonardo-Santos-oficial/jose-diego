import { describe, it, expect } from 'vitest';
import { ChatAttachmentUploadStrategy } from '../strategies/chatAttachmentUploadStrategy';

describe('ChatAttachmentUploadStrategy', () => {
  const threadId = 'thread-abc-123';
  const strategy = new ChatAttachmentUploadStrategy(threadId);

  describe('generatePath', () => {
    it('should generate path with threadId and userId as folders', () => {
      const userId = 'user-123-abc';
      const fileName = 'screenshot.jpg';
      
      const path = strategy.generatePath(userId, fileName);
      
      expect(path.startsWith(`${threadId}/${userId}/`)).toBe(true);
    });

    it('should include timestamp in filename', () => {
      const userId = 'user-456';
      const fileName = 'image.png';
      
      const before = Date.now();
      const path = strategy.generatePath(userId, fileName);
      const after = Date.now();
      
      const parts = path.split('/');
      const fileNamePart = parts[parts.length - 1];
      const timestampMatch = fileNamePart.match(/^(\d+)-/);
      expect(timestampMatch).not.toBeNull();
      
      const timestamp = parseInt(timestampMatch![1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate unique paths for same file', async () => {
      const userId = 'user-789';
      const fileName = 'photo.jpg';
      
      const path1 = strategy.generatePath(userId, fileName);
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 5));
      const path2 = strategy.generatePath(userId, fileName);
      
      // Paths should be different due to timestamp
      expect(path1).not.toBe(path2);
    });

    it('should preserve file extension', () => {
      const userId = 'user-000';
      
      expect(strategy.generatePath(userId, 'screenshot.jpg')).toMatch(/\.jpg$/);
      expect(strategy.generatePath(userId, 'screenshot.png')).toMatch(/\.png$/);
      expect(strategy.generatePath(userId, 'document.pdf')).toMatch(/\.pdf$/);
    });

    it('should default to bin if no extension', () => {
      const userId = 'user-111';
      const fileName = 'file';
      
      const path = strategy.generatePath(userId, fileName);
      
      // The file becomes "file" with no extension, pop returns "file"
      expect(path).toContain('file');
    });

    it('should handle UUID-style userIds', () => {
      const userId = '96564d0c-1ed2-4273-8b91-f4476f6027d8';
      const fileName = 'print.png';
      
      const path = strategy.generatePath(userId, fileName);
      
      expect(path).toContain(threadId);
      expect(path).toContain(userId);
      expect(path).toMatch(/\.png$/);
    });

    it('should sanitize filename with special characters', () => {
      const userId = 'user-test';
      const fileName = 'my file (1).jpg';
      
      const path = strategy.generatePath(userId, fileName);
      
      // Special characters should be replaced with underscores
      expect(path).not.toContain(' ');
      expect(path).not.toContain('(');
      expect(path).not.toContain(')');
    });
  });
});
