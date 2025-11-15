# Plano Playwright – Fluxo Admin Realtime

## Objetivos
- Validar ponta a ponta o requisito **ADMIN-502** (ajuste manual de saldo) e avisos de concorrência descritos no PRD.
- Garantir que eventos emitidos pelo `SupabaseTimelineMock` sejam refletidos na UI sem regressões visuais.
- Documentar dados, rotas e *toggles* necessários para que o time consiga automatizar o cenário no CI usando `playwright test`.

## Matriz de Cenários (Prioridade Alta)
| Cenário | Descrição | Dados/Mochila | Verificações | Observações |
| --- | --- | --- | --- | --- |
| `ARF-01` | Crédito bem-sucedido no usuário VIP | Usuário `high-roller` com saldo 1200 (seed via `SupabaseTimelineMock`) | Toast "Crédito aplicado", linha atualiza para R$ 1.400, evento `wallet_adjusted` emitido | Cobra caminho feliz | 
| `ARF-02` | Erro por snapshot desatualizado | Reutilizar VIP, injetar mensagem de erro no `resultQueue` | UI exibe alerta "Saldo desatualizado" e mantém saldo antigo | Reproduz corrida de simultaneidade |
| `ARF-03` | Débito subsequente em outro usuário | Usuário `starter` com saldo 75 | Saldo cai para 60, timeline registra 2º evento | Garante independência por linha |
| `ARF-04` | Telemetria timeline | Após `ARF-01` + `ARF-03`, endpoint `/api/tests/realtime-feed` retorna eventos esperados | API responde 200 + payload com 2 registros | Suporta dashboards futuros |

## Estratégia Técnica
1. **Flag E2E**: usar `process.env.NEXT_PUBLIC_E2E=1` para expor rota `/admin/e2e-realtime` que monta `AdminUserTable` com `SupabaseTimelineMock` já embarcado.
2. **Injeção de Respostas**: criar handler em `/app/api/tests/admin-adjust` que consome payloads vindos do Playwright e preenche `resultQueue` reutilizando `tests/mocks/supabaseTimeline.ts`.
3. **Atalho Playwright**:
   - `test.use({ storageState: 'playwright/.auth/admin.json' })` para logar como admin.
   - Script auxiliar `tests/e2e/utils/resultQueue.ts` faz `await page.request.post('/api/tests/admin-adjust', { data: [...] })` antes de cada caso.
4. **Sincronização**: após cada submit, esperar `page.getByRole('status').filter({ hasText: ... })` ou `expect.poll` no saldo renderizado.

## Preparação de Dados
- Basear-se no mesmo *seed* de `createDemoTimelineMock()` para garantir paridade com os testes de Vitest.
- Se Supabase real estiver conectado, criar *schema* de apoio `test_support.admin_events` apenas para ambientes `NEXT_PUBLIC_E2E` e limpar via `DELETE` ao término do teste.
- Arquivo `playwright/.auth/admin.json` deve ser gerado executando `npx playwright test tests/e2e/login.setup.ts` (ainda inexistente; incluir no backlog).

## Automação (Passo a Passo)
1. Criar rota `app/api/tests/admin-result-queue/route.ts` protegida por `NEXT_PUBLIC_E2E`. Ela aceitará `POST { queue: AdminActionState[] }` e populará `resultQueue` exportado de `tests/mocks/supabaseTimeline`.
2. Adicionar página `app/admin/realtime-e2e/page.tsx` que renderiza `AdminUserTable` com os `sampleUsers`. Página fica atrás de `if (!process.env.NEXT_PUBLIC_E2E) notFound()`.
3. Nova suite `tests/e2e/admin-realtime.spec.ts`:
   - `test.beforeEach` chama helper para semear fila e resetar timeline via `page.request.post('/api/tests/timeline/reset')`.
   - `test('processa crédito e débito encadeados', ...)` cobre `ARF-01` a `ARF-03`.
   - `test('exibe feed de eventos', ...)` cobre `ARF-04` consultando `/api/tests/realtime-feed`.
4. Atualizar `package.json` com script `"dev:e2e": "NEXT_PUBLIC_E2E=1 next dev"` (Windows: usar `cross-env`).
5. Adicionar documentação no `README.md` explicando como rodar: `npm run dev:e2e` + `npm run test:e2e -- admin-realtime`.

## Riscos e Mitigações
- **Avisos `useActionState`**: antes de gravar vídeos Playwright, atualizar `AdminUserTable` para deslocar `submitReactActionForm` para `startTransition`; evita spam no log.
- **Supabase externo**: se o ambiente CI não puder tocar no Supabase real, prover *mocks* via arquivos JSON para `wallets` e `events`. Pode-se aproveitar `SupabaseTimelineMock` direto no API route.
- **Flakiness**: os toasts usam timers; envolver asserts em `await expect.poll` limita falsos negativos.

## Próximas Entregas
1. Implementar rotas de suporte (`admin-result-queue`, `timeline/reset`, `realtime-feed`).
2. Criar storage state Playwright para usuário admin.
3. Escrever `tests/e2e/admin-realtime.spec.ts` seguindo matriz acima.
4. Integrar `npm run test:e2e` ao pipeline após estabilizar.
