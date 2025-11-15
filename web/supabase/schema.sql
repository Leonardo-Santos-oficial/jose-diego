create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users not null,
  display_name text,
  pix_key text,
  created_at timestamptz default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users not null,
  balance numeric(14,2) not null default 0,
  updated_at timestamptz default now()
);

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  crash_multiplier numeric(10,2),
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.game_rounds,
  user_id uuid references auth.users,
  stake numeric(10,2) not null,
  auto_cashout numeric(10,2),
  cashed_out_at timestamptz,
  payout_multiplier numeric(10,2),
  created_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  sender_role text not null,
  user_id uuid references auth.users,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.withdraw_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.perform_bet(
  p_round_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_autocashout numeric default null
)
returns table (
  ticket_id uuid,
  balance numeric,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet wallets%rowtype;
  v_active_count integer;
  v_ticket_id uuid;
begin
  select * into v_wallet from wallets where user_id = p_user_id for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  if v_wallet.balance < p_amount then
    raise exception 'INSUFFICIENT_FUNDS';
  end if;

  select count(*) into v_active_count
  from bets
  where user_id = p_user_id
    and round_id = p_round_id
    and cashed_out_at is null;

  if v_active_count >= 2 then
    raise exception 'MAX_ACTIVE_BETS';
  end if;

  update wallets
  set balance = balance - p_amount,
      updated_at = now()
  where user_id = p_user_id
  returning * into v_wallet;

  insert into bets (round_id, user_id, stake, auto_cashout)
  values (p_round_id, p_user_id, p_amount, p_autocashout)
  returning id into v_ticket_id;

  return query select v_ticket_id, v_wallet.balance, v_wallet.updated_at;
end;
$$;

create or replace function public.perform_cashout(
  p_ticket_id uuid,
  p_user_id uuid,
  p_round_id uuid,
  p_multiplier numeric
)
returns table (
  ticket_id uuid,
  credited_amount numeric,
  payout_multiplier numeric,
  balance numeric,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet bets%rowtype;
  v_wallet wallets%rowtype;
  v_credit numeric;
begin
  select * into v_bet from bets where id = p_ticket_id and user_id = p_user_id for update;
  if not found then
    raise exception 'BET_NOT_FOUND';
  end if;

  if v_bet.cashed_out_at is not null then
    raise exception 'BET_ALREADY_CASHED';
  end if;

  if v_bet.round_id is distinct from p_round_id then
    raise exception 'ROUND_MISMATCH';
  end if;

  v_credit := coalesce(v_bet.stake, 0) * p_multiplier;

  update bets
  set cashed_out_at = now(),
      payout_multiplier = p_multiplier
  where id = v_bet.id;

  select * into v_wallet from wallets where user_id = p_user_id for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  update wallets
  set balance = balance + v_credit,
      updated_at = now()
  where user_id = p_user_id
  returning * into v_wallet;

  return query select v_bet.id, v_credit, p_multiplier, v_wallet.balance, v_wallet.updated_at;
end;
$$;
