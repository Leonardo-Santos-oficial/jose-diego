# Documentação Arquitetural

- `node-service.md`: responsabilidades e requisitos operacionais do serviço Node externo.
- `aviator-serverless.md`: nova proposta para rodar o Aviator como funções serverless dentro do
  mesmo deploy Vercel (Observer + State + Strategy + Command + Template Method).
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

- Consulte `aviator-serverless.md` para o desenho atualizado que substitui o serviço Node por
  funções serverless dentro do Next.js. O documento mantém os padrões originais (Observer, State,
  Strategy, Command) e adiciona Template Method + Facade para simplificar o tick loop.

- **Testes e e2e:**
  - Vitest cobre multiplicador (`Strategy`) e máquina de estados do loop.
  - Playwright (nova suíte `tests/e2e/aviator.spec.ts`) verifica “apostar → cashout → atualizar saldo”.
- **Próximos passos imediatos:**
  1. Especificar contratos (`BetCommand`, `CashoutCommand`, payloads Realtime) em `docs/api/asyncapi/aviator.yaml`.
  2. Implementar o engine serverless descrito no novo documento e publicar eventos via Supabase.
  3. Criar o adapter Realtime no front e componentes básicos do jogo.
