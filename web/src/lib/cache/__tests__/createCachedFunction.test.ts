import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCachedFunction } from '../createCachedFunction';
import { MemoryCache } from '../MemoryCache';

describe('createCachedFunction', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ defaultTtlMs: 5000 });
  });

  it('calls original function on cache miss', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const cached = createCachedFunction(fn, cache, {
      keyGenerator: () => 'test-key',
      ttlMs: 1000,
    });

    const result = await cached();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  it('returns cached value on cache hit', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const cached = createCachedFunction(fn, cache, {
      keyGenerator: () => 'test-key',
      ttlMs: 1000,
    });

    await cached();
    await cached();
    await cached();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses keyGenerator to create cache keys', async () => {
    const fn = vi.fn().mockImplementation((id: string) => Promise.resolve(`data-${id}`));
    const cached = createCachedFunction(fn, cache, {
      keyGenerator: (id: string) => `user:${id}`,
      ttlMs: 1000,
    });

    await cached('123');
    await cached('456');
    await cached('123');

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith('123');
    expect(fn).toHaveBeenCalledWith('456');
  });

  it('respects TTL', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const cached = createCachedFunction(fn, cache, {
      keyGenerator: () => 'test-key',
      ttlMs: 50,
    });

    await cached();
    expect(fn).toHaveBeenCalledTimes(1);

    await new Promise((r) => setTimeout(r, 60));

    await cached();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
