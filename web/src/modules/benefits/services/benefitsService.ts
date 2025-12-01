import { getSupabaseServerClient } from '@/lib/supabase/serverClient';
import type { BenefitType, UserBenefit, VipLevel, ClaimBenefitResult, BenefitsSummary } from '../types';
import { VIP_TIERS } from '../types';
import { mapToBenefitType, mapToUserBenefit } from '../mappers';

export class BenefitsService {
  static async getAvailableBenefitTypes(): Promise<BenefitType[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('benefit_types')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw new Error(`Failed to fetch benefit types: ${error.message}`);
    return (data ?? []).map(mapToBenefitType);
  }

  static async getUserBenefits(userId: string): Promise<UserBenefit[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('user_benefits')
      .select('*, benefit_types(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch user benefits: ${error.message}`);
    return (data ?? []).map(mapToUserBenefit);
  }

  static async getVipLevel(userId: string): Promise<VipLevel> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .rpc('get_or_create_vip_level', { p_user_id: userId });

    if (error) throw new Error(`Failed to fetch VIP level: ${error.message}`);
    
    return {
      userId: data.user_id,
      level: data.level,
      totalWagered: data.total_wagered,
      totalDeposited: data.total_deposited,
      points: data.points,
      levelUpdatedAt: data.level_updated_at,
    };
  }

  static async initializeUserBenefits(userId: string): Promise<void> {
    const supabase = await getSupabaseServerClient();
    
    const benefitTypes = await this.getAvailableBenefitTypes();
    const existingBenefits = await this.getUserBenefits(userId);
    const existingTypeIds = new Set(existingBenefits.map(b => b.benefitTypeId));

    const welcomeAndDaily = benefitTypes.filter(
      bt => (bt.category === 'welcome' || bt.category === 'daily') && !existingTypeIds.has(bt.id)
    );

    if (welcomeAndDaily.length > 0) {
      const newBenefits = welcomeAndDaily.map(bt => ({
        user_id: userId,
        benefit_type_id: bt.id,
        status: 'available',
        reward_amount: bt.rewardValue,
      }));

      const { error } = await supabase.from('user_benefits').insert(newBenefits);
      if (error) throw new Error(`Failed to initialize benefits: ${error.message}`);
    }
  }

  static async claimBenefit(userId: string, userBenefitId: string): Promise<ClaimBenefitResult> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .rpc('claim_benefit', { p_user_id: userId, p_user_benefit_id: userBenefitId });

    if (error) throw new Error(`Failed to claim benefit: ${error.message}`);

    const result = Array.isArray(data) ? data[0] : data;
    return {
      success: result.success,
      rewardAmount: result.reward_amount,
      newBalance: result.new_balance,
      message: result.message,
    };
  }

  static async unlockVipBenefits(userId: string): Promise<void> {
    const supabase = await getSupabaseServerClient();
    const vipLevel = await this.getVipLevel(userId);
    const benefitTypes = await this.getAvailableBenefitTypes();
    const existingBenefits = await this.getUserBenefits(userId);
    const existingTypeIds = new Set(existingBenefits.map(b => b.benefitTypeId));

    const eligibleVipBenefits = benefitTypes.filter(
      bt => bt.category === 'vip' && bt.minLevel <= vipLevel.level && !existingTypeIds.has(bt.id)
    );

    if (eligibleVipBenefits.length > 0) {
      const newBenefits = eligibleVipBenefits.map(bt => ({
        user_id: userId,
        benefit_type_id: bt.id,
        status: 'available',
        reward_amount: bt.rewardValue,
      }));

      await supabase.from('user_benefits').insert(newBenefits);
    }
  }

  static async refreshDailyBonus(userId: string): Promise<void> {
    const supabase = await getSupabaseServerClient();
    const benefitTypes = await this.getAvailableBenefitTypes();
    const dailyBonusType = benefitTypes.find(bt => bt.code === 'daily_bonus');
    
    if (!dailyBonusType) return;

    const existingBenefits = await this.getUserBenefits(userId);
    const dailyBenefit = existingBenefits.find(b => b.benefitTypeId === dailyBonusType.id);

    if (dailyBenefit?.status === 'claimed' && dailyBenefit.claimedAt) {
      const lastClaim = new Date(dailyBenefit.claimedAt);
      const now = new Date();
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastClaim >= 24) {
        await supabase
          .from('user_benefits')
          .update({ status: 'available' })
          .eq('id', dailyBenefit.id);
      }
    }
  }

  static async getBenefitsSummary(userId: string): Promise<BenefitsSummary> {
    await this.initializeUserBenefits(userId);
    await this.refreshDailyBonus(userId);
    await this.unlockVipBenefits(userId);

    const [vipLevel, userBenefits] = await Promise.all([
      this.getVipLevel(userId),
      this.getUserBenefits(userId),
    ]);

    const currentTier = VIP_TIERS.find(t => t.level === vipLevel.level) ?? VIP_TIERS[0];
    const nextTier = VIP_TIERS.find(t => t.level === vipLevel.level + 1) ?? null;

    const progressToNextLevel = nextTier
      ? Math.min(100, ((vipLevel.totalWagered - currentTier.minWagered) / (nextTier.minWagered - currentTier.minWagered)) * 100)
      : 100;

    const availableBenefits = userBenefits.filter(b => b.status === 'available');
    const claimedBenefits = userBenefits.filter(b => b.status === 'claimed');
    const totalEarned = claimedBenefits.reduce((sum, b) => sum + (b.rewardAmount ?? 0), 0);

    return {
      vipLevel,
      currentTier,
      nextTier,
      progressToNextLevel,
      availableBenefits,
      claimedBenefits,
      totalEarned,
    };
  }
}
