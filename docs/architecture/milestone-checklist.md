# Checklist de Milestones

Cada marco só é liberado após revisão com o proprietário do produto.

## M0 – Setup
- [ ] Next.js 16.0.3 + TypeScript inicializados (`web/`)
- [ ] Ferramentas definidas (ESLint, Prettier, Vitest, Playwright)
- [ ] Supabase provisionado e `supabase/schema.sql` aplicado
- [ ] `.env.example` revisado
- [ ] `docs/api/openapi.yaml` e `docs/api/asyncapi/aviator.yaml` criados

## M1 – Auth & Landing
- [x] Modais de cadastro/login integrados ao Supabase Auth
- [x] Landing com hero em vídeo e CTA conforme PRD
- [x] Header + Sidebar responsivos com saldo placeholder
- [x] Middleware de rotas protegidas para usuário/admin
- [ ] Componentes base padronizados com shadcn/ui (botões, inputs, cards)
- [ ] Documentação atualizada com endpoints Auth/Landing

## M2 – Carteira & Admin
- [x] Painel `/admin` com role guard
- [x] Lista de usuários + ajuste manual de saldo (Command)
- [ ] Perfil do usuário com dados Pix
- [x] Fluxo de solicitação de saque + status
- [ ] Swagger/AsyncAPI atualizados + revisão do proprietário

## M3 – Jogo Aviator e Serviço Node
- [ ] Serviço Node externo configurado (State/Strategy/Observer)
- [ ] Canais `game.state` e `game.history` publicando via Supabase Realtime
- [ ] APIs de apostas/cashout documentadas e implementadas
- [ ] UI do jogo consumindo eventos em tempo real
- [ ] Testes unitários da lógica do multiplicador

## M4 – Chat Realtime
- [ ] Canais 1:1 usuário ↔ admin com persistência
- [ ] UI de chat no painel admin com notificações
- [ ] UI de chat do usuário integrada ao layout
- [ ] AsyncAPI descrevendo mensagens e notificações
- [ ] Revisão PRD↔Swagger concluída

## M5 – Testes, Performance e Handoff
- [ ] Vitest cobrindo lógica crítica (saldo, jogo, saque)
- [ ] Playwright garantindo fluxos principais
- [ ] Relatórios Lighthouse + A11y dentro das metas
- [ ] Documentação final atualizada (`docs/api`, `docs/architecture`)
- [ ] OK final do proprietário para entrega
