# Etapa 1: Fundação do Workspace e PWA Local-First

## Visão Geral

Esta etapa estabelece a base arquitetural e funcional do **InfraMap**, implementando o Workspace inicial com funcionamento local-first (PWA), armazenamento via IndexedDB, editor visual baseado em Canvas com suporte a camadas, unidades reais e histórico (undo/redo), além de exportação, importação e internacionalização (pt-BR e en).

---

## Módulos e Estrutura Implementada

1. **Monorepo e Pacotes Compartilhados**:
   - `packages/domain`: entidades puras do modelo de domínio (Project, CanvasObject, Layer, Preferences, User).
   - `packages/project-schema`: validação e schematização de arquivos de projeto `.inframap`.
   - `packages/editor-core`: matemática de conversão de unidades (px, mm, cm, m), histórico imutável (undo/redo) e manipulação de objetos no canvas.
   - `packages/validation`: validações com Zod para payload de projetos e objetos.
   - `packages/ui`: biblioteca de componentes visuais acessíveis e consistentes (Button, Dialog, Input, Panel, Select, States, Tooltip).
   - `packages/i18n`: internacionalização com suporte a Português (Brasil) e Inglês.

2. **Persistência Local (Local-First)**:
   - Implementada com **Dexie.js / IndexedDB** no repositório `IndexedDbProjectRepository`.
   - Suporte completo a operações CRUD de projetos, salvamento automático de rascunhos e controle de data de modificação.

3. **Editor Canvas Visual**:
   - Canvas interativo em 2D com suporte a Zoom, Pan, Grid snap, seleção individual e em grupo.
   - Gerenciamento de camadas (Layers) com visibilidade e bloqueio.
   - Painel de propriedades para ajuste fino de coordenadas, dimensões, cores, rotação e tipo.
   - Histórico de ações com atalhos de teclado (Ctrl+Z, Ctrl+Y, Delete, Esquerda/Direita/Cima/Baixo).

4. **Importação e Exportação**:
   - Exportação de projetos no formato JSON (`.inframap`).
   - Importação com validação de esquema.
   - Exportação do canvas em imagem PNG e SVG.

---

## Validações Executadas

- **Lint**: `npm run lint` — verificação de sintaxe e regras do TypeScript sem erros.
- **Typecheck**: `npm run typecheck` / tsc — checagem de tipos estática 100% válida.
- **Testes**: `npm run test` / vitest — suíte de testes de unidade cobrindo conversão de unidades, histórico undo/redo, validação do schema do projeto e repositório IndexedDB.
- **Build**: `npm run build` — compilação de produção gerada em `dist/`.
