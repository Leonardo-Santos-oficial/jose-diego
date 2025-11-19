# Plano de Execução do PRD 1.2

## Padrões de Projeto Guias

- **Observer + State (core do jogo Aviator e chat)**: já adotado na engine (`AviatorEngineFacade`, canais Realtime) e continua sendo o padrão ideal para propagar estado assíncrono (PRD §4.3). Todos os novos fluxos em tempo real (chat, notificações de saque/deposito) devem expor um *Subject* (canal Supabase) e *Observers* (clientes).
- **Command (server actions/Admin)**: cada mutação sensível (ajustar saldo, solicitar saque/deposito, enviar mensagem) deve ser encapsulada em comandos (`server actions`) com validações independentes, permitindo log/auditoria e aderindo ao SRP.
- **Facade (Serviços Supabase)**: serviços como `WithdrawService`, `DashboardService` já atuam como Facade para consultas agregadas. Novas features devem seguir o mesmo padrão para manter o OCP (extensão sem modificar chamadas existentes).
- **Strategy**: validações/calculadoras do Aviator (ex.: políticas de RTP, algoritmos Provably Fair) serão pluggables, permitindo troca sem alterar o restante da engine.

## Tickets / Branches Sugeridos

| ID | Fase PRD | Descrição | Principais Padrões | Saída Esperada |
|----|----------|-----------|--------------------|----------------|
| F3-T1 | Fase 3.1 | **Admin • Usuários & Saldos**: concluir UI com filtros, histórico resumido, logs de comandos. | Command, Facade | `/app/admin` com tabela filtrável, logs em modal. |
| F3-T2 | Fase 3.2 | **Fluxo de Saque**: complementar request dialog (status feedback), admin_actions audit, notificações usuário. | Command, State | Status atualizado em tempo real + toasts no `/app`. |
| F3-T3 | Fase 3.2 | **Depósito Simulado**: botão "Depositar" abre modal para criar `deposit_requests`, admin aprova no painel. | Command, State | Novas tabelas `deposit_requests`, UI admin. |
| F4-T1 | Fase 4.1/4.2 | **Provably Fair + RTP**: expor seed configurável e visão admin para forçar rodada. | Strategy, Observer | Config page e APIs no `node-service`. |
| F4-T2 | Fase 4.3 | **UI duas apostas**: permitir até 2 tickets/client com controles independentes. | State | Novo componente `DualBetPanel`. |
| F4-T3 | Fase 4.4 | **Histórico de velas e cores** integrado ao store e UI. | Observer | Componente `AviatorHistory` persistente. |
| F5-T1 | Fase 5.1 | **Estrutura Chat**: APIs + tabelas indexadas, uso do Supabase Realtime. | Observer, Mediator | `ChatService`, canal `chat.sessions`. |
| F5-T2 | Fase 5.1/5.2 | **Chat Usuário**: widget em `/` e `/app` com sanitização e fallback offline. | Observer, Command | `ChatWidget` client component. |
| F5-T3 | Fase 5.2/5.4 | **Chat Admin**: painel `/admin/chat` com múltiplas conversas e alertas. | Mediator, Observer | Inbox com filtro por status. |
| F6-T1 | Fase 6 | **Testes & Segurança**: ampliar Vitest/Playwright, rate limiting, headers. | Facade, Command | Suites documentadas + CI gates. |

Cada ticket deve virar branch dedicada (`feature/f3-t1-admin-log`, etc.) para facilitar revisão.

## Prioridade Imediata

1. **F5-T1 — Infra do Chat** (pré-requisito para US-202/401/402). 
2. **F3-T3 — Depósito Simulado** (consome o chat para criar tickets de depósito). 
3. **F4-T2 — Duas Apostas** (feature core do jogo). 

### Backlog Técnico

- Migrar `supabase/schema.sql` para migrações versionadas (evita divergência).
- Instrumentar `supabaseAuthProxy` para logs estruturados.
- Criar lint rule custom para impedir `dangerouslySetInnerHTML`.

> Após concluir cada ticket, atualizar este plano e o README com status e passos de deploy.
