# Modelos, instâncias, portas e conexões

## Modelo

Um modelo descreve um tipo reutilizável de equipamento, como um roteador, switch, câmera, patch panel, servidor, central telefônica, modem, injetor PoE ou power balun.

Campos iniciais:

- fabricante;
- nome e código do modelo;
- categoria;
- descrição;
- largura, altura e profundidade físicas;
- representação visual;
- propriedades padrão;
- lista de portas;
- versão e status.

## Instância

Uma instância representa o equipamento real inserido em um projeto.

Campos iniciais:

- modelo e versão utilizados;
- nome lógico;
- endereço IP;
- número de série;
- patrimônio;
- localização;
- status operacional;
- observações;
- propriedades sobrescritas;
- posição, dimensões e rotação no projeto.

## Portas

Uma porta de modelo define:

- nome e índice;
- tipo funcional;
- conector;
- direção: entrada, saída ou bidirecional;
- meio: cobre, fibra, coaxial, rádio ou energia;
- velocidade ou capacidade;
- suporte PoE de entrada ou saída;
- posição do ponto de conexão no desenho;
- regras de compatibilidade.

Exemplos de tipos:

- Ethernet;
- SFP/SFP+;
- BNC;
- RJ11;
- borne;
- alimentação DC;
- USB;
- HDMI;
- serial;
- porta passiva frontal ou traseira de patch panel.

## Conexão

Uma conexão possui:

- extremidade A;
- extremidade B;
- tipo de meio;
- modelo de cabo ou enlace;
- conectores A e B;
- comprimento informado ou calculado;
- identificação;
- cor;
- status;
- propriedades PoE;
- pontos intermediários do trajeto;
- observações.

## Compatibilidade

O sistema deve permitir regras configuráveis, sem bloquear a evolução do domínio. Exemplos:

- RJ45 Ethernet pode conectar-se a outra porta Ethernet compatível;
- fibra exige conectores e tipo de fibra adequados;
- alimentação não deve conectar-se a uma porta de dados;
- uma porta ocupada não aceita outra conexão, salvo quando o tipo permitir múltiplos vínculos;
- patch panels e adaptadores podem possuir vínculo interno entre portas.

## Versionamento

Alterações em um modelo criam nova versão quando puderem afetar instâncias existentes. Projetos antigos mantêm a versão utilizada e podem receber atualização por uma ação explícita do usuário.
