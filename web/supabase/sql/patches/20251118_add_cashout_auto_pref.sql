-- Ensure user_profiles exposes the auto cashout preference used by the app.
alter table if exists public.user_profiles
  add column if not exists cashout_auto_pref boolean not null default false;
