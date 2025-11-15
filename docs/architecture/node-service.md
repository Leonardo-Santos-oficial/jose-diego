# Serviço Node Externo (Game Loop Aviator)

Este serviço mantém o ciclo do jogo Aviator fora do Supabase (plataforma sugerida: Fly.io).
Ele aplica os padrões State, Strategy, Observer e Command conforme o PRD.

## Responsabilidades

- **State**: alternar entre `betting`, `flying` e `crashed`, publicando cada mudança.
- **Strategy**: selecionar o algoritmo Provably Fair (default), modo demo ou override do
  administrador.
- **Command**: enfileirar operações (apostas, cashouts, ajustes manuais) antes de
  persistir no Supabase.
- **Observer/Mediator**: publicar eventos para Supabase Realtime (tópicos `game.state`,
  `game.history`) e notificar clientes Next.js.

## Fluxo Operacional

1. Serviço inicia e abre conexão WSS autenticada com Supabase Realtime.
2. A cada tick local (100ms) atualiza o multiplicador em memória e recalcula countdown.
3. Quando muda de estado, envia payload `GameStateChanged` para `nodeBroadcast`, que por
   sua vez replica para `game.state`.
4. Processa comandos vindos das APIs REST (via fila supabase ou tabela `bets_queue`).
5. Atualiza tabelas `game_rounds`, `bets` e `wallets` usando chave de serviço.

## Segurança

- Autenticação mútua via tokens de serviço.
- Lista permitida de origens WSS.
- Logs de auditoria enviados ao Supabase Storage.

## Stack e Runtime

- **Runtime:** Node.js 20 + TypeScript executando em container leve (Fly.io ou Supabase Edge Function container). Build com `pnpm` e empacotamento via `tsup` para um único bundle ESM.
- **Entradas:** HTTP REST (`POST /bets`, `POST /cashout`, `POST /round/override`) protegidas por bearer token (usuário ou admin). Futuramente esses endpoints podem ser expostos como Edge Functions. O endpoint de override conversa com o `LoopController`, que isola o controle do scheduler (`pause`/`resume`) e o comando `forceCrash` da `GameStateMachine` (SRP + Command).
- **Saídas:** Publicação no canal privado `nodeBroadcast` (vide AsyncAPI) e escrita direta nas tabelas `game_rounds`, `bets`, `wallets` e `chat_messages` (para alertas) através do client service-role do Supabase.
- **Observabilidade:** Logs estruturados em JSON enviados ao Stdout e replicados para Supabase Storage; métricas básicas (latência dos comandos, duração de round) exportadas via `/metrics` (Prometheus).

## Componentes Principais

| Componente | Padrão | Responsabilidades |
| --- | --- | --- |
| `LoopScheduler` | Template Method | Mantém o cronograma de rounds, invoca `GameStateMachine.tick()` a cada 100 ms e dispara transições quando timers expiram. |
| `GameStateMachine` + estados concretos (`AwaitingBetsState`, `FlyingState`, `CrashedState`) | State | Cada estado sabe como inicializar (`enter`), reagir aos ticks (`tick`) e finalizar (`exit`). O estado atual possui acesso às dependências (repositórios, `RealtimePublisher`, `Strategy`). |
| `CrashStrategy` (interface) e implementações (`ProvablyFairStrategy`, `FixedMultiplierStrategy`) | Strategy | Define o multiplicador alvo e o ritmo de crescimento. Pode ser trocada em runtime lendo uma flag da tabela `feature_flags`. |
| `CommandBus` | Command | Recebe comandos `BetCommand`/`CashoutCommand`, garante execução sequencial e idempotência através de uma fila em memória + fallback em `bets_queue`. |
| `RealtimePublisher` | Observer | Encapsula publicação nos canais `game.state`, `game.history` e nos tópicos de resposta dos comandos (`commands.bet`, `commands.cashout`). |
| `Repositories` (`WalletRepository`, `BetRepository`, `RoundRepository`) | Repository | Operações CRUD contra Supabase usando o client service-role e transações RPC. |

## Fluxo Por Rodada

1. **Awaiting Bets** (`betting`):
   - `RoundRepository.createRound()` abre um round com status `betting`.
   - `LoopScheduler` mantém janela configurável (default 4 s) anunciada em `GameStateChanged.bettingWindow`.
   - Comandos `BetCommand` são aceitos, debitam o saldo (`wallets.balance -= stake`), criam entradas em `bets` e retornam `BetResult.accepted` com `ticketId` e snapshot atualizado.
   - Cada usuário pode manter até duas apostas simultâneas; essa regra vive no handler do comando.
2. **Flying** (`flying`):
   - Ao fechar a janela, `GameStateMachine` captura as apostas pendentes, bloqueia novas entradas e muda o estado publicando `GameStateChanged` com `multiplier=1`.
   - `CrashStrategy` fornece o multiplicador alvo e a curva; `LoopScheduler` incrementa o multiplicador a cada tick e recalcula `houseEdge` se necessário.
   - Autocashouts são monitorados pelo `CommandBus`: quando `multiplier >= autopayout`, gera-se um `CashoutCommand(kind=auto)` interno. O handler credita o valor, atualiza `bets.payout_multiplier` e emite `CashoutResult`.
3. **Crashed** (`crashed`):
   - Quando `multiplier` alcança o valor alvo ou ocorre `GameStateOverride.forceCrash`, o estado dispara fechamento do round, atualiza `game_rounds` com `crash_multiplier` e grava um snapshot no histórico (`game.history`).
   - Usuários com tickets não resgatados mantêm `loss = stake` (sem crédito). Um evento `CashoutResult.rejected` é enviado para cada ticket pendente.
4. **Reset:** timer curto (1 s) para limpeza e retorno ao estado `awaitingBets` iniciando novo round.

## Handlers HTTP / Comandos

- `POST /bets` → `PlaceBetCommandHandler`
  - Valida JWT do usuário e carrega saldo via `WalletRepository`.
  - Valida limites (`0.5 ≤ stake ≤ 500`, saldo suficiente, máximo 2 tickets ativos por usuário).
  - Persiste aposta e debita saldo dentro de transação, retorna `202 Accepted` com `ticketId` e `BetResult` publicado no canal do usuário.
- `POST /cashout` → `CashoutCommandHandler`
  - Verifica se a aposta pertence ao usuário, se o round está `flying` e se ainda não existe `cashed_out_at`.
  - Calcula `creditedAmount = stake * currentMultiplier`, atualiza wallet e comunica via `CashoutResult`.
- `POST /round/override` (admin) → `OverrideCommand`
  - Opera ações `pause`, `resume`, `forceCrash` conforme definido no AsyncAPI.
- Todos os handlers gravam um registro em `audit_logs` (tabela a ser criada) com `commandId`, `payload` e `resultado`.

## Persistência e Sincronização

- **Transações:** usar RPC `perform_bet`/`perform_cashout` (funções Postgres a criar) para garantir atomicidade entre `wallets`, `bets` e `game_rounds`.
- **Implementação atual:** `web/supabase/schema.sql` já contém `perform_bet` e `perform_cashout`, ambos com `security definer`, bloqueio pessimista (`FOR UPDATE`) e validações (`saldo`, limite de 2 tickets simultâneos, mismatch de rodada). Os handlers HTTP chamam essas RPCs via `CommandService` e publicam os resultados nos canais `commands.bet`/`commands.cashout` através do `SupabaseRealtimePublisher`.
- **Idempotência:** comandos levam `commandId` (UUID) para permitir replays seguros. A fila `bets_queue` (tabela pequena com TTL) guarda comandos aplicados/pendentes.
- **Histórico:** a cada crash, o `HistoryBuffer` interno guarda até 30 rodadas, categorizadas em `blue/purple/pink`, e dispara `game.history` via `SupabaseRealtimePublisher`, mantendo o Observer como única fonte da verdade.

## Roadmap de Implementação

1. **Scaffold do projeto**: criar pasta `node-service/` com `package.json`, `tsconfig`, eslint básico e script `pnpm dev` (watch com `tsx`).
2. **Infra básica**: adicionar Fastify + `@supabase/supabase-js` (service role) + cliente Realtime autenticado.
3. **Domínio**: implementar `CrashStrategy` default e `GameStateMachine` com estados e eventos mínimos para rodadas mockadas.
4. **Comandos**: expor endpoints `POST /bets` e `POST /cashout`, integrando com Supabase e publicando `BetResult`/`CashoutResult` usando payloads já definidos na AsyncAPI.
5. **Integração Next.js**: criar Server Actions (`placeBetAction`, `cashoutAction`) chamando o serviço e um adapter Realtime (`src/lib/realtime/aviatorClient.ts`) para assinar `game.state`/`game.history`.
6. **Testes**: cobrir `CrashStrategy`, `GameStateMachine` e handlers com Vitest (modo unitário) + um teste de contrato que valida se os payloads respeitam o esquema AsyncAPI (usar `@asyncapi/parser`).

Esses passos completam o item 2 da lista da Fase 4 (prototipar serviço) e preparam o terreno para implementar a UI e E2E no próximo ciclo.
