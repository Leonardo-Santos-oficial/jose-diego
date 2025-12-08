import { globalCache, buildCacheKey } from '@/lib/cache';
import type { GameHistoryEntry } from '@/types/aviator';
import type { EngineStateRepository } from './engineStateRepository';

const CACHE_KEYS = {
  GAME_HISTORY: 'game_history',
} as const;

const TTL = {
  GAME_HISTORY_MS: 10 * 1000,
} as const;

export class CachedEngineStateRepository implements Partial<EngineStateRepository> {
  constructor(private readonly repository: EngineStateRepository) {}

  async fetchHistory(limit: number): Promise<GameHistoryEntry[]> {
    const cacheKey = buildCacheKey(CACHE_KEYS.GAME_HISTORY, limit);
    const cached = globalCache.get<GameHistoryEntry[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await this.repository.fetchHistory(limit);
    globalCache.set(cacheKey, data, TTL.GAME_HISTORY_MS);

    return data;
  }

  static invalidateHistory(limit?: number): void {
    if (limit !== undefined) {
      const cacheKey = buildCacheKey(CACHE_KEYS.GAME_HISTORY, limit);
      globalCache.del(cacheKey);
    }
  }
}

export function withHistoryCache<T extends EngineStateRepository>(repository: T): T {
  const cachedRepo = new CachedEngineStateRepository(repository);

  return new Proxy(repository, {
    get(target, prop) {
      if (prop === 'fetchHistory') {
        return cachedRepo.fetchHistory.bind(cachedRepo);
      }
      return Reflect.get(target, prop);
    },
  }) as T;
}
