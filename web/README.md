# Aviator Demo Platform

[![Admin Realtime E2E](https://github.com/OWNER/REPO/actions/workflows/admin-realtime-e2e.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/admin-realtime-e2e.yml)

> Substitua `OWNER/REPO` pelo slug real do repositório quando publicar no GitHub.

Base inicial em Next.js 16.0.3 com TypeScript, pronta para receber as funcionalidades
especificadas no PRD v1.1 (autenticação, landing page, carteira, jogo Aviator e chat).

## Scripts

```bash
npm run dev         # inicia ambiente de desenvolvimento
npm run dev:e2e     # inicia o dev server com NEXT_PUBLIC_E2E=1
npm run tick:dev    # dispara ciclos do Aviator via /api/aviator/tick (desenvolvimento)
npm run tick:invoke # executa select public.invoke_aviator_tick() usando a service role
npm run build       # build para produção
npm run start       # inicia build gerado
npm run lint        # roda lint do Next.js
npm run typecheck   # verifica tipos TypeScript
npm run test        # executa vitest
npm run test:e2e    # roda Playwright
```

## Variáveis de ambiente

Crie um arquivo `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_TEST_USER_ID=          # usado pelos testes de integração das RPCs
AVIATOR_TICK_SECRET=          # opcional, protege POST /api/aviator/tick
AVIATOR_TICK_ENDPOINT=        # URL pública do endpoint /api/aviator/tick
AVIATOR_TICK_FREQUENCY_MS=700
AVIATOR_TICK_ENABLED=1
AVIATOR_ADMIN_BEARER=         # token para chamar /api/aviator/* sem sessão (admin)
NEXT_PUBLIC_AVIATOR_ENABLE_CLIENT_TICK=1
AVIATOR_E2E=1                    # habilita helpers da rota /app nos testes
E2E_PLAYER_EMAIL=player@exemplo.com
E2E_PLAYER_PASSWORD=senha-secreta
E2E_PLAYER_BALANCE=500           # opcional (default 500)
```

Essas chaves são necessárias para o cliente Supabase e futuras server actions.

## Fluxo E2E (Admin Realtime)

1. Inicie o ambiente dedicado com mocks: `npm run dev:e2e`.
2. Gere o storage state do admin (cria `playwright/.auth/admin.json`):

   ```bash
   npx playwright test tests/e2e/login.setup.ts
   ```

3. Rode apenas os testes Playwright do fluxo realtime:

   ```bash
   npm run test:e2e -- admin-realtime
   ```

As rotas `/api/tests/*` e a página `/admin/realtime-e2e` só respondem quando `NEXT_PUBLIC_E2E=1` está ativo.

## Fluxo E2E (Rota `/app` Aviator)

1. Garanta que o loop serverless esteja ativo. Em desenvolvimento, rode `npm run tick:dev` em um terminal separado
   ou mantenha `NEXT_PUBLIC_AVIATOR_ENABLE_CLIENT_TICK=1` para que o cliente dispare `/api/aviator/tick` automaticamente.
   Em produção, configure um agendamento (Vercel Cron ou Supabase pg_net) que faça POST nesse endpoint com `AVIATOR_TICK_SECRET`.
2. Crie o jogador teste (`E2E_PLAYER_EMAIL`/`E2E_PLAYER_PASSWORD`) no Supabase e mantenha saldo via helper `/api/tests/wallet/topup`.
3. Inicie o dev server com `npm run dev:e2e` e execute o smoke test do Aviator:

   ```bash
   npm run test:e2e -- aviator-app
   ```

O helper `/api/tests/player-session/login` cria a sessão via Supabase Auth e `/api/tests/wallet/topup`
garante saldo consistente antes de cada teste. Ambos só funcionam quando `NEXT_PUBLIC_E2E=1` e `AVIATOR_E2E=1`.

## Testes de integração com Supabase

Os testes em `src/modules/aviator/serverless/__tests__/SupabaseRpc.test.ts` exercitam diretamente as
funções `perform_bet` e `perform_cashout` no banco. Configure as variáveis
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_TEST_USER_ID`
apontando para um usuário já existente no projeto e garanta saldo inicial via helper de carteira.

Execute apenas esta suíte com:

```bash
npm run test -- Supabase RPC integration
```

> Esses testes exigem acesso de service role e **modificam saldo/rodadas** do usuário configurado.

## Automação do tick via Supabase

O schema inclui a tabela `public.aviator_tick_config` e a função
`public.invoke_aviator_tick()`, permitindo que o Supabase dispare o loop.

1. Configure `.env.local` com `AVIATOR_TICK_ENDPOINT`, `AVIATOR_TICK_SECRET`,
   `AVIATOR_TICK_FREQUENCY_MS`, `AVIATOR_TICK_ENABLED` e `SUPABASE_SERVICE_ROLE_KEY`.
2. Popule a tabela executando `node scripts/seed-aviator-tick-config.mjs`.
   O script usa a service-role para realizar um `upsert` da linha única.
3. Valide rapidamente chamando a função com `npm run tick:invoke`. O comando
   autentica com a mesma chave e executa `select public.invoke_aviator_tick();`
   sem depender do cron.

### Agendamento (pg_cron)

1. Rode o template `supabase/sql/cron/setup_aviator_tick.sql` em um console psql
   conectado ao Postgres do projeto. O script concede `execute` ao `net.http_post`
   para o papel usado pelo `pg_cron`, remove jobs antigos (`cron.unschedule`) e
   registra novamente `select public.invoke_aviator_tick();`.
2. Para frequências abaixo de 60s, o template inclui exemplos de múltiplos jobs
   defasados usando `select pg_sleep(0.5);` entre as chamadas `cron.schedule`.
   Ajuste o deslocamento conforme a cadência desejada.
3. Checklist de troubleshooting:
   - `select * from cron.job order by jobid;` — garante que o job está registrado.
   - `select * from cron.job_run_details order by start_time desc limit 5;` —
     inspeção rápida das execuções e possíveis erros.
   - Dashboard Supabase » Logs » Postgres/Edge para rastrear `net.http_post`.
   - Confirme que o cabeçalho `x-aviator-secret` configurado no banco coincide com
     `AVIATOR_TICK_SECRET` do deploy que recebe o POST.

## Validação do loop Realtime/UI

- **Vitest:** `npm run test -- aviator-engine-facade` executa o teste que
  “moca” o publisher e garante que `AviatorEngineFacade.tick()` publica estado e
  histórico ao transicionar para `crashed`.
- **Playwright:** `npx playwright test tests/e2e/aviator-smoke.spec.ts` abre `/app`,
  espera o `useAviatorStore` sair de `awaitingBets` para `flying` e verifica se
  o histórico recebeu pelo menos um item — ótimo smoke test antes do deploy.
