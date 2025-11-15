# Documentação Arquitetural

- `node-service.md`: responsabilidades e requisitos operacionais do serviço Node externo.
- `node-realtime-flow.excalidraw` / `.svg`: diagrama do fluxo Node → Supabase Realtime →
  clientes Next.js.
- `milestone-checklist.md`: lista de verificação por milestone com caixas de seleção.

Todos os arquivos devem ser atualizados antes de cada revisão oficial.

## Fluxo de Saques (Fase 3)

- **Padrão aplicado:** `State` foi adotado para representar os ciclos `pending → approved/rejected` das solicitações. Cada estado concreta implementa apenas as transições válidas, mantendo o Princípio da Responsabilidade Única e abrindo espaço para extensões futuras (ex.: `processing`) sem alterar estados existentes (OCP).
- **Orquestração:** `WithdrawService` cumpre o papel de fachada interna. Ele injeta o repositório (`WithdrawRepository`) via construtor (DIP) e delega aprovações/rejeições à máquina de estados, garantindo regras coerentes mesmo que o storage mude.
- **Server Actions:**
  - `requestWithdrawAction` valida input do usuário e chama o serviço para criar registros.
  - `updateWithdrawStatusAction` é invocada pelos formulários do painel admin, chama `approve`/`reject` e revalida `/admin/withdrawals`.
- **Motivação arquitetural:** Entre os padrões listados (Adapter, Command, Facade, State etc.), o **State** encapsula melhor a evolução de status, enquanto a combinação `Service + Repository` atua como uma espécie de `Facade` para manter o código de UI limpo. Esse desenho respeita Clean Code (nomes claros, funções curtas) e SOLID (SRP/DIP), além de permitir testes unitários focados em cada camada.

## Plano Fase 4 – Loop do Aviator

- **Padrões principais:**
  - **Observer** para distribuição dos eventos de rodada (`game.state`, `game.history`) via Supabase Realtime; o serviço Node publica como *subject* e clientes Next/Admin consomem como *observers*.
  - **State** para o ciclo do jogo (`awaitingBets`, `flying`, `crashed`), garantindo regras claras para entrada/saída e habilitando simulações no backend.
  - **Strategy** para o cálculo do multiplicador/cashout (permite alternar entre RNG provably-fair e seeds controladas pelo admin sem modificar o restante do loop).
  - **Command** para apostas/cashouts: cada requisição vira um comando validado no servidor, aplicando SRP e deixando fácil auditar/registrar.
- **Serviço Node (supabase/functions ou worker dedicado):** expõe APIs `POST /bets` e `POST /cashout` que instanciam os comandos, validam saldo (Reuse `WalletRepository`) e emitem eventos no canal observer.
- **Integração com Next.js:**
  - Server Actions `placeBetAction` e `cashoutAction` atuam como fachada, chamando o serviço Node (ou Supabase Edge Function) e revalidando o saldo.
  - UI do jogo consome os canais `game.state` e `game.history` através de um adapter em `src/lib/realtime`, mantendo hooks finos no cliente.
- **Testes e e2e:**
  - Vitest cobre multiplicador (`Strategy`) e máquina de estados do loop.
  - Playwright (nova suíte `tests/e2e/aviator.spec.ts`) verifica “apostar → cashout → atualizar saldo”.
- **Próximos passos imediatos:**
  1. Especificar contratos (`BetCommand`, `CashoutCommand`, payloads Realtime) em `docs/api/asyncapi/aviator.yaml`.
  2. Prototipar o serviço Node com *Observer + State + Strategy* e hooks de auditoria.
  3. Criar o adapter Realtime no front e componentes básicos do jogo.
