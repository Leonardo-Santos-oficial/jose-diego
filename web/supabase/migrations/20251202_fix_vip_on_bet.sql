-- Migration: Fix VIP level update on bet placement
-- Description: Updates perform_bet function to increment user VIP progress when betting

-- Update perform_bet function to also update VIP progress
CREATE OR REPLACE FUNCTION public.perform_bet(
  p_round_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_autocashout numeric default null
)
RETURNS TABLE (
  ticket_id uuid,
  balance numeric,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_active_count integer;
  v_ticket_id uuid;
BEGIN
  -- Lock wallet row
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  -- Check sufficient balance
  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
  END IF;

  -- Check max active bets (2 per round)
  SELECT count(*) INTO v_active_count
  FROM bets
  WHERE user_id = p_user_id
    AND round_id = p_round_id
    AND cashed_out_at IS NULL;

  IF v_active_count >= 2 THEN
    RAISE EXCEPTION 'MAX_ACTIVE_BETS';
  END IF;

  -- Debit wallet
  UPDATE wallets
  SET balance = wallets.balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;

  -- Create bet record
  INSERT INTO bets (round_id, user_id, stake, auto_cashout)
  VALUES (p_round_id, p_user_id, p_amount, p_autocashout)
  RETURNING id INTO v_ticket_id;

  -- UPDATE VIP PROGRESS: Increment total_wagered and points
  INSERT INTO user_vip_levels (user_id, level, total_wagered, total_deposited, points)
  VALUES (p_user_id, 0, p_amount, 0, FLOOR(p_amount / 10))
  ON CONFLICT (user_id) DO UPDATE
  SET total_wagered = user_vip_levels.total_wagered + p_amount,
      points = user_vip_levels.points + FLOOR(p_amount / 10);

  -- Check and update VIP level if threshold reached
  UPDATE user_vip_levels
  SET level = CASE
    WHEN total_wagered >= 50000 THEN 5
    WHEN total_wagered >= 20000 THEN 4
    WHEN total_wagered >= 5000 THEN 3
    WHEN total_wagered >= 1000 THEN 2
    WHEN total_wagered >= 100 THEN 1
    ELSE 0
  END,
  level_updated_at = CASE 
    WHEN level < (
      CASE
        WHEN total_wagered >= 50000 THEN 5
        WHEN total_wagered >= 20000 THEN 4
        WHEN total_wagered >= 5000 THEN 3
        WHEN total_wagered >= 1000 THEN 2
        WHEN total_wagered >= 100 THEN 1
        ELSE 0
      END
    ) THEN now()
    ELSE level_updated_at
  END
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_ticket_id, v_wallet.balance, v_wallet.updated_at;
END;
$$;

-- Also update schema.sql perform_bet to match
COMMENT ON FUNCTION public.perform_bet IS 'Places a bet and updates VIP progress (total_wagered, points, level)';
