import type { CacheStore, CachedFunctionOptions } from './types';

export function createCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  cache: CacheStore,
  options: CachedFunctionOptions<TArgs>
): (...args: TArgs) => Promise<TResult> {
  const { keyGenerator, ttlMs } = options;

  return async (...args: TArgs): Promise<TResult> => {
    const cacheKey = keyGenerator(...args);
    const cached = cache.get<TResult>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(cacheKey, result, ttlMs);

    return result;
  };
}
