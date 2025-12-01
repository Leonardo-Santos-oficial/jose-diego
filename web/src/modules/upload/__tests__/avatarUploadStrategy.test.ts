import { describe, it, expect } from 'vitest';
import { AvatarUploadStrategy } from '../strategies/avatarUploadStrategy';

describe('AvatarUploadStrategy', () => {
  const strategy = new AvatarUploadStrategy();

  describe('generatePath', () => {
    it('should generate path with userId as folder', () => {
      const userId = 'user-123-abc';
      const fileName = 'photo.jpg';
      
      const path = strategy.generatePath(userId, fileName);
      
      expect(path).toMatch(/^user-123-abc\/avatar-\d+\.jpg$/);
    });

    it('should include timestamp in filename', () => {
      const userId = 'user-456';
      const fileName = 'image.png';
      
      const before = Date.now();
      const path = strategy.generatePath(userId, fileName);
      const after = Date.now();
      
      const timestampMatch = path.match(/avatar-(\d+)\./);
      expect(timestampMatch).not.toBeNull();
      
      const timestamp = parseInt(timestampMatch![1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should preserve file extension', () => {
      const userId = 'user-789';
      
      expect(strategy.generatePath(userId, 'photo.jpg')).toMatch(/\.jpg$/);
      expect(strategy.generatePath(userId, 'photo.png')).toMatch(/\.png$/);
      expect(strategy.generatePath(userId, 'photo.webp')).toMatch(/\.webp$/);
      expect(strategy.generatePath(userId, 'photo.gif')).toMatch(/\.gif$/);
    });

    it('should use filename as extension if no dot present', () => {
      const userId = 'user-000';
      const fileName = 'photo';
      
      const path = strategy.generatePath(userId, fileName);
      
      // When there's no dot, pop() returns the whole filename
      expect(path).toMatch(/\.photo$/);
    });

    it('should handle UUID-style userIds', () => {
      const userId = '96564d0c-1ed2-4273-8b91-f4476f6027d8';
      const fileName = 'avatar.png';
      
      const path = strategy.generatePath(userId, fileName);
      
      expect(path).toMatch(/^96564d0c-1ed2-4273-8b91-f4476f6027d8\/avatar-\d+\.png$/);
    });
  });
});
