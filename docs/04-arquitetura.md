# Arquitetura proposta

## Stack inicial

### Frontend

- React;
- TypeScript;
- Vite;
- react-konva para o editor visual;
- Zustand para estado do editor;
- TanStack Query para estado do servidor;
- i18next para internacionalização;
- IndexedDB para rascunhos e cache local;
- service worker para recursos de PWA.

### Backend

- Node.js;
- TypeScript;
- API REST;
- Prisma ORM;
- PostgreSQL como banco recomendado;
- autenticação baseada em sessão segura ou tokens de curta duração.

## Organização lógica

```text
apps/
├── web/                  # PWA React
└── api/                  # API Node.js

packages/
├── domain/               # tipos e regras compartilhadas
├── editor-core/          # comandos, seleção e histórico
├── project-schema/       # formato versionado dos projetos
└── ui/                   # componentes compartilhados
```

Para simplificar o primeiro MVP no AI Studio, a implementação pode iniciar em um único projeto full-stack, desde que os limites entre domínio, editor, persistência e interface sejam preservados.

## Fluxo de dados

```text
Interface React
    ↓
Estado do editor (Zustand)
    ↓
Comandos serializáveis
    ↓
Documento do projeto
    ↙             ↘
IndexedDB          API REST
                       ↓
                   PostgreSQL
```

## Decisões

### Canvas

O canvas é uma visualização do documento. Os objetos técnicos não devem existir somente como nós do Konva. O domínio mantém os dados e o renderer cria a representação visual.

### Unidades

O documento armazena coordenadas em milímetros. A camada de visualização converte milímetros para pixels conforme escala e zoom.

### Histórico

Desfazer e refazer devem utilizar comandos ou snapshots controlados. Não depender diretamente do histórico interno de componentes visuais.

### Persistência

O projeto deve possuir um `schemaVersion`. Mudanças futuras no formato serão tratadas por migrações do documento.

### Offline

No MVP, o IndexedDB mantém rascunhos locais. O servidor continua sendo a origem oficial após sincronização. Edição simultânea offline não faz parte da primeira versão.

## Segurança

- validação de entrada na API;
- autorização por recurso e módulo;
- senhas com hash seguro;
- cookies seguros quando forem utilizadas sessões;
- limitação de tamanho e tipo para imagens importadas;
- sanitização de textos exibidos e exportados;
- auditoria de alterações administrativas relevantes.
