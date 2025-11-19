-- Chat threads and realtime-ready messages
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists chat_threads_user_unique
  on public.chat_threads (user_id)
  where user_id is not null;

create index if not exists chat_threads_status_idx
  on public.chat_threads (status);

alter table if exists public.chat_threads
  enable row level security;

alter table if exists public.chat_messages
  add column if not exists thread_id uuid references public.chat_threads(id);

create index if not exists chat_messages_thread_idx
  on public.chat_messages (thread_id, created_at);

-- RLS
do $$

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_threads' and policyname = 'chat_threads_select_own_or_service'
  ) then
    execute 'create policy chat_threads_select_own_or_service
      on public.chat_threads
      for select using (auth.role() = ''service_role'' or auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_threads' and policyname = 'chat_threads_insert_self'
  ) then
    execute 'create policy chat_threads_insert_self
      on public.chat_threads
      for insert with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_threads' and policyname = 'chat_threads_service_all'
  ) then
    execute 'create policy chat_threads_service_all
      on public.chat_threads
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_select_thread'
  ) then
    execute 'create policy chat_messages_select_thread
      on public.chat_messages
      for select using (auth.role() = ''service_role'' or auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_insert_user'
  ) then
    execute 'create policy chat_messages_insert_user
      on public.chat_messages
      for insert with check (auth.uid() = user_id and sender_role = ''user'')';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_messages' and policyname = 'chat_messages_service_all'
  ) then
    execute 'create policy chat_messages_service_all
      on public.chat_messages
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;
end$$;
