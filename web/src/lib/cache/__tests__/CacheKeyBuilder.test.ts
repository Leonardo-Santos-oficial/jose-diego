import { describe, it, expect } from 'vitest';
import { CacheKeyBuilder, buildCacheKey } from '../CacheKeyBuilder';

describe('CacheKeyBuilder', () => {
  describe('buildCacheKey function', () => {
    it('builds key with namespace only', () => {
      expect(buildCacheKey('users')).toBe('users');
    });

    it('builds key with namespace and args', () => {
      expect(buildCacheKey('users', 123)).toBe('users:123');
    });

    it('builds key with multiple args', () => {
      expect(buildCacheKey('users', 'active', 10)).toBe('users:active:10');
    });

    it('filters undefined and null values', () => {
      expect(buildCacheKey('users', undefined, 123, null)).toBe('users:123');
    });
  });

  describe('CacheKeyBuilder class', () => {
    it('builds key with namespace', () => {
      const key = CacheKeyBuilder.create('benefit_types').build();
      expect(key).toBe('benefit_types');
    });

    it('builds key with named parameters', () => {
      const key = CacheKeyBuilder.create('users')
        .with('status', 'active')
        .with('limit', 10)
        .build();

      expect(key).toBe('users:status:active:limit:10');
    });

    it('builds key with append', () => {
      const key = CacheKeyBuilder.create('vip_level').append('user-123').build();
      expect(key).toBe('vip_level:user-123');
    });

    it('ignores null and undefined values', () => {
      const key = CacheKeyBuilder.create('test')
        .with('a', null)
        .with('b', undefined)
        .with('c', 'valid')
        .build();

      expect(key).toBe('test:c:valid');
    });
  });
});
