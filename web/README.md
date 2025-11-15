# Aviator Demo Platform

[![Admin Realtime E2E](https://github.com/OWNER/REPO/actions/workflows/admin-realtime-e2e.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/admin-realtime-e2e.yml)

> Substitua `OWNER/REPO` pelo slug real do repositório quando publicar no GitHub.

Base inicial em Next.js 16.0.3 com TypeScript, pronta para receber as funcionalidades
especificadas no PRD v1.1 (autenticação, landing page, carteira, jogo Aviator e chat).

## Scripts

```bash
npm run dev         # inicia ambiente de desenvolvimento
npm run dev:e2e     # inicia o dev server com NEXT_PUBLIC_E2E=1
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
AVIATOR_NODE_URL=http://localhost:8081
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

1. Garanta que o node-service/realtime loop esteja rodando e que as credenciais do jogador teste
   (`E2E_PLAYER_EMAIL`/`E2E_PLAYER_PASSWORD`) existam no Supabase.
2. Inicie o dev server com `npm run dev:e2e` (necessário para liberar os helpers de teste e o HUD em tempo real).
3. Execute o smoke test do Aviator:

   ```bash
   npm run test:e2e -- aviator-app
   ```

O helper `/api/tests/player-session/login` cria a sessão via Supabase Auth e `/api/tests/wallet/topup`
garante saldo consistente antes de cada teste. Ambos só funcionam quando `NEXT_PUBLIC_E2E=1` e `AVIATOR_E2E=1`.
