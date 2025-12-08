import { MemoryCache } from './MemoryCache';

const globalForCache = globalThis as unknown as {
  __memoryCache: MemoryCache | undefined;
};

function createGlobalCache(): MemoryCache {
  return new MemoryCache({
    defaultTtlMs: 60_000,
    maxEntries: 500,
  });
}

export const globalCache: MemoryCache =
  globalForCache.__memoryCache ?? createGlobalCache();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.__memoryCache = globalCache;
}
