# Escopo do MVP

## Objetivo

Entregar uma primeira versão utilizável para criar projetos, desenhar plantas simplificadas, posicionar equipamentos e registrar conexões técnicas.

## Incluído

### Projetos

- criar, editar, duplicar e arquivar projetos;
- definir nome, descrição, cliente, unidade e dimensões;
- salvar e reabrir o estado do projeto.

### Canvas

- zoom, pan e enquadramento;
- grade configurável e encaixe na grade;
- seleção simples e múltipla;
- mover, redimensionar, rotacionar, duplicar e excluir;
- desfazer e refazer;
- formas básicas, linhas, textos e imagens de fundo;
- camadas visíveis, ocultas, bloqueadas e desbloqueadas.

### Equipamentos

- inserir modelos da Library;
- criar instâncias com nome, IP, patrimônio, serial, status e observações;
- exibir e utilizar portas como pontos de conexão;
- permitir propriedades personalizadas.

### Conexões

- ligar portas compatíveis;
- registrar tipo de cabo, conectores, meio, comprimento, identificação, status e PoE;
- editar o trajeto visual do cabo;
- impedir conexões inválidas quando houver regra configurada.

### Medidas

- trabalhar em milímetros, centímetros ou metros;
- armazenar coordenadas em unidade lógica independente de pixels;
- exibir réguas, coordenadas e cotas simples.

### Exportação

- exportar projeto inteiro ou seleção em PNG;
- exportar e importar o arquivo JSON do projeto.

### PWA e idiomas

- instalação como PWA;
- interface inicial em português do Brasil;
- estrutura preparada para inglês;
- cache da aplicação e rascunho local.

## Fora do MVP

- simulação real de protocolos;
- descoberta automática de rede;
- colaboração simultânea;
- edição offline multiusuário com resolução avançada de conflitos;
- importação ou edição de DWG;
- cálculo de cobertura Wi-Fi;
- integração com FortiGate, NetBox ou equipamentos físicos;
- roteamento automático avançado de cabos;
- aplicação móvel nativa.

## Critério de sucesso

Um usuário deve conseguir criar uma planta, inserir equipamentos com portas, conectá-los por cabos configuráveis, salvar o projeto e exportar uma imagem sem depender de software externo.
