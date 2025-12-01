-- Benefits System Tables

-- Benefit types catalog
CREATE TABLE IF NOT EXISTS public.benefit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('welcome', 'daily', 'cashback', 'vip', 'promo')),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('fixed', 'percentage', 'multiplier')),
  reward_value NUMERIC(10,2) NOT NULL,
  min_level INTEGER DEFAULT 0,
  max_claims INTEGER DEFAULT 1,
  cooldown_hours INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User benefit claims
CREATE TABLE IF NOT EXISTS public.user_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  benefit_type_id UUID REFERENCES public.benefit_types NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('locked', 'available', 'claimed', 'expired')),
  claimed_at TIMESTAMPTZ,
  reward_amount NUMERIC(10,2),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User VIP levels
CREATE TABLE IF NOT EXISTS public.user_vip_levels (
  user_id UUID PRIMARY KEY REFERENCES auth.users NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  total_wagered NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_deposited NUMERIC(14,2) NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  level_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benefit transactions log
CREATE TABLE IF NOT EXISTS public.benefit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  user_benefit_id UUID REFERENCES public.user_benefits,
  benefit_type_id UUID REFERENCES public.benefit_types,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('claim', 'credit', 'expire', 'revoke')),
  amount NUMERIC(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.benefit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vip_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for benefit_types (public read)
CREATE POLICY benefit_types_public_read ON public.benefit_types
  FOR SELECT USING (is_active = true);

CREATE POLICY benefit_types_service_write ON public.benefit_types
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for user_benefits
CREATE POLICY user_benefits_select_own ON public.user_benefits
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_benefits_insert_own ON public.user_benefits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_benefits_update_own ON public.user_benefits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_benefits_service_write ON public.user_benefits
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for user_vip_levels
CREATE POLICY user_vip_levels_select_own ON public.user_vip_levels
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_vip_levels_insert_own ON public.user_vip_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_vip_levels_update_own ON public.user_vip_levels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_vip_levels_service_write ON public.user_vip_levels
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for benefit_transactions
CREATE POLICY benefit_transactions_select_own ON public.benefit_transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY benefit_transactions_insert_own ON public.benefit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY benefit_transactions_service_write ON public.benefit_transactions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to claim a benefit
CREATE OR REPLACE FUNCTION public.claim_benefit(
  p_user_id UUID,
  p_user_benefit_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  reward_amount NUMERIC,
  new_balance NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_benefit user_benefits%ROWTYPE;
  v_benefit_type benefit_types%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_reward NUMERIC;
  v_claim_count INTEGER;
BEGIN
  SELECT * INTO v_benefit FROM user_benefits 
  WHERE id = p_user_benefit_id AND user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'Benefício não encontrado'::TEXT;
    RETURN;
  END IF;
  
  IF v_benefit.status != 'available' THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'Benefício não disponível para resgate'::TEXT;
    RETURN;
  END IF;
  
  IF v_benefit.expires_at IS NOT NULL AND v_benefit.expires_at < NOW() THEN
    UPDATE user_benefits SET status = 'expired' WHERE id = p_user_benefit_id;
    RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'Benefício expirado'::TEXT;
    RETURN;
  END IF;
  
  SELECT * INTO v_benefit_type FROM benefit_types WHERE id = v_benefit.benefit_type_id;
  
  SELECT COUNT(*) INTO v_claim_count FROM user_benefits 
  WHERE user_id = p_user_id 
    AND benefit_type_id = v_benefit.benefit_type_id 
    AND status = 'claimed';
  
  IF v_benefit_type.max_claims > 0 AND v_claim_count >= v_benefit_type.max_claims THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 'Limite de resgates atingido'::TEXT;
    RETURN;
  END IF;
  
  v_reward := COALESCE(v_benefit.reward_amount, v_benefit_type.reward_value);
  
  UPDATE wallets 
  SET balance = balance + v_reward, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;
  
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, balance, updated_at)
    VALUES (p_user_id, v_reward, NOW())
    RETURNING * INTO v_wallet;
  END IF;
  
  UPDATE user_benefits 
  SET status = 'claimed', claimed_at = NOW(), reward_amount = v_reward
  WHERE id = p_user_benefit_id;
  
  INSERT INTO benefit_transactions (user_id, user_benefit_id, benefit_type_id, transaction_type, amount)
  VALUES (p_user_id, p_user_benefit_id, v_benefit.benefit_type_id, 'claim', v_reward);
  
  RETURN QUERY SELECT true, v_reward, v_wallet.balance, 'Benefício resgatado com sucesso!'::TEXT;
END;
$$;

-- Function to get or create user VIP level
CREATE OR REPLACE FUNCTION public.get_or_create_vip_level(p_user_id UUID)
RETURNS user_vip_levels
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vip user_vip_levels%ROWTYPE;
BEGIN
  SELECT * INTO v_vip FROM user_vip_levels WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_vip_levels (user_id, level, total_wagered, total_deposited, points)
    VALUES (p_user_id, 0, 0, 0, 0)
    RETURNING * INTO v_vip;
  END IF;
  
  RETURN v_vip;
END;
$$;

-- Function to update VIP level based on activity
CREATE OR REPLACE FUNCTION public.update_vip_level(
  p_user_id UUID,
  p_wagered_amount NUMERIC DEFAULT 0,
  p_deposited_amount NUMERIC DEFAULT 0
)
RETURNS user_vip_levels
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vip user_vip_levels%ROWTYPE;
  v_new_level INTEGER;
  v_total_wagered NUMERIC;
BEGIN
  SELECT * INTO v_vip FROM user_vip_levels WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO user_vip_levels (user_id, level, total_wagered, total_deposited, points)
    VALUES (p_user_id, 0, p_wagered_amount, p_deposited_amount, 0)
    RETURNING * INTO v_vip;
  ELSE
    UPDATE user_vip_levels
    SET total_wagered = total_wagered + p_wagered_amount,
        total_deposited = total_deposited + p_deposited_amount,
        points = points + FLOOR(p_wagered_amount / 10)
    WHERE user_id = p_user_id
    RETURNING * INTO v_vip;
  END IF;
  
  v_total_wagered := v_vip.total_wagered;
  
  v_new_level := CASE
    WHEN v_total_wagered >= 50000 THEN 5
    WHEN v_total_wagered >= 20000 THEN 4
    WHEN v_total_wagered >= 5000 THEN 3
    WHEN v_total_wagered >= 1000 THEN 2
    WHEN v_total_wagered >= 100 THEN 1
    ELSE 0
  END;
  
  IF v_new_level > v_vip.level THEN
    UPDATE user_vip_levels 
    SET level = v_new_level, level_updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_vip;
  END IF;
  
  RETURN v_vip;
END;
$$;

-- Seed initial benefit types
INSERT INTO public.benefit_types (code, name, description, category, reward_type, reward_value, min_level, max_claims, cooldown_hours)
VALUES 
  ('welcome_bonus', 'Bônus de Boas-Vindas', 'Ganhe R$ 10,00 ao criar sua conta!', 'welcome', 'fixed', 10.00, 0, 1, 0),
  ('daily_bonus', 'Bônus Diário', 'Resgate R$ 1,00 todos os dias!', 'daily', 'fixed', 1.00, 0, 0, 24),
  ('cashback_5', 'Cashback 5%', 'Receba 5% de cashback nas suas apostas', 'cashback', 'percentage', 5.00, 1, 0, 168),
  ('vip_bronze', 'Bônus VIP Bronze', 'Bônus exclusivo para membros Bronze', 'vip', 'fixed', 25.00, 1, 1, 0),
  ('vip_silver', 'Bônus VIP Prata', 'Bônus exclusivo para membros Prata', 'vip', 'fixed', 50.00, 2, 1, 0),
  ('vip_gold', 'Bônus VIP Ouro', 'Bônus exclusivo para membros Ouro', 'vip', 'fixed', 100.00, 3, 1, 0),
  ('vip_platinum', 'Bônus VIP Platina', 'Bônus exclusivo para membros Platina', 'vip', 'fixed', 250.00, 4, 1, 0),
  ('vip_diamond', 'Bônus VIP Diamante', 'Bônus exclusivo para membros Diamante', 'vip', 'fixed', 500.00, 5, 1, 0)
ON CONFLICT (code) DO NOTHING;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_benefits_user_id ON public.user_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_benefits_status ON public.user_benefits(status);
CREATE INDEX IF NOT EXISTS idx_benefit_transactions_user_id ON public.benefit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vip_levels_level ON public.user_vip_levels(level);
