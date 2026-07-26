# Arquitetura proposta

## Direção do produto

O InfraMap será estruturado desde o início como um SaaS multi-tenant, mantendo o editor visual como núcleo do produto e permitindo que organizações distintas utilizem a mesma aplicação com dados isolados.

O sistema continuará adotando uma estratégia local-first para o Workspace: o editor trabalha com estado local e IndexedDB para oferecer resposta imediata, salvamento automático e suporte offline básico, enquanto a API e o banco remoto mantêm a versão oficial sincronizada.

## Stack recomendada

### Frontend

- React;
- TypeScript em modo estrito;
- Vite;
- React Router;
- react-konva para o editor visual;
- Zustand para estado temporário do editor;
- TanStack Query para estado remoto;
- i18next para internacionalização;
- IndexedDB para cache, rascunhos e fila de sincronização;
- service worker e vite-plugin-pwa.

### Backend

- Node.js;
- TypeScript;
- Fastify;
- API REST versionada;
- Prisma ORM;
- MySQL como banco principal;
- autenticação por sessão segura ou tokens de curta duração;
- filas e jobs assíncronos somente quando houver necessidade real.

### Infraestrutura

- armazenamento de objetos compatível com S3 para imagens, anexos e exportações futuras;
- serviço de e-mail transacional;
- logs estruturados;
- monitoramento de erros;
- CI para lint, testes e build;
- ambientes separados de desenvolvimento, homologação e produção.

## Organização do monorepositório

```text
inframap/
├── apps/
│   ├── web/                    # PWA React usada pelos clientes
│   ├── api/                    # API principal do SaaS
│   ├── worker/                 # jobs futuros, opcional no MVP
│   └── admin/                  # administração interna da plataforma, futura
├── packages/
│   ├── domain/                 # entidades, regras e contratos de domínio
│   ├── editor-core/            # comandos, seleção, histórico e geometria
│   ├── project-schema/         # formato versionado dos projetos
│   ├── validation/             # schemas compartilhados de validação
│   ├── api-client/             # cliente tipado da API
│   ├── auth/                   # contratos e utilitários de autenticação
│   ├── database/               # Prisma schema, migrations e seed
│   ├── ui/                     # design system e componentes compartilhados
│   ├── i18n/                   # recursos de idioma compartilhados
│   └── config/                 # configurações comuns de TS, ESLint e testes
├── docs/
├── examples/
├── prompts/
├── scripts/
└── .github/
    └── workflows/
```

O primeiro MVP pode iniciar apenas com `apps/web`, `apps/api` e os pacotes essenciais. Pastas futuras não devem conter funcionalidades vazias ou artificiais.

## Limites arquiteturais

### Aplicações

As pastas em `apps` são pontos de entrada executáveis. Elas montam e integram os pacotes, mas não devem concentrar regras de negócio reutilizáveis.

### Domínio

O pacote `domain` contém entidades e regras independentes de React, Fastify, Prisma ou IndexedDB.

Exemplos:

- organização;
- usuário e associação;
- projeto;
- modelo de equipamento;
- porta;
- conexão;
- assinatura;
- limites de plano.

### Editor

O pacote `editor-core` contém o documento do canvas e as operações do editor. Konva é apenas a camada de renderização.

### Persistência

O frontend acessa persistência por interfaces de repositório. Nenhum componente React deve acessar IndexedDB ou a API diretamente.

```text
Componente React
    ↓
Caso de uso ou serviço de aplicação
    ↓
Contrato de repositório
    ├── implementação IndexedDB
    └── implementação API
```

### Banco de dados

O acesso ao MySQL ocorre exclusivamente pelo backend. Credenciais do banco nunca são enviadas ao navegador.

## Multi-tenancy

A unidade principal de isolamento será a organização, também chamada de tenant.

```text
Organization
├── memberships
├── projects
├── library
├── settings
├── subscription
└── audit logs
```

As entidades pertencentes a clientes devem incluir `organizationId`.

A API nunca deve aceitar apenas o `organizationId` enviado pelo cliente como prova de autorização. A organização ativa deve ser validada a partir da sessão e da associação do usuário.

## Papéis iniciais

- **Owner** — proprietário da organização e responsável pela assinatura;
- **Admin** — administra usuários, biblioteca e configurações;
- **Editor** — cria e edita projetos;
- **Viewer** — visualiza projetos permitidos.

Permissões detalhadas podem ser acrescentadas futuramente sem substituir esses papéis iniciais.

## Módulos do produto

### Workspace

Área operacional do usuário.

Submódulos:

- Dashboard;
- Projects;
- Editor;
- Sites e ambientes;
- Assets e inventário do projeto;
- Reports e exportações;
- Activity.

### Library

Biblioteca de elementos reutilizáveis.

Submódulos:

- Manufacturers;
- Categories;
- Device Models;
- Ports;
- Connectors;
- Cable Models;
- Symbols;
- Templates;
- Global Library;
- Organization Library.

### Console

Administração da organização.

Submódulos:

- Organization;
- Members;
- Roles and Permissions;
- Preferences;
- Languages and Units;
- Custom Fields;
- Audit Log;
- Subscription and Usage;
- Integrations.

### Platform Admin

Área interna da operação do SaaS, separada do Console dos clientes.

Submódulos futuros:

- organizations;
- users;
- plans;
- subscriptions;
- feature flags;
- global library;
- support;
- system health;
- platform audit.

## Fluxo de dados do editor

```text
Interface React
    ↓
Estado de interação do editor
    ↓
Comandos serializáveis
    ↓
Documento versionado do projeto
    ├── IndexedDB e fila local
    └── serviço de sincronização
             ↓
          API REST
             ↓
            MySQL
```

## Documento do projeto

O projeto deve possuir:

- `id` em UUID;
- `organizationId`;
- `ownerId` ou `createdBy`;
- `schemaVersion`;
- `version` para concorrência otimista;
- `createdAt`;
- `updatedAt`;
- `deletedAt` opcional;
- conteúdo técnico separado do viewport pessoal.

Mudanças no formato do documento serão tratadas por migrações explícitas.

## Sincronização

O MVP não precisa oferecer colaboração em tempo real.

A estratégia inicial será:

1. alterações são aplicadas imediatamente no estado local;
2. o documento é salvo no IndexedDB com debounce;
3. alterações pendentes entram em uma fila local;
4. a API recebe uma versão esperada do projeto;
5. o backend utiliza concorrência otimista;
6. conflitos são comunicados ao usuário em vez de sobrescrever dados silenciosamente.

## Segurança

- isolamento obrigatório por organização;
- autorização por recurso e ação;
- validação de entrada em todas as rotas;
- hash seguro de senhas;
- sessões revogáveis;
- cookies `HttpOnly`, `Secure` e `SameSite` quando aplicável;
- rate limiting;
- proteção contra enumeração de usuários;
- limitação de tamanho e tipo de uploads;
- auditoria de ações administrativas;
- segredos somente no servidor;
- backups e restauração testados;
- exclusão lógica quando necessária para auditoria e recuperação.

## Evolução do SaaS

### Fase 1 — núcleo local

- Workspace;
- editor visual;
- IndexedDB;
- importação e exportação;
- Library local inicial.

### Fase 2 — conta e nuvem

- API;
- MySQL;
- autenticação;
- organizações;
- membros;
- sincronização remota.

### Fase 3 — operação comercial

- planos;
- limites;
- assinatura;
- cobrança;
- métricas de uso;
- administração interna.

### Fase 4 — colaboração e integrações

- compartilhamento avançado;
- comentários;
- colaboração;
- integrações com equipamentos e plataformas externas.
