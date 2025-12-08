import type { CacheConfig, CacheEntry, CacheStats, CacheStore } from './types';

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 1000;
const DEBUG = process.env.NODE_ENV === 'development';

export class MemoryCache implements CacheStore {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly config: Required<CacheConfig>;
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtlMs: config.defaultTtlMs ?? DEFAULT_TTL_MS,
      maxEntries: config.maxEntries ?? DEFAULT_MAX_ENTRIES,
      onEvict: config.onEvict ?? (() => {}),
    };
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      if (DEBUG) console.log(`[CACHE MISS] ${key}`);
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.del(key);
      this.stats.misses++;
      if (DEBUG) console.log(`[CACHE EXPIRED] ${key}`);
      return undefined;
    }

    this.stats.hits++;
    if (DEBUG) console.log(`[CACHE HIT] ${key}`);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.evictIfNeeded();

    const expiresAt = Date.now() + (ttlMs ?? this.config.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
    this.stats.size = this.store.size;
    if (DEBUG) console.log(`[CACHE SET] ${key} (TTL: ${ttlMs ?? this.config.defaultTtlMs}ms)`);
  }

  del(key: string): boolean {
    const existed = this.store.delete(key);
    if (existed) {
      this.config.onEvict(key);
      this.stats.size = this.store.size;
    }
    return existed;
  }

  clear(): void {
    this.store.clear();
    this.stats.size = 0;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.del(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.store.size;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private evictIfNeeded(): void {
    if (this.store.size < this.config.maxEntries) return;

    const keysToDelete: string[] = [];
    const now = Date.now();

    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.del(key);
    }

    if (this.store.size >= this.config.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.del(oldestKey);
    }
  }
}
