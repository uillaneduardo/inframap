# Modelo de dados inicial

## Entidades principais

### User

- id
- name
- email
- passwordHash
- locale
- status
- createdAt
- updatedAt

### Role e Permission

- funções atribuídas a usuários;
- permissões por módulo e operação;
- possibilidade futura de escopo por organização ou cliente.

### Project

- id
- name
- description
- customerName
- baseUnit
- widthMm
- heightMm
- schemaVersion
- status
- createdBy
- createdAt
- updatedAt

### Layer

- id
- projectId
- name
- order
- visible
- locked
- exportable

### Manufacturer e DeviceCategory

Catálogos utilizados pela Library para organizar modelos.

### DeviceModel

- id
- manufacturerId
- categoryId
- name
- code
- version
- widthMm
- heightMm
- depthMm
- appearance
- defaultProperties
- status

### PortModel

- id
- deviceModelId
- name
- index
- portTypeId
- connectorTypeId
- direction
- medium
- relativeX
- relativeY
- properties

### ProjectObject

Entidade comum para objetos visuais:

- id
- projectId
- layerId
- objectType
- xMm
- yMm
- widthMm
- heightMm
- rotationDeg
- zIndex
- locked
- style
- data

### DeviceInstance

Extensão lógica de ProjectObject:

- projectObjectId
- deviceModelId
- modelVersion
- logicalName
- ipAddress
- serialNumber
- assetTag
- operationalStatus
- customProperties

### PortInstance

- id
- deviceInstanceId
- portModelId
- nameOverride
- status
- customProperties

### Connection

- id
- projectId
- endpointA
- endpointB
- cableModelId
- lengthMm
- label
- status
- pathPoints
- properties

### CableModel

- id
- name
- medium
- category
- connectorAId
- connectorBId
- supportsPower
- defaultProperties

## Persistência do documento

O banco relacional mantém entidades consultáveis. O projeto também pode possuir um snapshot JSON versionado para carregamento rápido e recuperação.

Evitar que o snapshot seja a única fonte dos dados importantes. Informações como equipamentos, portas e conexões devem poder ser consultadas pela API.

## Identificadores

Utilizar UUIDs para entidades sincronizáveis. Isso permite criar objetos localmente antes da sincronização sem depender de IDs sequenciais fornecidos pelo servidor.
