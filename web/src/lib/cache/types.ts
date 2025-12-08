export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStore<T = unknown> {
  get<V = T>(key: string): V | undefined;
  set<V = T>(key: string, value: V, ttlMs?: number): void;
  del(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  size(): number;
}

export interface CacheConfig {
  defaultTtlMs: number;
  maxEntries?: number;
  onEvict?: (key: string) => void;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

export type CacheKeyGenerator<TArgs extends unknown[]> = (...args: TArgs) => string;

export interface CachedFunctionOptions<TArgs extends unknown[]> {
  keyGenerator: CacheKeyGenerator<TArgs>;
  ttlMs: number;
}
