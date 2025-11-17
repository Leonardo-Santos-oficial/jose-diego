-- Template de configuração do cron do Aviator.
-- Execute este arquivo no banco Postgres do projeto (psql ou Supabase SQL Editor).

set search_path = public, extensions;

-- Garante que o papel usado pelo pg_cron (postgres) pode chamar net.http_post.
grant usage on schema extensions to postgres;
grant execute on function net.http_post(text, jsonb, jsonb) to postgres;

-- Remove o job anterior, se existir.
select cron.unschedule(jobname)
from cron.job
where jobname in ('aviator_tick_primary', 'aviator_tick_offset_a', 'aviator_tick_offset_b');

-- Agenda o tick principal (ajuste a expressão CRON conforme necessário).
select cron.schedule(
  'aviator_tick_primary',
  '* * * * *', -- mínimo oficial: 60s. Use jobs defasados para resoluções menores.
  $$select public.invoke_aviator_tick();$$
);

-- Exemplo opcional para intervalos < 60s (dois jobs defasados em 0.5s).
-- select cron.schedule('aviator_tick_offset_a', '* * * * *', $$select public.invoke_aviator_tick();$$);
-- select pg_sleep(0.5);
-- select cron.schedule('aviator_tick_offset_b', '* * * * *', $$select public.invoke_aviator_tick();$$);

-- Diagnóstico rápido.
select jobid, jobname, schedule, nodename, nodeport
from cron.job
order by jobid;

select *
from cron.job_run_details
order by start_time desc
limit 5;
