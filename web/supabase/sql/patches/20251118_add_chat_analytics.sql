alter table if exists public.chat_threads
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references auth.users(id),
  add column if not exists assigned_admin_id uuid references auth.users(id),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists chat_threads_closed_at_idx
  on public.chat_threads (status, closed_at desc);
