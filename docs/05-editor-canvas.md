# Editor e canvas

## Documento visual

O Workspace representa um projeto técnico composto por objetos independentes da biblioteca gráfica.

Cada objeto deve possuir, no mínimo:

- identificador único;
- tipo;
- posição em milímetros;
- dimensões em milímetros;
- rotação;
- camada;
- ordem visual;
- estado de bloqueio;
- propriedades específicas.

## Ferramentas iniciais

- seleção;
- mão para movimentação;
- retângulo;
- elipse;
- linha e polilinha;
- parede;
- texto;
- cota simples;
- imagem;
- equipamento;
- conexão.

## Sistema de coordenadas

O projeto usa milímetros como unidade interna. A interface pode exibir e receber valores em milímetros, centímetros ou metros.

```text
pixel = milímetro × escalaVisual × zoom
```

A escala visual não deve alterar os dados físicos do objeto.

## Zoom e navegação

- zoom centralizado no cursor;
- limites mínimo e máximo configurados;
- pan com ferramenta mão, botão central ou gesto;
- enquadrar todo o projeto;
- enquadrar seleção;
- minimapa opcional após o MVP.

## Grade e encaixe

- espaçamento configurável em unidade física;
- grade principal e subdivisões;
- encaixe opcional;
- guias de alinhamento;
- alinhamento por bordas e centros.

## Seleção e transformação

- clique para selecionar;
- arraste de área para seleção múltipla;
- mover, redimensionar e rotacionar;
- bloquear proporção quando aplicável;
- copiar, colar, duplicar e agrupar;
- bloquear objetos e camadas.

## Camadas sugeridas

- planta arquitetônica;
- mobiliário;
- rede lógica;
- cabeamento;
- CFTV;
- telefonia;
- elétrica;
- Wi-Fi;
- anotações;
- medições.

## Conexões

Uma conexão é um objeto técnico com trajeto visual. Ela pode ser reta ou possuir pontos intermediários.

O trajeto deve permanecer associado às extremidades quando equipamentos forem movimentados. Cada extremidade referencia uma porta ou um ponto livre do projeto.

## Exportação

O editor deve oferecer inicialmente:

- PNG do projeto inteiro;
- PNG da área visível;
- PNG da seleção;
- escolha das camadas incluídas;
- fator de resolução;
- fundo transparente ou preenchido.

SVG e PDF ficam previstos para evolução posterior.
