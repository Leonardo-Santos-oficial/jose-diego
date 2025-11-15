# Documento de Requisitos do Produto (PRD): Plataforma de Apostas (Demo)

**Status:** Rascunho
**Versão:** 1.2
**Data da Última Atualização:** 14/11/2025
**Proprietário do Produto:** [Seu Nome/Analista de SEO e Desenvolvedor]

---

## 1. Visão Geral e Objetivos

### 1.1. Objetivo do Produto

O objetivo é desenvolver um site de apostas simulado (demo) totalmente funcional. A plataforma permitirá que os usuários se cadastrem, façam login, gerenciem um saldo virtual e apostem em jogos (começando pelo "Aviator"). O sistema não processará dinheiro real; depósitos e saques serão simulações gerenciadas por um painel de administração.

### 1.2. Público-Alvo

* **Usuários Finais (Jogadores):** Visitantes que interagem com a plataforma, testam o jogo e usam o chat de suporte.
* **Administrador (Proprietário):** O gestor da plataforma, responsável por gerenciar usuários, saldos, solicitações de saque e o chat de suporte.

### 1.3. Proposta de Valor

* **Para Usuários:** Uma experiência de jogo moderna, responsiva e visualmente atraente, sem risco financeiro.
* **Para o Administrador:** Uma ferramenta de demonstração robusta com controle total sobre a simulação, incluindo gerenciamento de usuários e saldo.

---

## 2. Requisitos Funcionais (Features)

### 2.1. Landing Page (Estática)

* **Hero Section:**
    * Deve apresentar um vídeo de fundo com baixa opacidade (transparência).
    * Sobreposição de texto: Título principal, breve descrição.
    * Botão "Login / Cadastrar" que abre um modal.
* **Layout:**
    * O corpo da página deve ser estático, apresentando informações sobre a plataforma.
    * Links (atalhos) para os jogos devem ser visíveis nas laterais (sidebar ou similar).

### 2.2. Autenticação e Gerenciamento de Usuário

* **US-101 (Cadastro):** Como usuário, quero me cadastrar usando e-mail e senha através de um modal, para ter acesso à plataforma.
* **US-102 (Login):** Como usuário, quero fazer login com minhas credenciais (e-mail e senha) através do modal.
* **US-103 (Perfil):** Como usuário, quero ter uma página de perfil onde posso registrar minhas informações de conta bancária ou chave Pix (apenas para fins de simulação de saque).

### 2.3. Sistema de Saldo e Transações (Simulado)

* **US-201 (Visualizar Saldo):** Como usuário, quero ver meu saldo virtual atualizado em tempo real no cabeçalho do site.
* **US-202 (Depósito Simulado):** Como usuário, quero clicar no botão "Depositar" e ser direcionado para o chat de suporte para "solicitar" um depósito.
* **US-203 (Solicitação de Saque):** Como usuário, quero solicitar um "Saque (Pix)" para a conta que registrei, e após a solicitação, ver uma mensagem de confirmação (ex: "Solicitação enviada, aguarde aprovação").
* **US-204 (Restrição de Aposta):** O sistema não deve permitir que eu aposte um valor maior do que o meu saldo atual.

### 2.4. Jogo 1: "Aviator" (Crash Game)

* **US-301 (Interface do Jogo):** Como usuário, quero ver a tela do jogo com o avião, o multiplicador crescendo e os controles de aposta.
* **US-302 (Fazer Aposta):** Como usuário, quero poder definir um valor de aposta (respeitando o saldo e os limites min/max de R$0.50 a R$500) antes do início da rodada.
* **US-303 (Apostas Simultâneas):** Como usuário, quero ter a opção de fazer até duas apostas na mesma rodada.
* **US-304 (Mecânica "Crash"):** Quero assistir o avião decolar e o multiplicador (iniciando em 1.00x) aumentar.
* **US-305 (Cash Out):** Quero poder clicar em "Resgatar" (Cash Out) a qualquer momento para garantir meus ganhos (Valor da Aposta \* Multiplicador Atual). Meu saldo deve ser atualizado imediatamente.
* **US-306 (Perda):** Se o avião voar para longe ("Flew Away!") antes de eu resgatar, eu perco o valor apostado.
* **US-307 (Recursos Adicionais):**
    * **Saque Automático:** Quero poder definir um multiplicador (ex: 2.5x) para o sistema resgatar automaticamente minha aposta.
    * **Histórico (Velas):** Quero ver o histórico dos multiplicadores das rodadas passadas, codificados por cor (Azul: 1.00-1.99x, Roxo: 2.0-9.99x, Rosa: 10.0x+).
* **RTP:** O jogo deve operar com um RTP (Return to Player) de 97%, usando um algoritmo *Provably Fair* para garantir aleatoriedade e justiça (ou permitir controle do admin).

### 2.5. Chat de Suporte (Tempo Real)

* **US-401 (Chat (Usuário)):** Como usuário, quero abrir uma janela de chat para conversar em tempo real com o suporte (administrador).
* **US-402 (Chat (Admin)):** Como administrador, quero receber mensagens de usuários em tempo real no meu painel e poder respondê-las.
* **US-403 (Persistência):** O histórico da conversa deve ser salvo e carregado sempre que o chat for aberto.
* **US-404 (Notificações):** O administrador deve receber uma notificação (visual ou sonora) de novas mensagens no painel.

### 2.6. Painel de Administração

* **ADMIN-501 (Dashboard):** Como admin, quero um painel protegido por login (separado do usuário) para gerenciar o site.
* **ADMIN-502 (Gerenciamento de Usuários):** Quero ver uma lista de todos os usuários. Devo poder editar seus dados, excluir suas contas e **alterar manualmente seus saldos** (adicionar ou remover fundos virtuais).
* **ADMIN-503 (Histórico de Apostas):** Quero poder visualizar o histórico de todas as apostas feitas por todos os usuários.
* **ADMIN-504 (Gerenciamento de Jogos):** Quero poder criar (definir parâmetros) ou apagar jogos da plataforma.
    * *(Opcional: Quero poder controlar o resultado da próxima rodada do Aviator).*
* **ADMIN-505 (Gerenciamento de Saques):** Quero ver uma lista de todas as solicitações de saque e marcá-las como "Pendente", "Aprovada" ou "Recusada". (Isso não aciona nenhum pagamento real).
* **ADMIN-506 (Chat de Suporte):** Quero ter a interface de chat integrada ao painel para responder aos usuários.

---

## 3. Requisitos Não-Funcionais (NFRs)

### 3.1. Design (UI/UX)

* **UI:** Visual moderno, leve, com tema escuro e detalhes em vermelho ou azul. A tipografia deve ser clara e legível.
* **UX:** A navegação deve ser intuitiva e fácil de usar. Os modais de login/cadastro devem ser diretos. O painel do admin deve ser funcional e claro.

### 3.2. Responsividade e Acessibilidade

* **Responsividade:** O site deve ser totalmente responsivo (mobile-first) e funcionar perfeitamente em dispositivos móveis, tablets e desktops (atenção aos *breakpoints*).
* **Acessibilidade (A11y):** O site deve seguir as práticas básicas de acessibilidade (semântica HTML, contraste de cores, navegação por teclado).

### 3.3. Performance

* **Landing Page:** Prioridade máxima para performance. Otimizar para as Core Web Vitals (CWV):
    * **First Contentful Paint (FCP)**
    * **Largest Contentful Paint (LCP)** (O vídeo de fundo não deve bloquear o LCP)
    * **Total Blocking Time (TBT)**
    * **Speed Index (SI)**
* **Jogos:** A lógica do jogo deve ser leve para evitar travamentos ou alto consumo de CPU/memória no cliente.

---

## 4. Stack de Tecnologia e Arquitetura

### 4.1. Tecnologias (Conforme solicitado)

* **Frontend:** Next.js (com App Router), **versão 16.0.3**.
* **Linguagem:** TypeScript (com afinidade do desenvolvedor).
* **Chat em Tempo Real:** WebSockets (ex: usando `socket.io` ou integração nativa do Supabase).

### 4.2. Seleção de Banco de Dados (Baseado na imagem e requisito "Free")

* **Análise:** O projeto requer um banco de dados relacional (para usuários, saldos, histórico de apostas, saques) que possua um nível gratuito robusto.
* **Opção da Imagem:** `PostgreSQL` (Classificação: AP/EL, Tipo: Relacional Single Node (ACID)).
* **Justificativa:** Os "Casos de Uso" listados (Aplicações web, sistemas empresariais, comércio eletrônico, CRMs) alinham-se perfeitamente com os requisitos do projeto (plataforma web com painel de admin estilo CRM).
* **Implementação Recomendada:** **Supabase**. O Supabase utiliza PostgreSQL como base e oferece um generoso nível gratuito, including autenticação, banco de dados relacional e funcionalidades de tempo real (WebSockets), cobrindo todos os requisitos do projeto.

### 4.3. Princípios e Arquitetura

* **Qualidade de Código:** O desenvolvimento deve seguir rigorosamente os princípios **SOLID** e **Clean Code** (nomes significativos, funções pequenas, DRY, etc.). Comentários devem ser usados apenas para explicar o "porquê" de lógicas complexas, não o "o quê".
* **Padrão de Arquitetura (Design Pattern):**
    * Dada a natureza de tempo real do projeto (chat e jogo), o **Padrão Observer (Observador)** é a escolha mais adequada.
        * **Justificativa (Observer):** O estado do jogo (ex: multiplicador do Aviator) é o "Sujeito" (Subject). Todos os jogadores conectados são "Observadores" (Observers). Quando o estado do Sujeito muda (o multiplicador aumenta), ele notifica todos os Observadores, que atualizam suas UIs em tempo real. O mesmo se aplica ao chat: o admin e o usuário "observam" a sala de chat e são notificados de novas mensagens.
    * **Padrão de Suporte:** O **Padrão State (Estado)** será usado para gerenciar os ciclos de vida do jogo (ex: `AguardandoApostas`, `EmVoo`, `Crash`) e das solicitações de saque (`Pendente`, `Aprovado`, `Recusado`).

---

## 5. Estratégia de Testes

* **Testes Unitários (Jest/Vitest):** Aplicados à lógica de negócios (ex: `calcularGanhos()`, `validarSaldo()`, lógica do `useReducer` para o estado do jogo).
* **Testes de Funcionalidade/Integração (React Testing Library):** Garantir que os componentes interajam corretamente (ex: "Ao clicar em 'Login', o modal é exibido").
* **Testes E2E e Visuais (Playwright):**
    * Validar os fluxos críticos do usuário (Login -> Apostar -> Resgatar -> Verificar Saldo).
    * Testar a responsividade e a acessibilidade em diferentes *breakpoints*.
    * Garantir a consistência visual da UI.

---

## 6. Requisitos de Segurança

Mesmo sendo um ambiente de demonstração, a plataforma deve ser desenvolvida com práticas de segurança robustas para proteger os dados do usuário e a integridade do sistema, mitigando os ataques mais comuns.

### 6.1. Proteção contra Injeção (SQLi e XSS)

* **Ataque de Injeção SQL (Mitigação):**
    * **REQ-SEC-01:** Toda a interação com o banco de dados Supabase (PostgreSQL) deve ser feita *exclusivamente* através do cliente de biblioteca do Supabase (ex: `supabase.from('table').select()`). Este método usa parametrização e *prepared statements* por baixo dos panos, o que neutraliza eficazmente os ataques de SQL Injection.
    * **REQ-SEC-02:** Nenhuma query SQL bruta (raw query) deve ser construída concatenando inputs do usuário.
* **Ataque de Cross-site Scripting (XSS) (Mitigação):**
    * **REQ-SEC-03:** O React (usado pelo Next.js) já faz o *escape* de conteúdo renderizado por padrão. Esta proteção deve ser mantida.
    * **REQ-SEC-04:** É **proibido** o uso de `dangerouslySetInnerHTML` com qualquer dado vindo do usuário.
    * **REQ-SEC-05:** Todo o conteúdo gerado pelo usuário (UGC), especialmente mensagens de chat (US-401) e dados de perfil (US-103), deve ser higienizado (sanitized) no servidor antes de ser armazenado ou retransmitido para outros clientes.

### 6.2. Proteção de Tráfego e Autenticação

* **Ataque Man-in-the-middle (MitM) e Espionagem (Eavesdropping):**
    * **REQ-SEC-06:** A aplicação deve forçar o uso de **HTTPS** (SSL/TLS) em todas as páginas e endpoints de API.
    * **REQ-SEC-07:** A comunicação via WebSocket (para o chat e o jogo) deve usar o protocolo seguro **WSS** (WebSocket Secure).
* **Ataques de Senha (Força Bruta, Credential Stuffing):**
    * **REQ-SEC-08:** Deve-se utilizar o módulo Supabase Auth, que armazena senhas usando *hashing* seguro e moderno (bcrypt).
    * **REQ-SEC-09:** O Supabase Auth deve ser configurado para aplicar *rate limiting* nas tentativas de login, bloqueando temporariamente IPs ou contas após múltiplas falhas.
* **Ataques de Phishing:**
    * **REQ-SEC-10:** Embora seja um ataque externo, o design da UI deve ser claro e consistente. Se e-mails transacionais (ex: redefinição de senha) forem implementados, eles devem ter um design único para ajudar o usuário a identificar tentativas de fraude.

### 6.3. Proteção da Lógica de Negócios e Infraestrutura

* **Validação de Lógica de Jogo (Segurança Lógica):**
    * **REQ-SEC-11:** Esta é a vulnerabilidade mais crítica do projeto. A lógica de cálculo de saldo (débito de aposta, crédito de ganho) deve ser executada **exclusivamente no servidor** (ex: usando Server Actions do Next.js ou Edge Functions do Supabase).
    * **REQ-SEC-12:** O cliente (frontend) **nunca** deve enviar o saldo final (ex: `setUserBalance(1000)`). O cliente apenas envia a *ação* (ex: "Apostei 10") e o servidor valida (ex: "O usuário tem saldo?"), executa a lógica e atualiza o banco de dados. O saldo no cliente é apenas um reflexo do banco de dados.
* **Ataques de Negação de Serviço (DoS/DDoS):**
    * **REQ-SEC-13:** A infraestrutura de nuvem (Supabase e a plataforma de hospedagem do Next.js, como Vercel) oferece proteção nativa contra DDoS na camada de rede.
    * **REQ-SEC-14:** Implementar *rate limiting* em nível de API em endpoints sensíveis (ex: envio de mensagem no chat, criação de conta) para prevenir abuso.
* **Ataques de Drive-by e Malware:**
    * **REQ-SEC-15:** Manter todas as dependências do projeto (pacotes npm) atualizadas para corrigir vulnerabilidades conhecidas.
    * **REQ-SEC-16:** A plataforma não deve permitir o upload de arquivos por usuários. Se essa funcionalidade for adicionada no futuro (ex: foto de perfil), os arquivos devem ser verificados por um scanner de malware e servidos de um domínio seguro.

---

## 7. Fora do Escopo (Versão 1.0)

* **Qualquer integração de pagamento real** (Pix, cartão de crédito, gateways).
* **Aplicativos móveis nativos** (iOS/Android).
* **Múltimos jogos** (Apenas o Aviator será desenvolvido nesta fase inicial).

---

## 8. Plano de Implementação Detalhado (Milestones)

Este plano divide o projeto em fases lógicas para garantir um desenvolvimento estruturado, seguindo os princípios de Clean Code, SOLID e os requisitos de segurança definidos.

### Fase 0: Configuração e Fundação (Setup)

* **Tarefa 0.1:** Inicializar o projeto Next.js (v16.0.3), TypeScript, e configurar as ferramentas de linting (ESLint) e formatação (Prettier) para garantir o Clean Code.
* **Tarefa 0.2:** Configurar o Supabase.
    * Criar o projeto no Supabase.
    * Definir o Schema do banco de dados (Tabelas: `users`, `user_profiles` (para dados Pix), `wallets` (saldo), `bets`, `game_rounds`, `chat_messages`, `withdraw_requests`).
    * **Segurança:** Configurar as políticas de RLS (Row Level Security) do Supabase. Por padrão, negar todo o acesso e, em seguida, criar políticas específicas (ex: "Usuário só pode ler/atualizar seu próprio `wallet`").
* **Tarefa 0.3:** Configurar o framework de testes (Playwright e Vitest).

### Fase 1: Autenticação e Layout Base

* **Tarefa 1.1:** Implementar a autenticação de usuário (Cadastro e Login) usando o Supabase Auth (cobre REQ-SEC-08, REQ-SEC-09).
* **Tarefa 1.2:** Desenvolver o Layout global da aplicação (App Shell).
* **Tarefa 1.3:** Implementar o sistema de Roteamento do Administrador (com `role` 'admin').

### Fase 2: Landing Page e UI/UX Estático

* **Tarefa 2.1:** Construir a Landing Page (Homepage estática).
* **Tarefa 2.2:** Garantir que todos os links externos usem `rel="noopener noreferrer"` para segurança.

### Fase 3: Funcionalidades Centrais (Saldo e Admin)

* **Tarefa 3.1:** Implementar o "Núcleo" do Painel Admin (Requisito 2.6).
    * Criar a UI para listar usuários e a função "Editar Saldo". **(Implementar como uma Server Action segura)**.
* **Tarefa 3.2:** Implementar o fluxo de "Saque" simulado (Usuário e Admin).

### Fase 4: Implementação do Jogo "Aviator" (O Core)

* **Tarefa 4.1:** Lógica de Backend (Game Loop) como uma Serverless Function.
* **Tarefa 4.2:** Comunicação em Tempo Real (Observer Pattern) usando Supabase Realtime via WSS (cobre REQ-SEC-07).
* **Tarefa 4.3:** Lógica de Frontend (UI do Jogo).
* **Tarefa 4.4:** Lógica de Transação (Backend) - **Crítico para Segurança (REQ-SEC-11, REQ-SEC-12)**.
    * Criar uma Server Action `handleBet(amount)`:
        1.  Validar `amount` no servidor.
        2.  Verificar saldo no servidor (via Supabase RLS).
        3.  Debitar o valor no servidor.
    * Criar uma Server Action `handleCashout()`:
        1.  Verificar se o jogo está ativo.
        2.  Calcular ganhos no servidor.
        3.  Creditar o valor no servidor.

### Fase 5: Chat de Suporte (Tempo Real)

* **Tarefa 5.1:** Implementar o Chat usando Supabase Realtime (via WSS).
* **Tarefa 5.2:** Implementar higienização (sanitization) de todas as mensagens enviadas antes de salvá-las no banco (cobre REQ-SEC-05). Usar uma biblioteca como `DOMPurify`.

### Fase 6: Testes, Otimização e Refinamento

* **Tarefa 6.1:** Executar a Estratégia de Testes (Seção 5).
    * Adicionar testes de segurança: Tentar enviar scripts XSS no chat, tentar chamar a função de aposta com saldo insuficiente, tentar atualizar o saldo de outro usuário (testar RLS).
* **Tarefa 6.2:** Otimização de Performance e Segurança.
    * Rodar Lighthouse e Snyk (ou `npm audit`) para verificar dependências vulneráveis (REQ-SEC-15).
    * Configurar Headers de Segurança (HSTS) na hospedagem (cobre REQ-SEC-06).