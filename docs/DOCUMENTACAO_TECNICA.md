# Documentação Técnica - Plataforma Aviator

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Configuração do Ambiente](#4-configuração-do-ambiente)
5. [Banco de Dados](#5-banco-de-dados)
6. [APIs e Endpoints](#6-apis-e-endpoints)
7. [Autenticação e Autorização](#7-autenticação-e-autorização)
8. [Sistema de Tempo Real](#8-sistema-de-tempo-real)
9. [Motor do Jogo (Engine)](#9-motor-do-jogo-engine)
10. [Sistema de Upload](#10-sistema-de-upload)
11. [Sistema de Chat](#11-sistema-de-chat)
12. [Painel Administrativo](#12-painel-administrativo)
13. [Testes](#13-testes)
14. [Deploy e Infraestrutura](#14-deploy-e-infraestrutura)
15. [Manutenção e Troubleshooting](#15-manutenção-e-troubleshooting)
16. [Roadmap e Features Futuras](#16-roadmap-e-features-futuras)

---

## 1. Visão Geral da Arquitetura

### 1.1 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTE (Browser)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │   Next.js App   │  │  Realtime WS    │  │  Supabase Client   │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────┬───────────┘  │
└───────────┼─────────────────────┼─────────────────────┼──────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌───────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Vercel Edge     │  │   Node Service      │  │   Supabase Cloud    │
│   (Next.js SSR)   │  │   (Game Engine)     │  │   (BaaS)            │
│                   │  │                     │  │                     │
│  - Server Actions │  │  - Socket.IO        │  │  - PostgreSQL       │
│  - API Routes     │  │  - Game Loop        │  │  - Realtime         │
│  - Middleware     │  │  - Bet Processing   │  │  - Storage          │
└───────────────────┘  └─────────────────────┘  │  - Auth             │
                                                └─────────────────────┘
```

### 1.2 Fluxo de Dados

```
Usuário ──> Next.js ──> Server Actions ──> Supabase
                │
                └──> API Routes ──> Node Service (Engine)
                            │
                            └──> Supabase Realtime ──> Broadcast para clientes
```

### 1.3 Principais Componentes

| Componente | Responsabilidade |
|------------|------------------|
| **Next.js App** | Frontend React, SSR, Server Actions |
| **Node Service** | Motor do jogo, WebSocket, processamento de apostas |
| **Supabase** | Banco de dados, autenticação, storage, realtime |
| **Vercel** | Hospedagem do frontend, edge functions |

---

## 2. Stack Tecnológica

### 2.1 Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 15.x | Framework React com App Router |
| **React** | 19.x | Biblioteca UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 3.x | Estilização utility-first |
| **shadcn/ui** | latest | Componentes UI |
| **Lucide React** | latest | Ícones |
| **Zod** | 3.x | Validação de schemas |

### 2.2 Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 20.x | Runtime JavaScript |
| **Fastify** | 4.x | Framework HTTP |
| **Socket.IO** | 4.x | WebSocket realtime |
| **TypeScript** | 5.x | Tipagem estática |
| **Pino** | 8.x | Logging |

### 2.3 Banco de Dados e Serviços

| Tecnologia | Uso |
|------------|-----|
| **Supabase** | BaaS (Backend as a Service) |
| **PostgreSQL** | Banco de dados relacional |
| **Supabase Realtime** | Comunicação em tempo real |
| **Supabase Storage** | Armazenamento de arquivos |
| **Supabase Auth** | Autenticação |

### 2.4 Ferramentas de Desenvolvimento

| Ferramenta | Uso |
|------------|-----|
| **Vitest** | Testes unitários |
| **Playwright** | Testes E2E |
| **ESLint** | Linting |
| **Prettier** | Formatação de código |
| **tsup** | Bundling do Node Service |
| **PM2** | Gerenciador de processos |

---

## 3. Estrutura do Projeto

### 3.1 Estrutura Geral

```
projeto/
├── web/                    # Frontend Next.js
│   ├── app/               # App Router (páginas e rotas)
│   ├── src/               # Código fonte
│   │   ├── components/    # Componentes React
│   │   ├── modules/       # Módulos de domínio
│   │   ├── lib/          # Bibliotecas e utilitários
│   │   ├── hooks/        # React Hooks customizados
│   │   └── config/       # Configurações
│   ├── public/           # Assets estáticos
│   └── supabase/         # Migrations e seeds
│
├── node-service/          # Backend Node.js (Engine)
│   ├── src/
│   │   ├── loop/         # Game loop
│   │   ├── strategy/     # Estratégias de crash
│   │   ├── services/     # Serviços de negócio
│   │   ├── routes/       # Rotas HTTP
│   │   └── publisher/    # Publicação de eventos
│   └── ecosystem.config.cjs  # Configuração PM2
│
├── docs/                  # Documentação
└── deploy/               # Scripts de deploy
```

### 3.2 Estrutura do Frontend (`web/`)

```
web/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Layout raiz
│   ├── page.tsx                 # Página inicial (/)
│   ├── app/                     # Área do jogo (/app)
│   ├── admin/                   # Painel admin (/admin)
│   ├── profile/                 # Perfil do usuário (/profile)
│   ├── beneficios/              # Programa de benefícios
│   ├── auth/                    # Callbacks de autenticação
│   ├── api/                     # API Routes
│   └── actions/                 # Server Actions
│
├── src/
│   ├── components/
│   │   ├── admin/              # Componentes do admin
│   │   ├── chat/               # Chat de suporte
│   │   ├── global-chat/        # Chat global
│   │   ├── game/               # Componentes do jogo
│   │   ├── profile/            # Componentes de perfil
│   │   └── components/ui/      # Componentes base (shadcn)
│   │
│   ├── modules/
│   │   ├── admin/              # Lógica do admin
│   │   ├── chat/               # Sistema de chat
│   │   ├── global-chat/        # Chat global
│   │   ├── upload/             # Sistema de upload
│   │   └── withdraw/           # Sistema de saques
│   │
│   ├── lib/
│   │   ├── auth/               # Autenticação
│   │   ├── supabase/           # Clientes Supabase
│   │   └── realtime/           # Clientes realtime
│   │
│   └── hooks/                  # React Hooks
│       ├── useAvatarUpload.ts
│       ├── useChatAttachmentUpload.ts
│       └── ...
```

### 3.3 Estrutura do Node Service

```
node-service/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Configuração Fastify
│   ├── logger.ts             # Configuração Pino
│   │
│   ├── loop/
│   │   ├── gameLoop.ts       # Loop principal do jogo
│   │   └── roundManager.ts   # Gerenciamento de rodadas
│   │
│   ├── strategy/
│   │   ├── crashStrategy.ts  # Interface de estratégias
│   │   └── defaultStrategy.ts # Estratégia padrão
│   │
│   ├── services/
│   │   ├── betService.ts     # Processamento de apostas
│   │   ├── walletService.ts  # Gerenciamento de carteira
│   │   └── roundService.ts   # Serviço de rodadas
│   │
│   ├── routes/
│   │   ├── health.ts         # Health check
│   │   └── admin.ts          # Rotas administrativas
│   │
│   └── publisher/
│       └── supabasePublisher.ts  # Publicação no Supabase
│
├── ecosystem.config.cjs      # PM2 config
├── tsconfig.json
└── tsup.config.ts
```

---

## 4. Configuração do Ambiente

### 4.1 Variáveis de Ambiente - Frontend (`web/.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Node Service
NEXT_PUBLIC_NODE_SERVICE_URL=http://localhost:3001
NODE_SERVICE_INTERNAL_URL=http://localhost:3001

# Auth
NEXTAUTH_SECRET=sua-chave-secreta
NEXTAUTH_URL=http://localhost:3000

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4.2 Variáveis de Ambiente - Node Service (`node-service/.env`)

```env
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Game Settings
GAME_TICK_INTERVAL=100
GAME_BET_PHASE_DURATION=10000
GAME_MIN_MULTIPLIER=1.0
GAME_MAX_MULTIPLIER=100.0

# Logging
LOG_LEVEL=info
```

### 4.3 Instalação e Execução

```bash
# Clone o repositório
git clone <repo-url>

# Frontend
cd web
npm install
npm run dev

# Node Service (outro terminal)
cd node-service
npm install
npm run dev
```

### 4.4 Scripts Disponíveis

**Frontend (`web/package.json`):**

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `next dev --turbopack` | Desenvolvimento com Turbopack |
| `build` | `next build` | Build de produção |
| `start` | `next start` | Inicia servidor de produção |
| `lint` | `next lint` | Executa ESLint |
| `test` | `vitest` | Executa testes |
| `test:e2e` | `playwright test` | Testes E2E |

**Node Service (`node-service/package.json`):**

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `tsx watch src/index.ts` | Desenvolvimento com hot reload |
| `build` | `tsup` | Build de produção |
| `start` | `node dist/index.js` | Inicia servidor |
| `test` | `vitest` | Executa testes |

---

## 5. Banco de Dados

### 5.1 Diagrama ER (Entidade-Relacionamento)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   auth.users    │     │  user_profiles  │     │    wallets      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────<│ user_id (FK,PK) │────<│ user_id (FK,PK) │
│ email           │     │ display_name    │     │ balance         │
│ created_at      │     │ avatar_url      │     │ updated_at      │
│ ...             │     │ pix_key         │     └─────────────────┘
└─────────────────┘     │ bank_*          │
                        └─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      bets       │     │ withdraw_requests│    │  chat_threads   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ user_id (FK)    │     │ user_id (FK)    │     │ user_id (FK)    │
│ round_id        │     │ amount          │     │ status          │
│ amount          │     │ status          │     │ created_at      │
│ cash_out_at     │     │ pix_key         │     │ updated_at      │
│ multiplier      │     │ bank_*          │     │ metadata        │
│ status          │     │ created_at      │     └────────┬────────┘
│ created_at      │     │ processed_at    │              │
└─────────────────┘     └─────────────────┘              │
                                                         ▼
                                                ┌─────────────────┐
                                                │  chat_messages  │
                                                ├─────────────────┤
                                                │ id (PK)         │
                                                │ thread_id (FK)  │
                                                │ user_id (FK)    │
                                                │ sender_role     │
                                                │ body            │
                                                │ attachment_url  │
                                                │ attachment_type │
                                                │ created_at      │
                                                └─────────────────┘
```

### 5.2 Tabelas Principais

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  pix_key TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  bank_holder_name TEXT,
  bank_holder_document TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `wallets`
```sql
CREATE TABLE wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `bets`
```sql
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  round_id TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  cash_out_at DECIMAL(10,2),
  multiplier DECIMAL(10,2),
  profit DECIMAL(15,2),
  status TEXT DEFAULT 'pending', -- pending, won, lost, cashed_out
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `withdraw_requests`
```sql
CREATE TABLE withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, paid, rejected
  pix_key TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  bank_holder_name TEXT,
  bank_holder_document TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);
```

#### `chat_threads`
```sql
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open', -- open, closed
  assigned_admin_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id)
);
```

#### `chat_messages`
```sql
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  sender_role TEXT NOT NULL, -- user, admin
  body TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT, -- image, document
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `global_chat_messages`
```sql
CREATE TABLE global_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Row Level Security (RLS)

```sql
-- Exemplo: Usuários só podem ver/editar seu próprio perfil
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Storage policies para avatars
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

### 5.4 Migrations

As migrations estão em `web/supabase/migrations/`. Para aplicar:

```bash
cd web
npx supabase db push
```

---

## 6. APIs e Endpoints

### 6.1 API Routes (Next.js)

#### Aviator Game

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/aviator/bets` | Criar nova aposta |
| POST | `/api/aviator/cashout` | Fazer cash out |
| POST | `/api/aviator/tick` | Tick do jogo (interno) |

**POST `/api/aviator/bets`**
```typescript
// Request
{
  "amount": 10.00,
  "roundId": "round-123"
}

// Response
{
  "success": true,
  "bet": {
    "id": "bet-uuid",
    "amount": 10.00,
    "roundId": "round-123",
    "status": "pending"
  }
}
```

**POST `/api/aviator/cashout`**
```typescript
// Request
{
  "betId": "bet-uuid",
  "multiplier": 2.50
}

// Response
{
  "success": true,
  "profit": 25.00,
  "multiplier": 2.50
}
```

#### Testes (Desenvolvimento)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/tests/wallet/topup` | Adicionar saldo (teste) |
| POST | `/api/tests/player-session/login` | Login de teste |
| POST | `/api/tests/timeline/reset` | Reset do jogo |
| GET | `/api/tests/realtime-feed` | Feed realtime (SSE) |

### 6.2 Server Actions

Server Actions são funções executadas no servidor, chamadas diretamente do cliente.

#### Autenticação (`app/actions/auth.ts`)

```typescript
// Login
export async function loginAction(formData: FormData): Promise<AuthActionState>

// Logout
export async function logoutAction(): Promise<void>

// Registro
export async function registerAction(formData: FormData): Promise<AuthActionState>
```

#### Perfil (`app/actions/profile.ts`)

```typescript
// Atualizar perfil
export async function updateProfileAction(formData: FormData): Promise<ProfileActionState>

// Atualizar configurações de saque
export async function updateWithdrawSettingsAction(formData: FormData): Promise<ProfileActionState>
```

#### Chat (`app/actions/chat.ts`)

```typescript
// Enviar mensagem (usuário)
export async function sendChatMessageAction(
  prevState: ChatActionState,
  formData: FormData
): Promise<ChatActionState>

// Enviar mensagem (admin)
export async function sendAdminMessageAction(
  prevState: ChatActionState,
  formData: FormData
): Promise<ChatActionState>

// Fechar thread
export async function closeChatThreadAction(formData: FormData): Promise<{ ok: boolean }>

// Atualizar metadata da thread
export async function updateChatThreadMetadataAction(formData: FormData): Promise<void>
```

#### Upload (`app/actions/upload-avatar.ts`)

```typescript
// Upload de avatar
export async function uploadAvatarAction(formData: FormData): Promise<UploadAvatarResult>

// Upload de anexo do chat
export async function uploadChatAttachmentAction(formData: FormData): Promise<UploadChatAttachmentResult>
```

#### Chat Global (`app/actions/global-chat.ts`)

```typescript
// Enviar mensagem global
export async function sendGlobalMessageAction(
  prevState: GlobalChatActionState,
  formData: FormData
): Promise<GlobalChatActionState>

// Buscar mensagens recentes
export async function getRecentGlobalMessagesAction(): Promise<GlobalChatMessage[]>
```

### 6.3 Node Service API

#### Health Check

```
GET /health

Response:
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2025-12-01T00:00:00Z"
}
```

#### Admin Routes

```
POST /admin/start-round
POST /admin/stop-round
GET /admin/status
```

---

## 7. Autenticação e Autorização

### 7.1 Fluxo de Autenticação

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────>│  Next.js    │────>│  Supabase   │
│   (Login)   │     │  Middleware │     │    Auth     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │    JWT Token      │
       │<──────────────────┼───────────────────│
       │                   │                   │
       │  Cookie com       │                   │
       │  Session Token    │                   │
       └───────────────────┘                   │
```

### 7.2 Middleware de Autenticação

```typescript
// web/src/middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  
  // Refresh session
  await supabase.auth.getSession();
  
  // Proteção de rotas
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/admin')) {
    // Verificar se é admin
    const session = await getCurrentSession();
    if (!isAdminSession(session)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return response;
}
```

### 7.3 Verificação de Admin

```typescript
// web/src/lib/auth/roles.ts
export function isAdminSession(session: Session | null): boolean {
  if (!session?.user) return false;
  
  const adminEmails = [
    'admin@example.com',
    'leonardosantosaki@gmail.com',
    // ... outros admins
  ];
  
  return adminEmails.includes(session.user.email ?? '');
}
```

### 7.4 Clientes Supabase

| Cliente | Uso | Arquivo |
|---------|-----|---------|
| `getSupabaseClient()` | Browser (client-side) | `lib/supabaseClient.ts` |
| `getSupabaseServerClient()` | Server Components/Actions | `lib/supabase/serverClient.ts` |
| `getSupabaseServiceRoleClient()` | Admin operations | `lib/supabase/serviceRoleClient.ts` |
| `createMiddlewareClient()` | Middleware | `lib/supabase/middlewareClient.ts` |

---

## 8. Sistema de Tempo Real

### 8.1 Arquitetura Realtime

```
┌─────────────────────────────────────────────────────────────┐
│                     Node Service                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Game Loop  │───>│  Publisher  │───>│  Supabase   │     │
│  │   (Tick)    │    │             │    │  Realtime   │     │
│  └─────────────┘    └─────────────┘    └──────┬──────┘     │
└──────────────────────────────────────────────────────────────┘
                                                │
                                                │ Broadcast
                                                ▼
┌──────────────────────────────────────────────────────────────┐
│                     Clientes (Browsers)                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Cliente 1  │    │  Cliente 2  │    │  Cliente N  │      │
│  │  (React)    │    │  (React)    │    │  (React)    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Canais Realtime

| Canal | Tipo | Uso |
|-------|------|-----|
| `aviator:game` | Broadcast | Estado do jogo (tick, rodadas) |
| `chat:support:{threadId}` | Broadcast | Mensagens de suporte |
| `chat:global` | Broadcast | Chat global |
| `bets:user:{userId}` | Postgres Changes | Atualizações de apostas |

### 8.3 Cliente Realtime (Frontend)

```typescript
// lib/realtime/aviatorClient.ts
export class AviatorRealtimeClient {
  private channel: RealtimeChannel;
  
  subscribe(callback: (event: AviatorEvent) => void) {
    this.channel = supabase
      .channel('aviator:game')
      .on('broadcast', { event: 'tick' }, (payload) => {
        callback(payload);
      })
      .on('broadcast', { event: 'round_start' }, (payload) => {
        callback(payload);
      })
      .on('broadcast', { event: 'round_end' }, (payload) => {
        callback(payload);
      })
      .subscribe();
  }
  
  dispose() {
    this.channel?.unsubscribe();
  }
}
```

### 8.4 Publisher (Node Service)

```typescript
// node-service/src/publisher/supabasePublisher.ts
export class SupabasePublisher {
  async publishTick(data: TickPayload) {
    await this.supabase
      .channel('aviator:game')
      .send({
        type: 'broadcast',
        event: 'tick',
        payload: data
      });
  }
  
  async publishRoundStart(data: RoundStartPayload) {
    await this.supabase
      .channel('aviator:game')
      .send({
        type: 'broadcast',
        event: 'round_start',
        payload: data
      });
  }
}
```

---

## 9. Motor do Jogo (Engine)

### 9.1 Game Loop

```typescript
// Ciclo simplificado do jogo
class GameLoop {
  private state: 'betting' | 'flying' | 'crashed' = 'betting';
  private multiplier: number = 1.0;
  private targetCrash: number;
  
  async tick() {
    switch (this.state) {
      case 'betting':
        // Fase de apostas (5-10 segundos)
        // Aceitar novas apostas
        break;
        
      case 'flying':
        // Avião voando, multiplicador subindo
        this.multiplier += 0.01;
        this.publishTick(this.multiplier);
        
        if (this.multiplier >= this.targetCrash) {
          this.crash();
        }
        break;
        
      case 'crashed':
        // Processar perdas
        // Iniciar nova rodada
        this.startNewRound();
        break;
    }
  }
}
```

### 9.2 Estratégia de Crash

```typescript
// Interface para estratégias de crash
interface CrashStrategy {
  pickTargetMultiplier(): number;
}

// Estratégia padrão (distribuição exponencial)
class DefaultCrashStrategy implements CrashStrategy {
  pickTargetMultiplier(): number {
    // Algoritmo que garante house edge
    const houseEdge = 0.05; // 5%
    const random = Math.random();
    
    // Distribuição exponencial inversa
    return Math.max(1.0, (1 / (1 - random * (1 - houseEdge))));
  }
}
```

### 9.3 Processamento de Apostas

```typescript
// Fluxo de aposta
async function processBet(userId: string, amount: number, roundId: string) {
  // 1. Verificar saldo
  const wallet = await getWallet(userId);
  if (wallet.balance < amount) {
    throw new Error('Saldo insuficiente');
  }
  
  // 2. Debitar saldo
  await debitWallet(userId, amount);
  
  // 3. Criar aposta
  const bet = await createBet({
    userId,
    amount,
    roundId,
    status: 'pending'
  });
  
  return bet;
}

// Fluxo de cash out
async function processCashOut(betId: string, multiplier: number) {
  // 1. Buscar aposta
  const bet = await getBet(betId);
  
  // 2. Calcular ganho
  const profit = bet.amount * multiplier;
  
  // 3. Creditar saldo
  await creditWallet(bet.userId, profit);
  
  // 4. Atualizar aposta
  await updateBet(betId, {
    status: 'cashed_out',
    multiplier,
    profit
  });
  
  return { profit, multiplier };
}
```

### 9.4 Estados do Jogo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   BETTING   │────>│   FLYING    │────>│   CRASHED   │
│  (5-10s)    │     │  (variável) │     │   (2-3s)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
       ▲                                        │
       └────────────────────────────────────────┘
```

---

## 10. Sistema de Upload

### 10.1 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │  FileValidator  │───>│  UploadFacade               │    │
│  │  (client-side)  │    │  (validação + estratégia)   │    │
│  └─────────────────┘    └──────────────┬──────────────┘    │
└────────────────────────────────────────┼────────────────────┘
                                         │
                                         ▼
                            ┌─────────────────────────┐
                            │     Server Action       │
                            │  (uploadAvatarAction)   │
                            └───────────┬─────────────┘
                                        │
                                        ▼
                            ┌─────────────────────────┐
                            │    Supabase Storage     │
                            │    (bucket: avatars)    │
                            └─────────────────────────┘
```

### 10.2 Configuração de Upload

```typescript
// modules/upload/types.ts
export const UPLOAD_CONFIGS: Record<UploadDestination, UploadConfig> = {
  avatar: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    bucket: 'avatars',
    pathPrefix: 'users',
  },
  'chat-attachment': {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    bucket: 'chat-attachments',
    pathPrefix: 'threads',
  },
};
```

### 10.3 Estratégias de Upload

```typescript
// Avatar: {userId}/avatar-{timestamp}.{ext}
class AvatarUploadStrategy {
  generatePath(userId: string, fileName: string): string {
    const extension = fileName.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    return `${userId}/avatar-${timestamp}.${extension}`;
  }
}

// Chat Attachment: {threadId}/{userId}/{timestamp}-{safeFileName}
class ChatAttachmentUploadStrategy {
  generatePath(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${this.threadId}/${userId}/${timestamp}-${safeFileName}`;
  }
}
```

### 10.4 Buckets do Storage

| Bucket | Público | Uso |
|--------|---------|-----|
| `avatars` | Sim | Fotos de perfil dos usuários |
| `chat-attachments` | Sim | Anexos do chat de suporte |

---

## 11. Sistema de Chat

### 11.1 Chat de Suporte

#### Fluxo do Usuário

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Usuário    │────>│  getOrCreate  │────>│    Thread     │
│  abre chat    │     │    Thread     │     │   (aberta)    │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                     │
                                                     ▼
                                            ┌───────────────┐
                                            │   Mensagem    │
                                            │   (user)      │
                                            └───────────────┘
```

#### Fluxo do Admin

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│     Admin     │────>│  listThreads  │────>│   Threads     │
│  abre inbox   │     │   (open)      │     │   abertas     │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                     │
                                                     ▼
                                            ┌───────────────┐
                                            │  Responder/   │
                                            │  Fechar       │
                                            └───────────────┘
```

### 11.2 ChatService

```typescript
class ChatService {
  // Obter ou criar thread para usuário
  async getOrCreateThread(userId: string): Promise<ChatThread>
  
  // Listar threads (admin)
  async listThreadsForAdmin(options: ListOptions): Promise<ChatThread[]>
  
  // Listar mensagens de uma thread
  async listMessages(threadId: string, limit?: number): Promise<ChatMessage[]>
  
  // Adicionar mensagem
  async appendMessage(options: AppendMessageOptions): Promise<ChatMessage>
  
  // Atualizar status da thread
  async updateThreadStatus(threadId: string, status: ThreadStatus): Promise<ChatThread>
  
  // Atualizar metadata
  async updateThreadMetadata(threadId: string, metadata: Partial<Metadata>): Promise<ChatThread>
}
```

### 11.3 Chat Global

```typescript
// Envio de mensagem
async function sendGlobalMessage(userId: string, userName: string, message: string) {
  // 1. Inserir no banco
  const { data } = await supabase
    .from('global_chat_messages')
    .insert({ user_id: userId, user_name: userName, message })
    .select()
    .single();
  
  // 2. Broadcast para todos
  await supabase
    .channel('chat:global')
    .send({
      type: 'broadcast',
      event: 'new_message',
      payload: data
    });
}
```

### 11.4 Mensagens Sintéticas

O sistema gera mensagens automáticas simulando atividade:

```typescript
// modules/global-chat/synthetic/aviatorCommentGenerator.ts
class AviatorCommentGenerator {
  private templates = [
    'Eita, quase peguei o {multiplier}x! 😅',
    'Boa! Fiz cash out em {multiplier}x 💰',
    'Esse avião tá voando alto hoje! ✈️',
    // ... mais templates
  ];
  
  generate(): SyntheticMessage {
    const template = this.randomTemplate();
    const multiplier = this.randomMultiplier();
    return {
      message: template.replace('{multiplier}', multiplier),
      userName: this.randomUserName(),
    };
  }
}
```

---

## 12. Painel Administrativo

### 12.1 Funcionalidades

| Funcionalidade | Descrição | Rota |
|----------------|-----------|------|
| Dashboard | Visão geral de usuários e apostas | `/admin` |
| Usuários | Lista de todos os usuários | `/admin` (tab) |
| Apostas | Histórico de apostas global | `/admin/bets` |
| Saques | Gestão de saques | `/admin/withdrawals` |
| Suporte | Inbox de chat | `/admin` (tab) |
| Controle do Jogo | Iniciar/parar rodadas | `/admin/game` |

### 12.2 Componentes Admin

```
components/admin/
├── AdminDashboard.tsx      # Container principal
├── AdminTabs.tsx           # Navegação por abas
├── AdminUserTable.tsx      # Tabela de usuários
├── AdminBetsTable.tsx      # Tabela de apostas
├── AdminWithdrawalsPanel.tsx # Gestão de saques
└── GameControlPanel.tsx    # Controle do jogo
```

### 12.3 Fluxo de Aprovação de Saques

```typescript
// Estados do saque
type WithdrawStatus = 'pending' | 'approved' | 'paid' | 'rejected';

// Ações do admin
async function approveWithdraw(requestId: string) {
  await updateWithdrawRequest(requestId, { 
    status: 'approved',
    processedAt: new Date(),
    processedBy: adminId
  });
}

async function rejectWithdraw(requestId: string, reason: string) {
  await updateWithdrawRequest(requestId, {
    status: 'rejected',
    adminNotes: reason,
    processedAt: new Date(),
    processedBy: adminId
  });
  
  // Devolver saldo ao usuário
  await creditWallet(request.userId, request.amount);
}

async function markAsPaid(requestId: string) {
  await updateWithdrawRequest(requestId, {
    status: 'paid',
    processedAt: new Date()
  });
}
```

---

## 13. Testes

### 13.1 Estrutura de Testes

```
web/src/
├── __tests__/                    # Testes globais
├── modules/
│   ├── upload/__tests__/        # Testes do módulo upload
│   │   ├── fileValidator.test.ts
│   │   ├── avatarUploadStrategy.test.ts
│   │   ├── chatAttachmentUploadStrategy.test.ts
│   │   └── uploadFacade.test.ts
│   │
│   └── chat/__tests__/          # Testes do módulo chat
│       ├── chatService.test.ts
│       └── types.test.ts
│
└── tests/                       # Testes E2E (Playwright)
    ├── admin-realtime.spec.ts
    └── ...
```

### 13.2 Executando Testes

```bash
# Testes unitários
npm run test

# Testes específicos
npm run test -- src/modules/upload

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage

# Testes E2E
npm run test:e2e
```

### 13.3 Exemplos de Testes

```typescript
// Teste de validação de arquivo
describe('DefaultFileValidator', () => {
  it('should reject file exceeding size limit', () => {
    const file = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });
    
    const result = validator.validate(file, UPLOAD_CONFIGS.avatar);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2MB');
  });
});

// Teste de mapeamento de chat
describe('ChatService', () => {
  it('should map message with attachment fields', () => {
    const dbRow = {
      id: 1,
      thread_id: 'thread-123',
      body: 'Hello',
      attachment_url: 'https://example.com/image.jpg',
      attachment_type: 'image',
    };
    
    const message = mapToMessage(dbRow);
    
    expect(message.attachmentUrl).toBe('https://example.com/image.jpg');
    expect(message.attachmentType).toBe('image');
  });
});
```

---

## 14. Deploy e Infraestrutura

### 14.1 Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Next.js Application                  │   │
│  │  - Edge Functions                                    │   │
│  │  - Server Components                                 │   │
│  │  - API Routes                                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          VPS                                 │
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │      Nginx      │───>│      Node Service           │    │
│  │  (Reverse Proxy)│    │  (PM2 managed)              │    │
│  └─────────────────┘    └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE CLOUD                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │  PostgreSQL │  │   Storage   │  │    Realtime     │     │
│  └─────────────┘  └─────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 14.2 Deploy no Vercel (Frontend)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy produção
vercel --prod
```

**Variáveis no Vercel Dashboard:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_NODE_SERVICE_URL`

### 14.3 Deploy do Node Service (VPS)

```bash
# Conectar na VPS
ssh user@your-vps-ip

# Navegar para o projeto
cd /var/www/aviator-engine

# Atualizar código
git pull origin main

# Instalar dependências
cd node-service
npm install

# Build
npm run build

# Reiniciar com PM2
pm2 restart aviator-engine
```

### 14.4 Configuração Nginx

```nginx
# /etc/nginx/sites-available/aviator-engine.conf
server {
    listen 80;
    server_name api.seudominio.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 14.5 PM2 Ecosystem

```javascript
// node-service/ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'aviator-engine',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

---

## 15. Manutenção e Troubleshooting

### 15.1 Logs

**Frontend (Vercel):**
- Dashboard Vercel → Deployments → Logs
- Ou: `vercel logs`

**Node Service:**
```bash
# Logs em tempo real
pm2 logs aviator-engine

# Últimas 100 linhas
pm2 logs aviator-engine --lines 100

# Logs de erro
pm2 logs aviator-engine --err
```

**Supabase:**
- Dashboard Supabase → Logs

### 15.2 Problemas Comuns

#### Erro de Hydration
**Sintoma:** "Hydration failed because the server rendered HTML didn't match the client"

**Solução:**
1. Usar `dynamic()` com `ssr: false` para componentes com estado dinâmico
2. Usar `suppressHydrationWarning` para diferenças esperadas
3. Verificar uso de `Date.now()`, `Math.random()` em renders

```typescript
// Solução com dynamic import
const DynamicComponent = dynamic(() => import('./Component'), {
  ssr: false,
  loading: () => <Skeleton />
});
```

#### Erro RLS (Row Level Security)
**Sintoma:** "new row violates row-level security policy"

**Solução:**
1. Verificar políticas RLS no Supabase Dashboard
2. Verificar se usuário está autenticado
3. Usar Server Actions com `getSupabaseServerClient()`

```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'sua_tabela';

-- Criar política permissiva
CREATE POLICY "policy_name" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### WebSocket não conecta
**Sintoma:** Realtime não funciona

**Solução:**
1. Verificar CORS no Node Service
2. Verificar proxy Nginx para WebSocket
3. Verificar variáveis de ambiente

```nginx
# Nginx WebSocket config
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 15.3 Monitoramento

**Métricas PM2:**
```bash
pm2 monit
pm2 status
```

**Health Check:**
```bash
curl https://api.seudominio.com/health
```

### 15.4 Backup do Banco

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Via pg_dump
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

---

## 16. Roadmap e Features Futuras

### 16.1 Features Implementadas ✅

- [x] Sistema de autenticação (login/registro)
- [x] Jogo Aviator funcional
- [x] Sistema de apostas e cash out
- [x] Carteira virtual
- [x] Perfil do usuário com avatar
- [x] Configurações de saque (PIX/Banco)
- [x] Chat de suporte com anexos
- [x] Chat global
- [x] Painel administrativo
- [x] Gestão de saques
- [x] Sistema de upload de imagens
- [x] Realtime com Supabase
- [x] Testes unitários

### 16.2 Features Planejadas 🚧

| Feature | Prioridade | Complexidade |
|---------|------------|--------------|
| Notificações push | Alta | Média |
| Histórico detalhado do jogador | Alta | Baixa |
| Sistema de bônus/promoções | Alta | Alta |
| Multi-idioma (i18n) | Média | Média |
| App mobile (React Native) | Média | Alta |
| Sistema de afiliados | Média | Alta |
| Dashboard de analytics | Média | Média |
| Autenticação 2FA | Baixa | Média |
| Tema customizável | Baixa | Baixa |

### 16.3 Melhorias Técnicas Planejadas

1. **Performance**
   - Implementar cache Redis
   - Otimizar queries N+1
   - Lazy loading de componentes

2. **Segurança**
   - Rate limiting mais robusto
   - Auditoria de ações admin
   - Criptografia de dados sensíveis

3. **Escalabilidade**
   - Múltiplas instâncias do Node Service
   - Load balancer
   - CDN para assets

4. **DevOps**
   - CI/CD automatizado
   - Staging environment
   - Monitoramento com Grafana/Prometheus

---

## Anexos

### A. Glossário

| Termo | Definição |
|-------|-----------|
| **Cash Out** | Ação de retirar ganhos antes do crash |
| **Crash** | Momento em que o avião "cai" e a rodada termina |
| **Multiplicador** | Valor que multiplica a aposta do jogador |
| **Rodada** | Um ciclo completo do jogo (apostas → voo → crash) |
| **Thread** | Conversa de suporte entre usuário e admin |
| **RLS** | Row Level Security - políticas de segurança do Supabase |
| **SSR** | Server-Side Rendering |
| **Hydration** | Processo de "hidratar" HTML estático com interatividade |

### B. Comandos Úteis

```bash
# Frontend
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run lint         # Linting
npm run test         # Testes

# Node Service
npm run dev          # Desenvolvimento
npm run build        # Build
pm2 start            # Iniciar produção
pm2 restart all      # Reiniciar
pm2 logs             # Ver logs

# Supabase
npx supabase start   # Local
npx supabase db push # Push migrations
npx supabase gen types typescript # Gerar tipos
```

### C. Links Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Vitest](https://vitest.dev)
- [Playwright](https://playwright.dev)

---

*Última atualização: Dezembro 2025*

*Documento técnico confidencial. Uso restrito à equipe de desenvolvimento.*
