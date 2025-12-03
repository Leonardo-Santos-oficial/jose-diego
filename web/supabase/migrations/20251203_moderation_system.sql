-- Migration: Create moderation_actions table for user moderation system
-- This enables admins to warn, suspend, block, or ban users from chat

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('warn', 'suspend', 'block', 'ban')),
  reason text not null,
  admin_id uuid not null references auth.users(id),
  admin_name text not null,
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id)
);

create index if not exists idx_moderation_actions_user_id on public.moderation_actions(user_id);
create index if not exists idx_moderation_actions_status on public.moderation_actions(status);
create index if not exists idx_moderation_actions_action_type on public.moderation_actions(action_type);
create index if not exists idx_moderation_actions_created_at on public.moderation_actions(created_at desc);

alter table if exists public.moderation_actions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'moderation_actions'
      and policyname = 'moderation_actions_service_role_all'
  ) then
    execute 'create policy moderation_actions_service_role_all
      on public.moderation_actions
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;
end$$;

alter publication supabase_realtime add table moderation_actions;

create or replace function public.auto_expire_moderation_actions()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.moderation_actions
  set status = 'expired'
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
  return null;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'trigger_auto_expire_moderation'
      and event_object_table = 'moderation_actions'
  ) then
    create trigger trigger_auto_expire_moderation
    after insert or update on public.moderation_actions
    for each statement
    execute function public.auto_expire_moderation_actions();
  end if;
end$$;
