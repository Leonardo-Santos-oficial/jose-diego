# Aviator – Crash Game Demo

Sistema completo de crash game no estilo Aviator, com autenticação Supabase, realtime via Node service e frontend Next.js 16.

## 🚀 Deploy Rápido (Vercel)

### Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Projeto Supabase configurado (veja [Configuração Supabase](#configuração-supabase))

### Passos

1. **Importe o repositório no Vercel**
   - Acesse [vercel.com/new](https://vercel.com/new)
   - Selecione este repositório (`Leonardo-Santos-oficial/jose-diego`)
   - Framework preset: **Next.js**
   - Root Directory: `web`

2. **Configure as variáveis de ambiente**
   
   No painel da Vercel, adicione:
   
   | Nome | Valor | Onde Obter |
   |------|-------|------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<seu-projeto>.supabase.co` | Painel do Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Painel do Supabase → Settings → API → anon (public) |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Painel do Supabase → Settings → API → service_role (secret) |

3. **Deploy**
   - Clique em **Deploy**
   - A Vercel irá:
     - Instalar dependências (`npm install` na pasta `web/`)
     - Rodar `npm run build`
     - Publicar o app

4. **Verifique**
   - Acesse o domínio gerado (ex.: `aviator-demo.vercel.app`)
   - Teste o login/cadastro na landing page
   - Clique em "Aviator" para entrar no jogo

---

## 📦 Estrutura do Projeto

```
.
├── web/                    # Next.js 16 app (frontend + server actions)
│   ├── app/                # App Router (landing, /app, /admin)
│   ├── src/
│   │   ├── components/     # Aviator HUD, modals, admin tables
│   │   ├── lib/            # Auth proxy, Supabase clients, realtime
│   │   └── modules/        # Domínios isolados (aviator, wallet, withdraw)
│   ├── supabase/           # Schema SQL + testes
│   └── tests/              # Vitest + Playwright E2E
├── node-service/           # Node.js realtime engine (game loop)
├── docs/                   # Arquitetura, API specs (OpenAPI/AsyncAPI)
└── objectTypes/            # Construct 3 project (assets originais)
```

---

## 🛠️ Configuração Supabase

### 1. Crie um novo projeto
- [dashboard.supabase.com](https://dashboard.supabase.com)
- Anote: **URL do projeto** e **service_role key**

### 2. Execute o schema
```sql
-- Cole o conteúdo de web/supabase/schema.sql no SQL Editor
-- Cria tabelas: profiles, wallets, game_rounds, bets, withdrawals
```

### 3. Configure Row Level Security (RLS)
O schema já inclui as policies necessárias:
- `profiles`: usuários só veem o próprio perfil
- `wallets`: RLS por `user_id`
- `bets`: jogadores só veem próprias apostas; admin vê tudo
- `withdrawals`: similar a bets

### 4. Habilite Realtime (opcional para admin)
- Database → Replication → habilite `game_rounds`, `bets`
- Usado no painel admin para monitoramento ao vivo

---

## 🧪 Desenvolvimento Local

### Instalação

```powershell
# Clone o repo
git clone https://github.com/Leonardo-Santos-oficial/jose-diego.git
cd jose-diego/web

# Instale dependências
npm install

# Configure .env.local (copie de .env.example)
cp .env.example .env.local
# Edite .env.local com suas chaves Supabase
```

### Rodar dev server

```powershell
npm run dev
# Acesse http://localhost:3000
```

### Testes

```powershell
# Unit tests (Vitest)
npm run test

# E2E smoke (Playwright)
npm run test:e2e

# E2E com UI interativa
npm run test:e2e:ui
```

---

## 🔐 Autenticação

- **Landing (`/`)**: modal signup/login usando Supabase Auth
- **App (`/app`)**: protegido por middleware; redireciona não-autenticados
- **Admin (`/admin`)**: requer role `admin` (configure manualmente no Supabase)

### Criar usuário admin

```sql
-- No SQL Editor do Supabase
UPDATE profiles
SET role = 'admin'
WHERE email = 'seu-email@dominio.com';
```

---

## 📡 Realtime Engine (Node Service)

O `node-service/` roda o loop do jogo (crash multiplier, broadcasts via Supabase Realtime).

**Deploy separado** (Railway, Render, etc.):
- Variáveis necessárias: mesmas do frontend (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Comando: `npm run build && npm start`

---

## 🎯 Roadmap / Melhorias Futuras

- [ ] CI/CD via GitHub Actions
- [ ] Internacionalização (i18n)
- [ ] Sistema de notificações push
- [ ] Dashboard analítico com gráficos
- [ ] Modo torneio/ranking

---

## 📄 Licença

Projeto de demonstração. Ajuste conforme necessário para uso comercial.
