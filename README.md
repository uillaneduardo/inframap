# InfraMap

SaaS PWA para criação de plantas técnicas e mapeamento visual de redes, infraestrutura, equipamentos, portas e cabeamento físico e lógico.

## Produto

O InfraMap será uma plataforma multi-tenant para equipes técnicas documentarem ambientes físicos e lógicos, combinando editor visual, inventário técnico, biblioteca de modelos e gestão organizacional.

## Módulos principais

- **Workspace** — dashboard, projetos, editor visual, ambientes, inventário, relatórios e atividades.
- **Library** — fabricantes, categorias, modelos de equipamentos, portas, conectores, cabos, símbolos e templates reutilizáveis.
- **Console** — organização, membros, permissões, preferências, campos personalizados, auditoria, assinatura, consumo e integrações.

A administração interna da operação do SaaS será tratada separadamente como **Platform Admin**, sem misturar recursos da plataforma com o Console dos clientes.

## Arquitetura

O projeto será mantido como monorepositório, com aplicações separadas para PWA, API e serviços futuros, além de pacotes compartilhados para domínio, editor, validação, banco de dados, autenticação, cliente da API, interface e internacionalização.

O editor seguirá uma abordagem local-first:

- resposta imediata no navegador;
- cache e rascunhos em IndexedDB;
- sincronização posterior com a API;
- MySQL acessado exclusivamente pelo backend;
- isolamento de dados por organização.

## Objetivo

Reunir em uma única aplicação recursos de desenho técnico simplificado, documentação de infraestrutura e inventário visual. O sistema permitirá representar plantas, racks, equipamentos, portas, enlaces e trajetos de cabos utilizando unidades reais, camadas e modelos reutilizáveis.

## Status

Projeto em fase de documentação e definição do MVP SaaS.

## Documentação

A documentação funcional e técnica está organizada na pasta [`docs`](docs/).
