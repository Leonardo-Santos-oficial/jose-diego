# 📋 Plano de Implementação: Cache-Aside Pattern

## 1. Visão Geral

Implementar um **Cache-Aside Pattern** (também conhecido como Lazy Loading) seguindo os princípios **Clean Code** e **SOLID**, usando o **Proxy Pattern** para criar uma camada transparente de cache.

---

## 2. Análise das Consultas Candidatas ao Cache

Após análise do codebase, identifiquei as seguintes consultas:

| Módulo | Método | Tabela | Frequência de Mudança | **Prioridade Cache** |
|--------|--------|--------|----------------------|---------------------|
| `BenefitsService` | `getAvailableBenefitTypes()` | `benefit_types` | Raramente | ✅ **Alta** |
| `EngineStateRepository` | `fetchHistory(limit)` | `game_rounds` | A cada rodada (~15s) | ✅ **Média-Alta** |
| `BenefitsService` | `getVipLevel(userId)` | RPC | Por transação | ⚠️ Média |
| `getUserProfile(userId)` | `user_profiles` | Por edição do usuário | ⚠️ Média |
| `getWalletSnapshot(userId)` | `wallets` | Por transação | ❌ **Baixa** (muda frequentemente) |
| `GlobalChatRepository` | `fetchRecentMessages` | `global_chat_messages` | Realtime | ❌ **Não cachear** |

---

## 3. Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                      Consuming Code                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CachingProxy<T>                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ check cache │→ │  hit? return│  │ miss? call repository  │  │
│  │             │  │             │→ │ → save to cache        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Original Repository/Service                         │
│                    (Supabase calls)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Estrutura de Arquivos

```
web/src/lib/cache/
├── types.ts              # Interfaces (CacheStore, CacheEntry, CacheConfig)
├── MemoryCache.ts        # Implementação in-memory com TTL
├── CacheKeyBuilder.ts    # Gerador de chaves consistentes
├── CachingProxy.ts       # Proxy genérico que aplica cache
└── index.ts              # Exports públicos

web/src/modules/benefits/
├── services/
│   ├── BenefitsService.ts         # (existente - sem alterações)
│   └── CachedBenefitsService.ts   # Novo: wrapper com cache

web/src/modules/aviator/serverless/repositories/
├── engineStateRepository.ts        # (existente - sem alterações)
└── CachedEngineStateRepository.ts  # Novo: wrapper com cache
```

---

## 5. Detalhamento dos Componentes

### 5.1 Interfaces (Princípio ISP - Interface Segregation)

```typescript
// types.ts
interface CacheStore<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
}

interface CacheConfig {
  defaultTtlMs: number;
  maxEntries?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
```

### 5.2 MemoryCache (SRP - Single Responsibility)

Implementação em memória com:
- **TTL automático** (Time To Live)
- **Limpeza lazy** (ao acessar item expirado)
- **Limite de entradas** (opcional, para evitar memory leak)

### 5.3 CachingProxy (Proxy Pattern + OCP - Open/Closed)

Proxy genérico que:
- Envolve qualquer função async
- Gera cache key automaticamente
- Respeita TTL configurado
- **Não modifica o código original**

---

## 6. Estratégia de TTL (Time To Live)

### 6.1 TTL Recomendado por Tipo de Dado

| Dado | TTL Sugerido | Justificativa |
|------|-------------|---------------|
| `benefit_types` (tipos de benefícios) | **5 minutos** | São configurações administrativas, mudam muito raramente |
| `game_rounds` (histórico) | **10 segundos** | Precisa atualizar após cada rodada (~15s cada) |
| `vip_level` (nível VIP) | **30-60 segundos** | Muda apenas após apostas/depósitos |
| `user_profiles` (perfil) | **60 segundos** | Usuário edita raramente |

### 6.2 Dados que **NÃO DEVEM** ser cacheados

| Dado | Motivo |
|------|--------|
| **Saldo/Wallet** | Muda a cada aposta/cashout - SEMPRE tempo real |
| **Apostas ativas** | Crítico para o jogo - SEMPRE tempo real |
| **Chat realtime** | Precisa ser instantâneo |
| **Estado da rodada atual** | Crítico - multiplier atualiza a cada 100ms |

### 6.3 Classificação de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE SEGURO ✅                          │
│  • Tipos de benefícios (5 min)                              │
│  • Histórico de rodadas FINALIZADAS (10-15s)               │
│  • Configurações do sistema (10 min)                        │
│  • Display names de usuários (30s)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    NUNCA CACHEAR ❌                         │
│  • Saldo do usuário                                         │
│  • Aposta atual / ticket ativo                              │
│  • Multiplicador em tempo real                              │
│  • Status da rodada atual (betting/flying/crashed)         │
│  • Mensagens de chat                                        │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Impacto Estimado

| Endpoint | Queries/min ANTES | Queries/min DEPOIS | Redução |
|----------|-------------------|-------------------|---------|
| `benefit_types` | ~50-100 | ~1 | **98%** |
| `fetchHistory` | ~200+ | ~6 (1 a cada 10s) | **97%** |
| `getVipLevel` | ~100 | ~2-3 por usuário | **95%** |

### 6.5 Estratégia de Rollout

1. **Fase 1**: TTLs curtos (10-30s para maioria) - conservador
2. **Fase 2**: Monitorar hit/miss rate
3. **Fase 3**: Aumentar TTL onde for seguro

---

## 7. Aplicação nos Módulos

### 7.1 `BenefitsService.getAvailableBenefitTypes()`
- **TTL**: 5 minutos (dados raramente mudam)
- **Cache Key**: `benefit_types:active`
- **Invalidação**: Nenhuma necessária (TTL expira naturalmente)

### 7.2 `EngineStateRepository.fetchHistory(limit)`
- **TTL**: 10 segundos (sincronizado com duração da rodada)
- **Cache Key**: `game_history:{limit}`
- **Invalidação**: Automática por TTL

### 7.3 `BenefitsService.getVipLevel(userId)` (Opcional)
- **TTL**: 30 segundos
- **Cache Key**: `vip_level:{userId}`
- **Invalidação**: Por TTL

---

## 7. Princípios SOLID Aplicados

| Princípio | Aplicação |
|-----------|-----------|
| **S**RP | `MemoryCache` só gerencia armazenamento; `CachingProxy` só gerencia lógica de cache-aside |
| **O**CP | Novos módulos cacheados sem modificar originais |
| **L**SP | Proxies implementam mesma interface que originais |
| **I**SP | Interfaces pequenas e focadas (`CacheStore<T>`) |
| **D**IP | Componentes dependem de abstrações (`CacheStore`), não implementações concretas |

---

## 8. Design Pattern Escolhido

**Proxy Pattern** - Ideal porque:
1. Não modifica classes existentes
2. Transparente para o código consumidor
3. Fácil de ativar/desativar
4. Permite composição com outros proxies

---

## 9. Impacto nas Funcionalidades

| Funcionalidade | Impacto |
|----------------|---------|
| **Jogabilidade** | ✅ Zero - cache de histórico não afeta apostas |
| **Chat** | ✅ Zero - não será cacheado |
| **Wallet/Saldo** | ✅ Zero - não será cacheado |
| **Benefícios** | ✅ Zero - tipos de benefícios são read-only |
| **Saques** | ✅ Zero - não será cacheado |

---

## 10. Ordem de Implementação

1. **Infraestrutura de Cache** (`web/src/lib/cache/`)
2. **CachedBenefitsService** (menor risco, maior benefício)
3. **CachedEngineStateRepository** (cache do histórico)
4. **Testes unitários**
5. **Métricas de cache** (opcional - hit/miss rate)

---

## 11. Métricas Esperadas

- **Redução de queries** no `benefit_types`: ~95% (cache de 5 min)
- **Redução de queries** no `game_rounds` (histórico): ~50-70%
- **Latência melhorada** em páginas que carregam benefícios

---

## 12. Próximos Passos

Após aprovação deste plano, será implementado:

1. ✅ Infraestrutura genérica de cache
2. ✅ Proxy para `BenefitsService`
3. ✅ Proxy para `EngineStateRepository.fetchHistory`
4. ✅ Integração nas rotas/componentes que usam esses serviços

---

## 13. Referências

- [Cache-Aside Pattern - Microsoft Azure](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [Proxy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/proxy)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
