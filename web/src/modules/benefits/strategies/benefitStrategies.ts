import type { UserBenefit, BenefitType, VipLevel } from '../types';

export interface BenefitEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export interface BenefitStrategy {
  checkEligibility(benefit: UserBenefit, vipLevel: VipLevel): BenefitEligibilityResult;
  calculateReward(benefitType: BenefitType, context: RewardContext): number;
}

export interface RewardContext {
  baseAmount?: number;
  wageredAmount?: number;
  vipLevel: number;
}

export class WelcomeBonusStrategy implements BenefitStrategy {
  checkEligibility(benefit: UserBenefit, _vipLevel: VipLevel): BenefitEligibilityResult {
    if (benefit.status === 'claimed') {
      return { eligible: false, reason: 'Bônus de boas-vindas já foi resgatado' };
    }
    return { eligible: true };
  }

  calculateReward(benefitType: BenefitType, _context: RewardContext): number {
    return benefitType.rewardValue;
  }
}

export class DailyBonusStrategy implements BenefitStrategy {
  checkEligibility(benefit: UserBenefit, _vipLevel: VipLevel): BenefitEligibilityResult {
    if (benefit.status === 'claimed' && benefit.claimedAt) {
      const lastClaim = new Date(benefit.claimedAt);
      const now = new Date();
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastClaim < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastClaim);
        return { eligible: false, reason: `Disponível em ${hoursRemaining}h` };
      }
    }
    return { eligible: true };
  }

  calculateReward(benefitType: BenefitType, context: RewardContext): number {
    const levelMultiplier = 1 + (context.vipLevel * 0.1);
    return benefitType.rewardValue * levelMultiplier;
  }
}

export class CashbackStrategy implements BenefitStrategy {
  checkEligibility(benefit: UserBenefit, vipLevel: VipLevel): BenefitEligibilityResult {
    const minLevel = benefit.benefitType?.minLevel ?? 1;
    if (vipLevel.level < minLevel) {
      return { eligible: false, reason: `Requer nível VIP ${minLevel}` };
    }
    return { eligible: true };
  }

  calculateReward(benefitType: BenefitType, context: RewardContext): number {
    if (benefitType.rewardType === 'percentage' && context.wageredAmount) {
      return (context.wageredAmount * benefitType.rewardValue) / 100;
    }
    return benefitType.rewardValue;
  }
}

export class VipBonusStrategy implements BenefitStrategy {
  checkEligibility(benefit: UserBenefit, vipLevel: VipLevel): BenefitEligibilityResult {
    const minLevel = benefit.benefitType?.minLevel ?? 1;
    if (vipLevel.level < minLevel) {
      return { eligible: false, reason: `Requer nível VIP ${minLevel}` };
    }
    if (benefit.status === 'claimed') {
      return { eligible: false, reason: 'Bônus VIP já foi resgatado' };
    }
    return { eligible: true };
  }

  calculateReward(benefitType: BenefitType, _context: RewardContext): number {
    return benefitType.rewardValue;
  }
}

export class PromoBonusStrategy implements BenefitStrategy {
  checkEligibility(benefit: UserBenefit, _vipLevel: VipLevel): BenefitEligibilityResult {
    if (benefit.expiresAt) {
      const expires = new Date(benefit.expiresAt);
      if (expires < new Date()) {
        return { eligible: false, reason: 'Promoção expirada' };
      }
    }
    if (benefit.status === 'claimed') {
      return { eligible: false, reason: 'Promoção já foi resgatada' };
    }
    return { eligible: true };
  }

  calculateReward(benefitType: BenefitType, _context: RewardContext): number {
    return benefitType.rewardValue;
  }
}
