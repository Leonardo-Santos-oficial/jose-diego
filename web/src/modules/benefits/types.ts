export type BenefitCategory = 'welcome' | 'daily' | 'cashback' | 'vip' | 'promo';
export type BenefitRewardType = 'fixed' | 'percentage' | 'multiplier';
export type BenefitStatus = 'locked' | 'available' | 'claimed' | 'expired';

export interface BenefitType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: BenefitCategory;
  rewardType: BenefitRewardType;
  rewardValue: number;
  minLevel: number;
  maxClaims: number;
  cooldownHours: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
}

export interface UserBenefit {
  id: string;
  userId: string;
  benefitTypeId: string;
  benefitType?: BenefitType;
  status: BenefitStatus;
  claimedAt: string | null;
  rewardAmount: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface VipLevel {
  userId: string;
  level: number;
  totalWagered: number;
  totalDeposited: number;
  points: number;
  levelUpdatedAt: string;
}

export interface VipTier {
  level: number;
  name: string;
  minWagered: number;
  benefits: string[];
  cashbackRate: number;
  color: string;
  icon: string;
}

export const VIP_TIERS: VipTier[] = [
  { level: 0, name: 'Iniciante', minWagered: 0, benefits: ['Bônus de boas-vindas', 'Bônus diário'], cashbackRate: 0, color: 'slate', icon: '🌱' },
  { level: 1, name: 'Bronze', minWagered: 100, benefits: ['Cashback 5%', 'Bônus VIP Bronze'], cashbackRate: 5, color: 'amber', icon: '🥉' },
  { level: 2, name: 'Prata', minWagered: 1000, benefits: ['Cashback 7%', 'Bônus VIP Prata', 'Suporte prioritário'], cashbackRate: 7, color: 'zinc', icon: '🥈' },
  { level: 3, name: 'Ouro', minWagered: 5000, benefits: ['Cashback 10%', 'Bônus VIP Ouro', 'Saques expressos'], cashbackRate: 10, color: 'yellow', icon: '🥇' },
  { level: 4, name: 'Platina', minWagered: 20000, benefits: ['Cashback 12%', 'Bônus VIP Platina', 'Gerente dedicado'], cashbackRate: 12, color: 'cyan', icon: '💎' },
  { level: 5, name: 'Diamante', minWagered: 50000, benefits: ['Cashback 15%', 'Bônus VIP Diamante', 'Benefícios exclusivos'], cashbackRate: 15, color: 'violet', icon: '👑' },
];

export interface ClaimBenefitResult {
  success: boolean;
  rewardAmount: number;
  newBalance: number;
  message: string;
}

export interface BenefitsSummary {
  vipLevel: VipLevel;
  currentTier: VipTier;
  nextTier: VipTier | null;
  progressToNextLevel: number;
  availableBenefits: UserBenefit[];
  claimedBenefits: UserBenefit[];
  totalEarned: number;
}
