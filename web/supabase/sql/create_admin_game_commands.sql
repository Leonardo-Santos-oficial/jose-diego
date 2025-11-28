-- Execute este SQL no Supabase SQL Editor para criar a tabela admin_game_commands

-- Admin game commands table for motor control
create table if not exists public.admin_game_commands (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- Enable realtime for admin_game_commands (para o motor escutar mudanças)
alter publication supabase_realtime add table admin_game_commands;

-- RLS policies for admin_game_commands
alter table if exists public.admin_game_commands enable row level security;

-- Policy: apenas service_role pode ler/escrever
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

-- Verificar se a tabela foi criada
select * from public.admin_game_commands limit 1;
