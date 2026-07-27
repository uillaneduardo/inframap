# Etapa 1: Fundação do Workspace e PWA Local-First

## Visão Geral

Esta etapa estabelece a base arquitetural e funcional do **InfraMap**, implementando a fundação SaaS-ready do Workspace em um monorepo com `npm workspaces`. A aplicação web frontend foi isolada em `apps/web` e os pacotes reutilizáveis organizados em `packages/`.

---

## Módulos e Estrutura do Monorepo

```text
inframap/
├── apps/
│   └── web/                   # Aplicação PWA React + Vite + Konva
├── packages/
│   ├── config/                # Configurações TypeScript base
│   ├── domain/                # Entidades puras de domínio (Project, CanvasObject, Layer, Preferences, User)
│   ├── editor-core/           # Conversão de unidades reais (px, mm, cm, m), histórico (undo/redo) e manipulação
│   ├── project-schema/        # Schemas Zod versionados do documento do projeto e validação de formulários
│   ├── ui/                    # Componentes visuais reutilizáveis (Button, Dialog, Input, Panel, Select, States, Tooltip)
│   └── i18n/                  # Internacionalização (pt-BR e en)
├── .github/
│   └── workflows/
│       └── ci.yml             # Workflow de integração contínua (npm ci, lint, typecheck, test, build)
├── eslint.config.js           # Configuração ESLint com TypeScript
└── package.json               # Configuração raiz do monorepo com npm workspaces
```

---

## Funcionalidades Implementadas e Verificadas

1. **Persistência Local (Local-First)**:
   - Armazenamento em **Dexie.js / IndexedDB** (`IndexedDbProjectRepository`).
   - Operações de criação, listagem, atualização, duplicação e exclusão de projetos localmente.

2. **Editor Canvas Visual e Ferramentas**:
   - Ferramentas com responsabilidades separadas: Selecionar (`V`), Mover objeto (`M`), Mover tela/Pan (`H`), Retângulo (`R`), Círculo (`C`), Linha (`L`) e Texto (`T`).
   - Desenho técnico por clique e arraste (`pointerdown` -> `pointermove` com preview tracejado -> `pointerup` para confirmar) com cálculo exato em milímetros (world coordinates).
   - Validação de limite mínimo (2mm) para evitar a criação acidental de objetos de tamanho zero.
   - Separação entre visibilidade da grade (`showGrid`) e encaixe/snap na grade (`snapToGrid`), com snap desativado por padrão.
   - Suporte a tecla `Alt` para ignorar o snap temporariamente e tecla `Shift` para manter proporção e ângulos fixos.
   - Gerenciamento de camadas (Layers) com suporte a alteração de ordem, visibilidade e bloqueio.
   - Histórico de ações com desfazer e refazer (Ctrl+Z, Ctrl+Y) gerando exatamente uma entrada por criação ou movimento.
   - Painel de propriedades para ajuste de posição, tamanho, rotação, cores e opacidade.

3. **Importação e Exportação**:
   - Exportação de projetos no formato JSON (`.inframap.json`).
   - Importação de arquivos de projeto JSON com migração e validação de schema via `@inframap/project-schema`.
   - Exportação do Canvas como imagem PNG.

4. **CI e Validações**:
   - Workflow do GitHub Actions (`.github/workflows/ci.yml`) validando `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`.
