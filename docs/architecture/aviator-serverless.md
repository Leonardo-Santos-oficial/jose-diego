# Aviator Serverless Architecture

## 1. Objetivos e Restrições
- **Um único deploy Vercel**: toda a lógica do Aviator deve viver no projeto Next.js (`web/`). Nada de workers externos.
- **Loop determinístico**: cada rodada precisa de estados previsíveis (`awaitingBets → flying → crashed`) e multiplicadores com RTP configurável (97%).
- **Escalabilidade elástica**: o runtime serverless deve aguentar spikes sem manter conexões abertas longas (evitar `setInterval` em memória).
- **Entrega em tempo real**: os clientes continuam recebendo updates via Supabase Realtime.
- **Auditoria forte**: todas as transições escrevem snapshots no Postgres para repetibilidade e testes.

## 2. Padrões Escolhidos (lista solicitada)
| Padrão | Papel | Justificativa Clean Code/SOLID |
| --- | --- | --- |
| **Observer** | `RealtimePublisher` → Supabase Realtime; UI é o observer | Mantém desacoplado quem produz eventos de quem consome (OCP). Já mapeado no PRD e continua o mais aderente para broadcast.
| **State** | `GameStateMachine` com estados `AwaitingBetsState`, `FlyingState`, `CrashedState` | Cada estado tem responsabilidade única, facilita testes e extensão (SRP + OCP). Garante regras distintas para aceitar comandos.
| **Strategy** | `CrashStrategy` determina curva/multiplicador (ProvablyFair, Fixed Demo, Admin Override) | Permite alternar algoritmos sem tocar no restante do engine (OCP + DIP).
| **Command** | `PlaceBetCommand`, `CashoutCommand` executados por handlers serverless | Estrutura consistente para validar entrada, debitar/creditar e publicar resultado. Ajuda a auditar cada ação.
| **Template Method** | `TickExecutor.runCycle()` define a sequência `load → transition → persist → publish`, com passos especializados por estado | Reusa o esqueleto da rotina, evitando duplicação e mantendo funções curtas (DRY + SRP).
| **Facade** | `AviatorEngineFacade` expõe métodos simples (`tick`, `placeBet`, `cashout`) para route handlers/server actions | Oculta detalhes de repositórios, estratégias e publisher, reduzindo acoplamento com a camada HTTP (DIP).
| **Adapter** | `SupabaseRealtimeAdapter` encapsula detalhes de broadcast HTTP/Realtime | Permite trocar canal (e.g., Webhook) sem reescrever observers.
| **Proxy** (leve) | `ServiceRoleClientProxy` controla acesso ao client service-role e injeta métricas/rate limit | Protege o repositório de uso direto e centraliza capacidade de cache se necessário.

### Padrões não utilizados
- **Bridge/Composite/Decorator/Flyweight/Iterator/Mediator/Memento/Visitor**: não entregam valor direto ao loop atual (não há hierarquias complexas ou necessidades de histórico revertível além do que o banco já cobre).
- **Chain of Responsibility**: validações ficam mais claras como funções puras dentro dos handlers, evitando sobre-engenharia.
- **Template Method** já cobre o esqueleto do loop, dispensando `Strategy` adicionais para workflow.

### Arquitetura recomendada
- **Núcleo**: `Observer + State + Command + Template Method` formam o eixo essencial da engine. O `Observer` distribui eventos para HUD/chat sem acoplar clientes; o `State` garante regras distintas por fase e mantém SRP; `Command` encapsula apostas/cashouts, reforçando auditoria e DIP; `Template Method` organiza o ciclo serverless (`load → transition → persist → publish`) sem duplicação.
- **Papéis auxiliares**: `Strategy` permite trocar algoritmos RTP mantendo o restante fechado para modificação (OCP), enquanto `Facade`, `Adapter` e `Proxy` isolam infraestrutura (Supabase, headers secretos) e mantêm handlers enxutos.
- **Clean Code & SOLID**: essa combinação mantém nomes claros, funções curtas e dependências invertidas por interface (`RoundRepository`, `Publisher`). Novos requisitos (ex.: modo promocional) exigem apenas novas `Strategy` ou `State`, respeitando SRP/OCP e preservando testes existentes.

## 3. Componentes
```
[pg_graphite cron/pg_net] ---> POST /api/aviator/tick (background function)
                                   |
                                   v
                         +---------------------+
                         | AviatorEngineFacade |
                         +---------------------+
                           | load state/repo
                           v
                    +--------------------+
                    | GameStateMachine   |
                    +--------------------+
             +-----------+    +-----------+    +-----------+
             |Awaiting   |    |Flying     |    |Crashed    |
             |BetsState  |    |State      |    |State      |
             +-----------+    +-----------+    +-----------+
                    ^                |                |
                    | Template Method|                |
                    +----------------+----------------+
                                   |
                        +-----------------------+
                        | Realtime + Repos +   |
                        | CrashStrategy + Logs  |
                        +-----------------------+
```
- **Tick Scheduler**: job `pg_net.http_post` rodando a cada 500 ms → chama `POST /api/aviator/tick`. Mantemos controle no banco (fácil pausar via flag) e evitamos manter um worker vivo.
- **AviatorEngineFacade**: implementado em `web/src/modules/aviator/serverless/AviatorEngineFacade.ts`, injeta `SupabaseEngineStateRepository`, `SupabaseRealtimePublisher`, `ProvablyFairStrategy` e `AutoCashoutService`.
- **API Routes**: `app/api/aviator/tick|bets|cashout` expõem o backend serverless. O endpoint de tick exige `AVIATOR_TICK_SECRET` quando definido e pode ser acionado via Cron, pg_net ou o script `npm run tick:dev` (que usa `scripts/aviator-tick-dev.mjs`).
- **Client tick fallback**: `AviatorController` chama `/api/aviator/tick` no cliente quando `NEXT_PUBLIC_AVIATOR_ENABLE_CLIENT_TICK` ≠ `0`, mantendo o loop ativo em desenvolvimento sem cron jobs externos.
- **Command Routes/Actions**: `POST /api/aviator/bets`, `POST /api/aviator/cashout` e Server Actions equivalentes chamam a fachada.
- **Repositories** (DIP): `RoundRepository`, `BetRepository`, `WalletRepository`. Implementações usam `getSupabaseServiceRoleClient()` e funções RPC (`perform_bet`, `perform_cashout`).
- **Realtime Adapter**: usa `supabase.channel(...).send()` apenas quando precisa publicar snapshots adicionais (histórico, overrides). Atualizações rotineiras dependem de `postgres_changes` nas tabelas.

## 4. Fluxos
### 4.1 Tick (`POST /api/aviator/tick`)
1. **Carregar contexto**: busca registro em `engine_state` (nova tabela) com `current_round_id`, `phase`, `phase_started_at` e `settings` (durations, RTP).
2. **Delegar para o estado atual** (`GameStateMachine`):
   - `AwaitingBetsState`: verifica se `betting_window` expirou → fecha round, gera seed (`Crypto.randomUUID`), grava `game_rounds` status `flying` e retorna transição.
   - `FlyingState`: calcula `multiplier` baseado em `CrashStrategy`. Se atingiu `crashMultiplier`, marca `crashed` e deriva autopayouts (gera comandos internos via `CommandBus`).
   - `CrashedState`: finaliza round, alimenta histórico, cria próximo round (`awaitingBets`).
3. **Persistir**: atualiza `engine_state` + `game_rounds`. Usa transação `pg` (via `postgrest.rpc('perform_tick', ...)` planejada).
4. **Publicar**:
   - `postgres_changes` já dispara eventos para `game_rounds`/`bets`.
   - Para mensagens agregadas (`game.history`, `commands.*`), `RealtimeAdapter` emite broadcast.
5. **Responder** `200 OK` com um resumo do estado atual (usado pelo monitoramento e pelo script `tick:dev`).

### 4.1.1 Execução
- **Produção**: configure um agendamento (Vercel Cron, Supabase pg_net, GitHub Actions) que faça `POST /api/aviator/tick` com o header `x-aviator-secret: $AVIATOR_TICK_SECRET`.
- **Desenvolvimento**: rode `npm run tick:dev` (usa `scripts/aviator-tick-dev.mjs`) ou mantenha `NEXT_PUBLIC_AVIATOR_ENABLE_CLIENT_TICK=1` para que a própria UI acione o endpoint periodicamente.

### 4.2 Bet (`POST /api/aviator/bets` / `placeBetAction`)
1. Validar payload (limites, rodadas).
2. Ler `engine_state` para garantir fase `awaitingBets` + `round_id` atual.
3. Executar `perform_bet` RPC dentro do handler (Command).
4. Publicar resultado no canal `commands.bet` e retornar snapshot.

### 4.3 Cashout (`POST /api/aviator/cashout` / `cashoutAction`)
1. Validar `ticketId` pertence ao usuário.
2. Capturar multiplicador vigente consultando `engine_state` caso `flying`.
3. Executar `perform_cashout` RPC (Command) que credita wallet.
4. Broadcast `CashoutResult` + atualizar `bets`.

## 5. Clean Code & SOLID
- **SRP**: cada state/command tem única razão para mudar.
- **OCP**: adicionar novo modo de jogo/multiplicador exige só nova `Strategy`.
- **LSP**: estados concretos implementam mesma interface, permitindo substituição sem quebrar `GameStateMachine`.
- **ISP**: handlers dependem apenas de interfaces (`RoundStore`, `Publisher`, `Clock`), não de implementações completas.
- **DIP**: dependências recebem interfaces via construtor (injeção manual simples). Facilita testes com mocks (`InMemoryRoundRepository`).
- **Clean Code**: nomes explícitos (`AwaitingBetsState`), funções pequenas (cada step < 25 linhas) e comentários apenas para justificar escolhas (ex.: motivo do RTP fixo).

## 6. Plano de Implementação
1. **Infra mínima**
   - Criar tabela `engine_state` e view `current_round_view`.
   - Habilitar `pg_net` + `pg_cron` no Supabase e agendar `perform_tick` chamando o endpoint Vercel.
2. **Módulo de domínio (`src/modules/aviator/serverless/`)**
   - `types.ts`: contratos (`EngineState`, `TickResult`, `BetCommand`).
   - `strategies/ProvablyFairStrategy.ts`, `strategies/FixedStrategy.ts`.
   - `state/` com estados concretos + `GameStateMachine` (Template Method + State).
   - `commands/PlaceBetCommandHandler.ts`, `CashoutCommandHandler.ts` reutilizando RPCs.
   - `infra/RealtimeAdapter.ts`, `infra/SupabaseRoundRepository.ts`.
   - `AviatorEngineFacade.ts` conectando tudo.
3. **API / Server Actions**
   - `app/api/aviator/tick/route.ts` (background only, protege com header secreto).
   - `app/api/aviator/bets/route.ts` + `app/api/aviator/cashout/route.ts` (REST) reutilizados por Server Actions.
   - Atualizar `app/actions/aviator.ts` para chamar diretamente a fachada (sem HTTP externo).
4. **Realtime wiring**
   - Atualizar `docs/api/asyncapi/aviator.yaml` removendo `nodeBroadcast` e documentando canais/rotas novos.
   - Ajustar `AviatorRealtimeClient` se precisarmos escutar `postgres_changes` extras.
5. **Testes**
   - Vitest cobrindo `GameStateMachine` e `CrashStrategy`.
   - Novo mock do repositório para validar comandos sem tocar no Supabase.
6. **Observabilidade**
   - Adicionar logs estruturados (`console.log(JSON.stringify(...))`) nas rotas serverless.
   - Dashboard no Supabase para acompanhar `engine_state`.

## 7. Próximos Passos
- Priorizar itens 1–3 acima para liberar um MVP dentro da Fase 4.
- Em seguida, ligar HUD ao novo `commands.*` + `wallets` para testes internos.
- Só depois migrar documentação e checklist.
- Manter o plano de implementação deste arquivo sincronizado sempre que o engine sofrer ajustes.
- Ao iniciar o código, refletir as interfaces `RoundRepository`, `Publisher` e `CrashStrategy` para preservar os limites SOLID descritos aqui.

> Todo o desenho mantém o foco nos padrões pedidos (Observer, State, Strategy, Command, Template Method e Facade) porque eles equilibram simplicidade, extensibilidade e respeito às restrições serverless do projeto.
