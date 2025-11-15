# Aviator Node Service

Serviço responsável por executar o loop do jogo Aviator, publicar eventos no Supabase Realtime e receber comandos de aposta/cashout.

## Requisitos

- Node.js 20+
- npm 10+ (ou pnpm/yarn equivalente)

## Configuração

1. Copie `.env.example` para `.env` e preencha as variáveis.
2. Instale as dependências:

```bash
npm install
```

## Scripts

- `npm run dev` – roda o serviço em modo watch usando `tsx`.
- `npm run build` – gera o bundle ESM em `dist/` com `tsup`.
- `npm start` – executa o bundle compilado.
- `npm run typecheck` – valida o projeto com `tsc --noEmit`.

## Integração com Supabase

- O serviço usa o client service-role para chamar as RPCs `perform_bet` e `perform_cashout` (definidas em `web/supabase/schema.sql`). Execute o script SQL no painel do Supabase antes de subir o worker.
- Os resultados são publicados automaticamente nos canais `game.state`, `game.history`, `commands.bet` e `commands.cashout` via `SupabaseRealtimePublisher`.
- Para desenvolvimento local, exporte `AVIATOR_NODE_URL=http://localhost:8081` e aponte as Server Actions do Next.js para esse endpoint.

## Endpoints iniciais

- `GET /health` – status básico do processo.
- `POST /bets` – recebe comandos de aposta (`roundId`, `userId`, `amount`, `autopayoutMultiplier?`).
- `POST /cashout` – processa cashouts manuais ou automáticos (`ticketId`, `userId`, `kind`).
- `POST /round/override` – endpoint administrativo para `pause`, `resume` e `forceCrash`.

Os handlers validam o payload com `zod`, delegam para o `CommandService` (que chama as RPCs transacionais) e publicam o resultado para o frontend através do Realtime.

## Estrutura inicial

```
node-service/
  src/
    config/env.ts         # parsing das variáveis de ambiente
    logger.ts             # logger pino pré-configurado
    clients/              # supabase service-role client
    loop/                 # GameStateMachine, LoopScheduler, LoopController
    publisher/            # ConsolePublisher + SupabaseRealtimePublisher
    routes/               # comandos HTTP e overrides
    services/             # CommandService e helpers
    index.ts              # entrypoint que liga tudo
```

Mais detalhes arquiteturais estão documentados em `docs/architecture/node-service.md`.
