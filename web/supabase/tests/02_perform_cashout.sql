begin;

select plan(5);

truncate table public.bets restart identity cascade;
truncate table public.game_rounds restart identity cascade;
truncate table public.wallets restart identity cascade;

delete from auth.users
where id in (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202'
);

insert into auth.users (id, email, encrypted_password, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000201', 'cashout-success@example.com', 'secret', now(), now()),
  ('00000000-0000-0000-0000-000000000202', 'cashout-mismatch@example.com', 'secret', now(), now());

insert into public.wallets (user_id, balance, updated_at)
values
  ('00000000-0000-0000-0000-000000000201', 120, now()),
  ('00000000-0000-0000-0000-000000000202', 40, now());

insert into public.game_rounds (id, status, crash_multiplier, started_at)
values
  ('30000000-0000-0000-0000-000000000001', 'flying', null, now()),
  ('40000000-0000-0000-0000-000000000001', 'flying', null, now()),
  ('40000000-0000-0000-0000-000000000002', 'flying', null, now());

insert into public.bets (id, round_id, user_id, stake)
values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 50),
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', 10);

-- Successful cashout credits the wallet
with result as (
  select *
  from public.perform_cashout(
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000201',
    '30000000-0000-0000-0000-000000000001',
    2.5
  )
)
select is(
  (select credited_amount from result limit 1),
  125::numeric,
  'credited amount matches stake multiplied by provided multiplier'
);

select is(
  (select balance from public.wallets where user_id = '00000000-0000-0000-0000-000000000201'),
  245::numeric,
  'wallet receives the credited amount'
);

select ok(
  (select cashed_out_at is not null from public.bets where id = '50000000-0000-0000-0000-000000000001'),
  'bet is marked as cashed out'
);

-- Second cashout attempt should fail
select throws_ok(
  $$
    select public.perform_cashout(
      '50000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000201',
      '30000000-0000-0000-0000-000000000001',
      2.5
    );
  $$,
  'BET_ALREADY_CASHED',
  'cannot cash out the same ticket twice'
);

-- Round mismatch should fail
select throws_ok(
  $$
    select public.perform_cashout(
      '60000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000202',
      '40000000-0000-0000-0000-000000000002',
      3.0
    );
  $$,
  'ROUND_MISMATCH',
  'rejects when provided round differs from bet record'
);

select * from finish();
rollback;
