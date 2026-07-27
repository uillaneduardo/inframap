import { z } from 'zod';
import { ProjectDocument, ProjectUnit } from '@inframap/domain';

export const CURRENT_SCHEMA_VERSION = 1;

export const ProjectUnitSchema = z.enum(['mm', 'cm', 'm']);

export const LayerSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  name: z.string().min(1),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const BaseCanvasObjectSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  type: z.enum(['rectangle', 'circle', 'line', 'text']),
  name: z.string().min(1),
  title: z.string().optional(),
  showTitle: z.boolean().default(true).optional(),
  layerId: z.string(),
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
  stroke: z.string().default('#000000'),
  strokeWidth: z.number().nonnegative().default(1),
  fill: z.string().default('#3b82f6'),
  opacity: z.number().min(0).max(1).default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RectangleObjectSchema = BaseCanvasObjectSchema.extend({
  type: z.literal('rectangle'),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const CircleObjectSchema = BaseCanvasObjectSchema.extend({
  type: z.literal('circle'),
  radius: z.number().positive(),
});

export const LineObjectSchema = BaseCanvasObjectSchema.extend({
  type: z.literal('line'),
  points: z.array(z.number()).min(4),
  lineStyle: z.enum(['solid', 'dashed']).default('solid').optional(),
});

export const TextObjectSchema = BaseCanvasObjectSchema.extend({
  type: z.literal('text'),
  text: z.string(),
  fontSize: z.number().positive(),
  fontFamily: z.string().default('sans-serif'),
  align: z.enum(['left', 'center', 'right']).default('left'),
});

export const CanvasObjectSchema = z.discriminatedUnion('type', [
  RectangleObjectSchema,
  CircleObjectSchema,
  LineObjectSchema,
  TextObjectSchema,
]);

export const ProjectSettingsSchema = z.object({
  unit: ProjectUnitSchema,
  width: z.number().positive(),
  height: z.number().positive(),
  gridSize: z.number().positive(),
  canonicalWidth: z.number().positive(),
  canonicalHeight: z.number().positive(),
  canonicalGridSize: z.number().positive(),
  snapToGrid: z.boolean().default(true),
  backgroundColor: z.string().default('#ffffff'),
});

export const ViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  scale: z.number().positive(),
});

export const ProjectDocumentSchema = z.object({
  schemaVersion: z.number().int().positive().default(CURRENT_SCHEMA_VERSION),
  id: z.string(),
  organizationId: z.string().nullable().default(null),
  ownerId: z.string().nullable().default(null),
  name: z.string().min(1, 'O nome do projeto é obrigatório.'),
  description: z.string().optional().default(''),
  unit: ProjectUnitSchema,
  canonicalWidth: z.number().positive(),
  canonicalHeight: z.number().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().nonnegative().default(1),
  settings: ProjectSettingsSchema,
  layers: z.array(LayerSchema).min(1, 'O projeto deve ter ao menos uma camada.'),
  objects: z.array(CanvasObjectSchema).default([]),
  viewport: ViewportSchema.optional(),
});

export type ProjectDocumentInferred = z.infer<typeof ProjectDocumentSchema>;

/**
 * Migrate older raw project documents to current schema version
 */
export function migrateProjectDocument(rawInput: unknown): Record<string, unknown> {
  if (!rawInput || typeof rawInput !== 'object') {
    throw new Error('Documento de projeto inválido (não é um objeto).');
  }

  const raw = { ...(rawInput as Record<string, unknown>) };
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;

  // Handle Legacy format from previous simple versions
  if (version === 0) {
    const rawUnit = typeof raw.unit === 'string' ? raw.unit : 'mm';
    const unit: ProjectUnit = ['mm', 'cm', 'm'].includes(rawUnit) ? (rawUnit as ProjectUnit) : 'mm';
    const width = typeof raw.width === 'number' && raw.width > 0 ? raw.width : 1000;
    const height = typeof raw.height === 'number' && raw.height > 0 ? raw.height : 1000;
    const gridSize = typeof raw.gridSize === 'number' && raw.gridSize > 0 ? raw.gridSize : 10;

    let canonicalWidth = typeof raw.canonicalWidth === 'number' ? raw.canonicalWidth : 0;
    let canonicalHeight = typeof raw.canonicalHeight === 'number' ? raw.canonicalHeight : 0;
    let canonicalGridSize = typeof raw.canonicalGridSize === 'number' ? raw.canonicalGridSize : 0;

    if (!canonicalWidth) {
      canonicalWidth = unit === 'cm' ? width * 10 : unit === 'm' ? width * 1000 : width;
    }
    if (!canonicalHeight) {
      canonicalHeight = unit === 'cm' ? height * 10 : unit === 'm' ? height * 1000 : height;
    }
    if (!canonicalGridSize) {
      canonicalGridSize = unit === 'cm' ? gridSize * 10 : unit === 'm' ? gridSize * 1000 : gridSize;
    }

    const defaultLayerId = crypto.randomUUID();
    const rawLayers = Array.isArray(raw.layers) ? raw.layers : [];
    const layers = rawLayers.length > 0
      ? rawLayers
      : [{ id: defaultLayerId, name: 'Camada Padrão', visible: true, locked: false, order: 0 }];

    const migrated: Record<string, unknown> = {
      schemaVersion: 1,
      id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
      organizationId: raw.organizationId || null,
      ownerId: raw.ownerId || null,
      name: typeof raw.name === 'string' ? raw.name : 'Projeto Sem Nome',
      description: typeof raw.description === 'string' ? raw.description : '',
      unit,
      canonicalWidth,
      canonicalHeight,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
      version: typeof raw.version === 'number' ? raw.version : 1,
      settings: {
        unit,
        width,
        height,
        gridSize,
        canonicalWidth,
        canonicalHeight,
        canonicalGridSize,
        snapToGrid: true,
        backgroundColor: '#ffffff',
      },
      layers,
      objects: Array.isArray(raw.objects) ? raw.objects : [],
      viewport: raw.viewport || { x: 0, y: 0, scale: 1 },
    };
    version = 1;
    return migrated;
  }

  return raw;
}

export interface ValidationSuccess {
  success: true;
  document: ProjectDocument;
}

export interface ValidationError {
  success: false;
  error: string;
}

export type JsonValidationResult = ValidationSuccess | ValidationError;

export const CreateProjectFormSchema = z.object({
  name: z.string().min(2, 'O nome do projeto deve ter no mínimo 2 caracteres.').max(100, 'O nome não pode exceder 100 caracteres.'),
  description: z.string().max(500, 'A descrição não pode exceder 500 caracteres.').optional(),
  unit: z.enum(['mm', 'cm', 'm']),
  width: z.number().positive('A largura deve ser um valor positivo.'),
  height: z.number().positive('A altura deve ser um valor positivo.'),
  gridSize: z.number().positive('O tamanho da grade deve ser um valor positivo.'),
});
export type CreateProjectFormData = z.infer<typeof CreateProjectFormSchema>;

export const LayerFormSchema = z.object({
  name: z.string().min(1, 'O nome da camada é obrigatório.').max(50, 'Nome de camada muito longo.'),
});
export type LayerFormData = z.infer<typeof LayerFormSchema>;

export function validateAndParseProjectJson(
  jsonString: string,
  generateNewIds = false
): JsonValidationResult {
  try {
    const parsedJson: unknown = JSON.parse(jsonString);
    const migrated = migrateProjectDocument(parsedJson);

    if (generateNewIds) {
      migrated.id = crypto.randomUUID();
      const layerIdMap = new Map<string, string>();
      const layers = (Array.isArray(migrated.layers) ? migrated.layers : []) as Array<Record<string, unknown>>;

      migrated.layers = layers.map((l) => {
        const oldId = typeof l.id === 'string' ? l.id : crypto.randomUUID();
        const newId = crypto.randomUUID();
        layerIdMap.set(oldId, newId);
        return { ...l, id: newId };
      });

      const firstLayerId = ((migrated.layers as Array<{ id: string }>)[0]?.id) || crypto.randomUUID();
      const objects = (Array.isArray(migrated.objects) ? migrated.objects : []) as Array<Record<string, unknown>>;

      migrated.objects = objects.map((o) => ({
        ...o,
        id: crypto.randomUUID(),
        layerId: typeof o.layerId === 'string' && layerIdMap.has(o.layerId)
          ? layerIdMap.get(o.layerId)!
          : firstLayerId,
      }));
    }

    const result = ProjectDocumentSchema.safeParse(migrated);
    if (!result.success) {
      const issueMsgs = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return {
        success: false,
        error: `Estrutura de documento inválida: ${issueMsgs}`,
      };
    }

    return {
      success: true,
      document: result.data as ProjectDocument,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sintaxe inválida';
    return {
      success: false,
      error: `Falha na leitura do arquivo JSON: ${message}`,
    };
  }
}

export function serializeProjectDocument(doc: ProjectDocument): string {
  return JSON.stringify(doc, null, 2);
}
