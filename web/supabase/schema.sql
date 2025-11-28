create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users not null,
  display_name text,
  pix_key text,
  cashout_auto_pref boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users not null,
  balance numeric(14,2) not null default 0,
  updated_at timestamptz default now()
);

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'awaitingBets',
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

alter table if exists public.wallets enable row level security;
alter table if exists public.bets enable row level security;
alter table if exists public.withdraw_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wallets'
      and policyname = 'wallets_select_own_or_service'
  ) then
    execute 'create policy wallets_select_own_or_service
      on public.wallets
      for select
      using (auth.uid() = user_id or auth.role() = ''service_role'')';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wallets'
      and policyname = 'wallets_service_role_write'
  ) then
    execute 'create policy wallets_service_role_write
      on public.wallets
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bets'
      and policyname = 'bets_select_own_or_service'
  ) then
    execute 'create policy bets_select_own_or_service
      on public.bets
      for select
      using (auth.uid() = user_id or auth.role() = ''service_role'')';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bets'
      and policyname = 'bets_service_role_write'
  ) then
    execute 'create policy bets_service_role_write
      on public.bets
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'withdraw_requests'
      and policyname = 'withdraw_requests_select_own_or_service'
  ) then
    execute 'create policy withdraw_requests_select_own_or_service
      on public.withdraw_requests
      for select
      using (auth.uid() = user_id or auth.role() = ''service_role'')';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'withdraw_requests'
      and policyname = 'withdraw_requests_service_role_write'
  ) then
    execute 'create policy withdraw_requests_service_role_write
      on public.withdraw_requests
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;
end$$;

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
  set balance = wallets.balance - p_amount,
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
  set balance = wallets.balance + v_credit,
      updated_at = now()
  where user_id = p_user_id
  returning * into v_wallet;

  return query select v_bet.id, v_credit, p_multiplier, v_wallet.balance, v_wallet.updated_at;
end;
$$;

create table if not exists public.engine_state (
  id uuid primary key default gen_random_uuid(),
  current_round_id uuid references public.game_rounds,
  phase text not null default 'awaitingBets',
  phase_started_at timestamptz not null default now(),
  current_multiplier numeric(10,2) not null default 1,
  target_multiplier numeric(10,2) not null default 2,
  settings jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists engine_state_singleton_idx
  on public.engine_state ((1));

create table if not exists public.aviator_tick_config (
  id boolean primary key default true,
  endpoint_url text not null,
  headers jsonb default '{}'::jsonb,
  interval_ms integer not null default 700,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table if exists public.aviator_tick_config enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'aviator_tick_config'
      and policyname = 'aviator_tick_config_service_only'
  ) then
    execute 'create policy aviator_tick_config_service_only
      on public.aviator_tick_config
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;
end$$;

create or replace function public.invoke_aviator_tick()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg record;
begin
  select endpoint_url, headers, interval_ms
  into cfg
  from public.aviator_tick_config
  where id is true and enabled
  limit 1;

  if not found then
    return;
  end if;

  perform net.http_post(
    url := cfg.endpoint_url,
    headers := coalesce(cfg.headers, '{}'::jsonb)
  );
end;
$$;

-- Admin game commands table for motor control
create table if not exists public.admin_game_commands (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- Enable realtime for admin_game_commands
alter publication supabase_realtime add table admin_game_commands;

-- RLS policies for admin_game_commands
alter table if exists public.admin_game_commands enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_game_commands'
      and policyname = 'admin_game_commands_service_role'
  ) then
    execute 'create policy admin_game_commands_service_role
      on public.admin_game_commands
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;
end$$;
