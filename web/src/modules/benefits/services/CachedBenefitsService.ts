import { globalCache, buildCacheKey } from '@/lib/cache';
import { BenefitsService } from './benefitsService';
import type { BenefitType, VipLevel } from '../types';

const CACHE_KEYS = {
  BENEFIT_TYPES: 'benefit_types:active',
  VIP_LEVEL: 'vip_level',
} as const;

const TTL = {
  BENEFIT_TYPES_MS: 5 * 60 * 1000,
  VIP_LEVEL_MS: 30 * 1000,
} as const;

export class CachedBenefitsService {
  static async getAvailableBenefitTypes(): Promise<BenefitType[]> {
    const cacheKey = CACHE_KEYS.BENEFIT_TYPES;
    const cached = globalCache.get<BenefitType[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await BenefitsService.getAvailableBenefitTypes();
    globalCache.set(cacheKey, data, TTL.BENEFIT_TYPES_MS);

    return data;
  }

  static async getVipLevel(userId: string): Promise<VipLevel> {
    const cacheKey = buildCacheKey(CACHE_KEYS.VIP_LEVEL, userId);
    const cached = globalCache.get<VipLevel>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await BenefitsService.getVipLevel(userId);
    globalCache.set(cacheKey, data, TTL.VIP_LEVEL_MS);

    return data;
  }

  static invalidateBenefitTypes(): void {
    globalCache.del(CACHE_KEYS.BENEFIT_TYPES);
  }

  static invalidateVipLevel(userId: string): void {
    const cacheKey = buildCacheKey(CACHE_KEYS.VIP_LEVEL, userId);
    globalCache.del(cacheKey);
  }
}
