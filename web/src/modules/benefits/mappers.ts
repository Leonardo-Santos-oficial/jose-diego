import type { BenefitType, UserBenefit, BenefitStatus, BenefitCategory, BenefitRewardType } from './types';

interface BenefitTypeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  reward_type: string;
  reward_value: number;
  min_level: number;
  max_claims: number;
  cooldown_hours: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
}

interface UserBenefitRow {
  id: string;
  user_id: string;
  benefit_type_id: string;
  status: string;
  claimed_at: string | null;
  reward_amount: number | null;
  expires_at: string | null;
  created_at: string;
  benefit_types?: BenefitTypeRow;
}

export function mapToBenefitType(row: BenefitTypeRow): BenefitType {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    category: row.category as BenefitCategory,
    rewardType: row.reward_type as BenefitRewardType,
    rewardValue: row.reward_value,
    minLevel: row.min_level,
    maxClaims: row.max_claims,
    cooldownHours: row.cooldown_hours,
    isActive: row.is_active,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
  };
}

export function mapToUserBenefit(row: UserBenefitRow): UserBenefit {
  return {
    id: row.id,
    userId: row.user_id,
    benefitTypeId: row.benefit_type_id,
    benefitType: row.benefit_types ? mapToBenefitType(row.benefit_types) : undefined,
    status: row.status as BenefitStatus,
    claimedAt: row.claimed_at,
    rewardAmount: row.reward_amount,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
