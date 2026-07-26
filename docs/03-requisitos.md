# Requisitos

## Requisitos funcionais

- **RF-001:** autenticar usuários e controlar o acesso aos módulos.
- **RF-002:** criar, editar, duplicar, arquivar e excluir projetos conforme permissão.
- **RF-003:** manter biblioteca de fabricantes, categorias e modelos.
- **RF-004:** definir dimensões, aparência, propriedades e portas de cada modelo.
- **RF-005:** inserir instâncias de modelos no canvas e personalizar seus dados.
- **RF-006:** desenhar formas geométricas, paredes, linhas, textos e cotas.
- **RF-007:** importar imagem de fundo para servir de referência da planta.
- **RF-008:** criar conexões entre portas e armazenar dados técnicos do meio.
- **RF-009:** organizar objetos em camadas.
- **RF-010:** trabalhar com milímetros, centímetros e metros.
- **RF-011:** controlar zoom, pan, grade, encaixe e alinhamento.
- **RF-012:** desfazer e refazer operações do editor.
- **RF-013:** salvar projetos no servidor e manter rascunhos locais.
- **RF-014:** exportar imagens e arquivos portáveis do projeto.
- **RF-015:** disponibilizar interface traduzível.
- **RF-016:** registrar histórico básico de alterações administrativas.

## Requisitos não funcionais

- **RNF-001:** frontend em TypeScript com tipagem estrita.
- **RNF-002:** interface responsiva para desktop e tablet.
- **RNF-003:** instalação como PWA e funcionamento básico sem conexão.
- **RNF-004:** coordenadas armazenadas em unidades físicas, nunca apenas em pixels.
- **RNF-005:** projetos devem suportar centenas de objetos sem travamentos perceptíveis.
- **RNF-006:** alterações do editor devem ser serializáveis e recuperáveis.
- **RNF-007:** API deve validar autenticação, autorização e dados de entrada.
- **RNF-008:** senhas devem ser armazenadas apenas como hashes seguros.
- **RNF-009:** o sistema deve manter separação entre modelo e instância.
- **RNF-010:** o formato de projeto deve possuir versão para futuras migrações.

## Regras de domínio iniciais

- uma porta pertence a uma instância de equipamento;
- uma conexão possui exatamente duas extremidades no MVP;
- uma extremidade pode referenciar uma porta ou um ponto livre do canvas;
- modelos não armazenam IP, patrimônio ou serial de equipamentos reais;
- excluir um equipamento conectado exige confirmação e tratamento das conexões;
- alterações em modelos não devem modificar silenciosamente instâncias existentes;
- cada projeto possui uma unidade-base, preferencialmente milímetros.
