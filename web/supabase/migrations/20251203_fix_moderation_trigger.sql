-- Migration: Fix moderation trigger to prevent stack depth limit exceeded
-- The previous trigger caused infinite recursion because UPDATE triggers the same trigger again

-- Drop the problematic trigger
drop trigger if exists trigger_auto_expire_moderation on public.moderation_actions;

-- Drop the old function
drop function if exists public.auto_expire_moderation_actions();

-- Create a new function that only updates OTHER rows (not the triggering row)
-- and uses a flag to prevent recursion
create or replace function public.auto_expire_moderation_actions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only expire actions that are NOT the current row being inserted/updated
  -- This prevents infinite recursion
  update public.moderation_actions
  set status = 'expired'
  where status = 'active'
    and expires_at is not null
    and expires_at <= now()
    and id != coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  return NEW;
end;
$$;

-- Create trigger that only fires on INSERT (not UPDATE to prevent recursion)
create trigger trigger_auto_expire_moderation
after insert on public.moderation_actions
for each row
execute function public.auto_expire_moderation_actions();

-- Also create a scheduled function that can be called via pg_cron or supabase cron
-- to periodically expire old actions (safer approach)
create or replace function public.expire_old_moderation_actions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.moderation_actions
  set status = 'expired'
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
end;
$$;
