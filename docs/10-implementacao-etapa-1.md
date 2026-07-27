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

2. **Editor Canvas Visual**:
   - Canvas 2D interativo com Zoom, Pan e alinhamento à grade (Grid Snap).
   - Manipulação e seleção de formas geométricas (Retângulo, Círculo, Linha, Texto).
   - Gerenciamento de camadas (Layers) com suporte a alteração de ordem, visibilidade e bloqueio.
   - Histórico de ações com desfazer e refazer (Ctrl+Z, Ctrl+Y, atalhos de navegação).
   - Painel de propriedades para ajuste de posição, tamanho, rotação, cores e opacidade.

3. **Importação e Exportação**:
   - Exportação de projetos no formato JSON (`.inframap.json`).
   - Importação de arquivos de projeto JSON com migração e validação de schema via `@inframap/project-schema`.
   - Exportação do Canvas como imagem PNG.

4. **CI e Validações**:
   - Workflow do GitHub Actions (`.github/workflows/ci.yml`) validando `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`.
