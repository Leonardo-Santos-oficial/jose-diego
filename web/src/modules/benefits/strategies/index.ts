import type { BenefitCategory, UserBenefit, VipLevel } from '../types';
import {
  type BenefitStrategy,
  type BenefitEligibilityResult,
  WelcomeBonusStrategy,
  DailyBonusStrategy,
  CashbackStrategy,
  VipBonusStrategy,
  PromoBonusStrategy,
} from './benefitStrategies';

const strategyMap: Record<BenefitCategory, BenefitStrategy> = {
  welcome: new WelcomeBonusStrategy(),
  daily: new DailyBonusStrategy(),
  cashback: new CashbackStrategy(),
  vip: new VipBonusStrategy(),
  promo: new PromoBonusStrategy(),
};

export function getStrategyForCategory(category: BenefitCategory): BenefitStrategy {
  return strategyMap[category];
}

export function checkBenefitEligibility(
  benefit: UserBenefit,
  vipLevel: VipLevel
): BenefitEligibilityResult {
  const category = benefit.benefitType?.category ?? 'promo';
  const strategy = getStrategyForCategory(category);
  return strategy.checkEligibility(benefit, vipLevel);
}

export { type BenefitStrategy, type BenefitEligibilityResult };
