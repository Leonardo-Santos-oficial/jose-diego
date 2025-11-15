# Design System & shadcn/ui Adoption Plan

## Objetivos
- Unificar a linguagem visual da landing, shell e painel admin.
- Evitar duplicação de estilos utilitários e CSS ad-hoc.
- Fornecer tokens e componentes que facilitem futuras fases (jogo, chat, admin).

## Tecnologias
- **shadcn/ui** sobre Tailwind CSS (já presente via Next 16).  
- **Radix UI primitives** como base de acessibilidade.

## Componentes Prioritários (Fase 1)
1. Botão (`Button`)
2. Input + Label (`Input`, `Label`)
3. Card (`Card`)
4. Dialog/Modal (`Dialog`)
5. Form feedback (`Form`, `FormField`, `FormMessage`)

## Processo de Migração
1. Instalar shadcn/ui (`npx shadcn-ui@latest init`).
2. Gerar componentes base (`npx shadcn-ui@latest add button input card dialog form`...).
3. Reutilizar tokens de cor/tipografia definidos em `app/globals.css` e `AppShell`.
4. Migrar AuthModal e formulários do painel admin para os componentes gerados.
5. Atualizar documentação e checklist após cada conversão.

## Princípios de Arquitetura
- **Clean Code/SOLID:**
  - Componentes pequenos, com responsabilidades claras.
  - Evitar "prop drilling" desnecessário usando providers quando aplicável.
- **Padrão estrutural:** `Facade` para expor o design system através de um único módulo (`@/components/ui`).
  - Permite evoluir/alterar a implementação interna (ex.: trocar tokens) sem quebrar o resto do app.
- **Padrões Comportamentais:**
  - `Command` já aplicado no admin permanecerá desacoplado da camada de UI.

## Riscos & Mitigações
- **Aumento de bundle**: carregar apenas os componentes necessários.
- **Inconsistência de estilos legados**: criar uma checklist para migrar hero/header/sidebar.
- **Tempo**: priorizar AuthModal + Admin antes de tocar landing complexa.

## Métricas de Aceite
- 100% dos formulários críticos usam `shadcn/ui`.
- Tema coerente (same spacing, color, typography) nas páginas públicas e admin.
- Documentação (`docs/architecture/milestone-checklist.md`) refletindo itens concluídos.
