import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCache } from '../MemoryCache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ defaultTtlMs: 1000, maxEntries: 10 });
  });

  describe('get/set', () => {
    it('returns undefined for missing key', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('stores and retrieves value', () => {
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    it('stores complex objects', () => {
      const obj = { id: 1, data: [1, 2, 3] };
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);
    });
  });

  describe('TTL expiration', () => {
    it('returns value before expiration', () => {
      cache.set('key', 'value', 100);
      expect(cache.get('key')).toBe('value');
    });

    it('returns undefined after expiration', async () => {
      cache.set('key', 'value', 50);
      await new Promise((r) => setTimeout(r, 60));
      expect(cache.get('key')).toBeUndefined();
    });
  });

  describe('del', () => {
    it('removes existing key', () => {
      cache.set('key', 'value');
      expect(cache.del('key')).toBe(true);
      expect(cache.get('key')).toBeUndefined();
    });

    it('returns false for missing key', () => {
      expect(cache.del('missing')).toBe(false);
    });
  });

  describe('has', () => {
    it('returns true for existing key', () => {
      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);
    });

    it('returns false for missing key', () => {
      expect(cache.has('missing')).toBe(false);
    });

    it('returns false for expired key', async () => {
      cache.set('key', 'value', 50);
      await new Promise((r) => setTimeout(r, 60));
      expect(cache.has('key')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('maxEntries eviction', () => {
    it('evicts oldest entry when max reached', () => {
      const smallCache = new MemoryCache({ maxEntries: 3 });
      smallCache.set('a', 1);
      smallCache.set('b', 2);
      smallCache.set('c', 3);
      smallCache.set('d', 4);

      expect(smallCache.size()).toBeLessThanOrEqual(3);
    });
  });

  describe('stats', () => {
    it('tracks hits and misses', () => {
      cache.set('key', 'value');
      cache.get('key');
      cache.get('key');
      cache.get('missing');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('calculates hit rate', () => {
      cache.set('key', 'value');
      cache.get('key');
      cache.get('key');
      cache.get('missing');

      expect(cache.getHitRate()).toBeCloseTo(0.67, 1);
    });
  });
});
