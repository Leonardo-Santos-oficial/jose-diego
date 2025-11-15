begin;

select plan(5);

truncate table public.bets restart identity cascade;
truncate table public.game_rounds restart identity cascade;
truncate table public.wallets restart identity cascade;

-- Clean specific auth users that will be reinserted for the tests
delete from auth.users
where id in (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103'
);

insert into auth.users (id, email, encrypted_password, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000101', 'bettor-success@example.com', 'secret', now(), now()),
  ('00000000-0000-0000-0000-000000000102', 'bettor-low-balance@example.com', 'secret', now(), now()),
  ('00000000-0000-0000-0000-000000000103', 'bettor-max-bets@example.com', 'secret', now(), now());

insert into public.wallets (user_id, balance, updated_at)
values
  ('00000000-0000-0000-0000-000000000101', 100, now()),
  ('00000000-0000-0000-0000-000000000102', 80, now()),
  ('00000000-0000-0000-0000-000000000103', 50, now());

insert into public.game_rounds (id, status, crash_multiplier, started_at)
values
  ('10000000-0000-0000-0000-000000000001', 'awaitingBets', null, now()),
  ('20000000-0000-0000-0000-000000000001', 'awaitingBets', null, now());

-- Success scenario
with result as (
  select *
  from public.perform_bet(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    25,
    null
  )
)
select is(
  (select balance from result limit 1),
  75::numeric,
  'perform_bet returns wallet balance after debit'
);

select is(
  (select balance from public.wallets where user_id = '00000000-0000-0000-0000-000000000101'),
  75::numeric,
  'wallet balance is debited in the database'
);

select ok(
  exists (
    select 1 from public.bets
    where user_id = '00000000-0000-0000-0000-000000000101'
      and round_id = '10000000-0000-0000-0000-000000000001'
  ),
  'bet row is created for the player'
);

-- Insufficient funds
select throws_ok(
  $$
    select public.perform_bet(
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000102',
      250,
      null
    );
  $$,
  'INSUFFICIENT_FUNDS',
  'rejects bets that exceed the wallet balance'
);

-- More than 2 concurrent bets
insert into public.bets (round_id, user_id, stake)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 10),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 15);

select throws_ok(
  $$
    select public.perform_bet(
      '20000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000103',
      5,
      null
    );
  $$,
  'MAX_ACTIVE_BETS',
  'rejects when user already has two active bets in the round'
);

select * from finish();
rollback;
