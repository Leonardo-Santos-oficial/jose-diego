# Roadmap Prioritário – Fases 1 a 3

Objetivo: liberar um fluxo mínimo navegável (Landing → Cadastro/Login → Dashboard com saldo e pedidos de saque/deposito simulados) antes de iniciar o jogo Aviator.

## Visão Geral

| Fase | Escopo resumido | Entrega mínima |
| --- | --- | --- |
| Fase 1 | Autenticação, shell do app, roteamento admin | Usuário consegue criar conta, fazer login, diferenciar rota /admin |
| Fase 2 | Landing page institucional | Página pública com hero em vídeo, CTA para modal de login/cadastro |
| Fase 3 | Saldo, depósitos/saques simulados, painel admin básico | Usuário vê saldo, solicita deposito/saque; admin aprova atualizações |

## Backlog Detalhado

### Fase 1 – Autenticação e Layout Base
1. **Auth Modal (US-101/102)**
   - Componentes `AuthModal` + hooks para abrir/fechar.
   - Integração Supabase Auth (email/senha) com server actions.
2. **Perfil do Usuário (US-103)**
   - Página `app/(user)/profile/page.tsx` com form para dados Pix/bancários (`user_profiles`).
   - Server action `updateProfile` com validação e RLS.
3. **App Shell + Proteções**
   - Layout compartilhado com header (saldo, avatar, botão depositar).
   - Middleware que redireciona `/admin` pra login caso `role !== 'admin'`.
4. **Infra**
   - Migrations para `user_profiles` e colunas extras (pix_key, bank_name, account_type).
   - Testes Vitest para actions de auth/perfil.

### Fase 2 – Landing Page
1. **Hero c/ vídeo**
   - Componente que aceita MP4/WEBM otimizado, overlay com título, subtítulo e CTA.
2. **Conteúdo Institucional**
   - Seções "Como funciona", "Demonstração", cards com features.
   - Sidebar/links para jogos futuros.
3. **CTA Modal**
   - Botões "Login" e "Cadastrar" reutilizando `AuthModal`.
4. **Performance e SEO**
   - `metadata` no `app/page.tsx`, imagens otimizadas, lazy loading.
   - Testes Lighthouse automatizados (script npm) para garantir LCP < 2.5s.

### Fase 3 – Sistema de Saldo e Admin Básico
1. **Schema Financeiro**
   - Tabelas: `wallets`, `wallet_transactions`, `withdraw_requests` conforme PRD.
   - Server action para alterar saldo (admin) com checagens (REQ-SEC-11/12).
2. **Fluxo de Depósito Simulado (US-202)**
   - Botão “Depositar” abre chat ou form pré-formatado.
   - Admin cria transação `deposit_pending` em `wallet_transactions`.
3. **Fluxo de Saque Simulado (US-203/204)**
   - Usuário solicita saque -> cria `withdraw_request` + trava saldo.
   - Admin lista pedidos, muda status para Pendente/Aprovado/Recusado.
4. **Dashboard Admin Básico (ADMIN-501/502/505)**
   - Lista usuários + saldo atual (consulta `wallets`).
   - Ações: ajustar saldo, aprovar depósitos/saques.
5. **UI Usuário: Saldo e Histórico**
   - Header com saldo sincronizado (server action ou SWR + Supabase).
   - Página "Minha Carteira" mostrando histórico recente.
6. **Testes/Observabilidade**
   - Vitest cobrindo server actions de saldo, RLS.
   - Plano de seed (scripts) para dados demo.

## Sequenciamento Sugerido
1. Finalizar migrations e server actions de auth (Fase 1).
2. Construir landing + modal reutilizando auth (Fase 2).
3. Implementar `wallets` e dashboard admin mínimo (Fase 3).
4. Quando fluxo completo estiver estável, iniciar Fase 4 (jogo Aviator).

## Métricas de Pronto
- Usuário consegue: registrar, logar, atualizar perfil Pix, solicitar saque/deposito, ver saldo.
- Admin consegue: entrar em `/admin`, ver usuários, ajustar saldo, aprovar requisições.
- Landing atende check-list: hero em vídeo, CTA funcionando, conteúdo responsivo.
