# Módulos do InfraMap SaaS

## Princípio de organização

Os módulos devem refletir responsabilidades claras do usuário e evitar telas genéricas com funções desconectadas.

A navegação principal do cliente será composta por:

- Workspace;
- Library;
- Console.

A operação interna do SaaS será separada em Platform Admin.

## Workspace

O Workspace concentra o trabalho diário.

### Dashboard

- projetos recentes;
- projetos favoritos;
- atividades recentes;
- alterações pendentes de sincronização;
- consumo resumido do plano;
- atalhos para criar projeto e abrir modelos.

### Projects

- criar projeto;
- listar, buscar e filtrar;
- duplicar;
- arquivar;
- restaurar;
- compartilhar com membros;
- definir cliente, site, unidade e responsáveis;
- controlar status e versão.

### Editor

- canvas;
- formas geométricas;
- equipamentos;
- portas;
- conexões;
- cabos;
- camadas;
- medidas;
- grade;
- zoom;
- histórico;
- importação;
- exportação;
- salvamento local;
- sincronização.

### Sites

Representa locais documentados pela organização.

Exemplos:

- cliente;
- prédio;
- unidade;
- andar;
- sala;
- rack;
- área externa.

### Assets

Inventário das instâncias utilizadas nos projetos.

- equipamentos;
- identificação;
- fabricante e modelo;
- serial;
- patrimônio;
- IP;
- localização;
- status;
- observações;
- histórico básico.

### Reports

- lista de equipamentos;
- lista de portas;
- lista de cabos;
- conexões;
- endereços e identificações;
- exportações de projeto;
- relatórios futuros por site e organização.

### Activity

- criação e alteração de projetos;
- importações e exportações;
- alterações relevantes no inventário;
- eventos de sincronização;
- histórico acessível conforme permissão.

## Library

A Library contém modelos reutilizáveis e não as instâncias instaladas em um projeto.

### Manufacturers

- fabricantes;
- logotipo;
- site;
- observações.

### Categories

Exemplos:

- roteadores;
- switches;
- firewalls;
- servidores;
- patch panels;
- câmeras;
- centrais telefônicas;
- modems;
- conversores;
- power baluns;
- fontes e dispositivos PoE.

### Device Models

- fabricante;
- modelo;
- categoria;
- dimensões;
- imagem ou símbolo;
- propriedades padrão;
- portas;
- alimentação;
- capacidade PoE;
- versão do modelo.

### Ports

- nome;
- tipo;
- conector;
- direção;
- velocidade;
- meio;
- energia;
- posição visual.

### Connectors

Exemplos:

- RJ45;
- RJ11;
- LC;
- SC;
- ST;
- BNC;
- borne;
- P4;
- USB;
- HDMI;
- conectores personalizados.

### Cable Models

- categoria;
- meio;
- conectores permitidos;
- velocidade;
- capacidade de energia;
- cor padrão;
- propriedades técnicas.

### Symbols

- símbolos de rede;
- símbolos arquitetônicos;
- energia;
- CFTV;
- telefonia;
- anotações.

### Templates

- plantas vazias;
- racks;
- topologias;
- modelos de projeto por finalidade;
- conjuntos de camadas.

### Escopos da Library

- **Global**: fornecida pela plataforma;
- **Organization**: criada e mantida pela organização;
- **Personal**: recursos privados do usuário, futuramente.

Conteúdo global não deve ser alterado diretamente por organizações. A organização pode copiar um modelo global para personalizá-lo.

## Console

O Console administra a organização atualmente selecionada.

### Organization

- nome;
- identidade visual;
- dados cadastrais;
- idioma padrão;
- unidade padrão;
- fuso horário;
- configurações gerais.

### Members

- convites;
- membros ativos;
- membros suspensos;
- papéis;
- remoção de acesso.

### Roles and Permissions

Papéis iniciais:

- Owner;
- Admin;
- Editor;
- Viewer.

Permissões futuras podem controlar ações por módulo e recurso.

### Preferences

- idioma;
- tema;
- unidade;
- grade padrão;
- preferências de exportação;
- comportamento do editor.

### Custom Fields

- campos personalizados para projetos;
- equipamentos;
- sites;
- conexões;
- modelos.

### Audit Log

- ações administrativas;
- alterações de papéis;
- mudanças de assinatura;
- alterações de configurações;
- eventos relevantes de segurança.

### Subscription and Usage

- plano atual;
- status da assinatura;
- usuários utilizados;
- armazenamento;
- quantidade de projetos;
- limites e consumo;
- histórico de cobrança futuro.

### Integrations

- armazenamento externo;
- importação e exportação;
- webhooks futuros;
- NetBox;
- equipamentos e fabricantes;
- serviços de autenticação futuros.

## Platform Admin

O Platform Admin não pertence à organização cliente.

É uma aplicação ou área separada para a operação do InfraMap.

### Organizations

- consulta e suporte;
- status;
- plano;
- bloqueios;
- uso.

### Users

- consulta para suporte;
- status de conta;
- sessões e eventos de segurança, respeitando privacidade.

### Plans

- recursos disponíveis;
- limites;
- preços;
- período de cobrança;
- regras comerciais.

### Subscriptions

- status;
- provedor de pagamento;
- eventos de cobrança;
- falhas;
- cancelamento.

### Feature Flags

- liberar recursos gradualmente;
- testes internos;
- recursos beta por organização.

### Global Library

- modelos oficiais;
- revisão;
- publicação;
- versões;
- descontinuação.

### Support

- solicitações;
- contexto técnico controlado;
- ferramentas de diagnóstico;
- impersonação somente se implementada com auditoria, aviso e regras rigorosas.

### System Health

- serviços;
- filas;
- banco;
- armazenamento;
- e-mail;
- erros;
- métricas operacionais.

## Entidades transversais

As seguintes entidades são compartilhadas por vários módulos:

- Organization;
- User;
- Membership;
- Role;
- Project;
- Site;
- DeviceModel;
- Asset;
- Port;
- Connection;
- CableModel;
- Subscription;
- Plan;
- AuditEvent.

Cada entidade deve possuir um único responsável de domínio, mesmo quando for apresentada em mais de um módulo.

## Regras de navegação

- Workspace é a entrada padrão após o login;
- Library é acessível conforme papel e permissão;
- Console é restrito a Owner e Admin, salvo permissões específicas;
- Platform Admin utiliza autenticação e autorização separadas;
- a organização ativa deve estar sempre visível na interface;
- usuários com acesso a várias organizações podem alternar entre elas;
- nenhuma tela deve misturar dados de organizações diferentes.

## Prioridade do MVP

### Implementar primeiro

- Workspace: Projects e Editor;
- Library: modelos básicos locais;
- persistência IndexedDB;
- estrutura de organização prevista nos tipos;
- separação de repositórios de dados.

### Implementar depois

- autenticação;
- organizações;
- membros;
- API e MySQL;
- sincronização;
- Console funcional;
- assinatura e limites;
- Platform Admin.
