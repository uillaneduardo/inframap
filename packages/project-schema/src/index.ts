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
  points: z.tuple([z.number(), z.number(), z.number(), z.number()]),
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
export function migrateProjectDocument(raw: any): any {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Documento de projeto inválido (não é um objeto).');
  }

  let version = raw.schemaVersion || 0;

  // Handle Legacy format from previous simple versions
  if (version === 0) {
    const unit: ProjectUnit = ['mm', 'cm', 'm'].includes(raw.unit) ? raw.unit : 'mm';
    const width = typeof raw.width === 'number' && raw.width > 0 ? raw.width : 1000;
    const height = typeof raw.height === 'number' && raw.height > 0 ? raw.height : 1000;
    const gridSize = typeof raw.gridSize === 'number' && raw.gridSize > 0 ? raw.gridSize : 10;

    let canonicalWidth = raw.canonicalWidth;
    let canonicalHeight = raw.canonicalHeight;
    let canonicalGridSize = raw.canonicalGridSize;

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
    const layers = Array.isArray(raw.layers) && raw.layers.length > 0
      ? raw.layers
      : [{ id: defaultLayerId, name: 'Camada Padrão', visible: true, locked: false, order: 0 }];

    raw = {
      schemaVersion: 1,
      id: raw.id || crypto.randomUUID(),
      organizationId: raw.organizationId || null,
      ownerId: raw.ownerId || null,
      name: raw.name || 'Projeto Sem Nome',
      description: raw.description || '',
      unit,
      canonicalWidth,
      canonicalHeight,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      version: raw.version || 1,
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

export function validateAndParseProjectJson(
  jsonString: string,
  generateNewIds = false
): JsonValidationResult {
  try {
    const parsedJson = JSON.parse(jsonString);
    const migrated = migrateProjectDocument(parsedJson);

    if (generateNewIds) {
      migrated.id = crypto.randomUUID();
      const layerIdMap = new Map<string, string>();
      migrated.layers = migrated.layers.map((l: any) => {
        const newId = crypto.randomUUID();
        layerIdMap.set(l.id, newId);
        return { ...l, id: newId };
      });

      const firstLayerId = migrated.layers[0]?.id || crypto.randomUUID();

      migrated.objects = migrated.objects.map((o: any) => ({
        ...o,
        id: crypto.randomUUID(),
        layerId: layerIdMap.get(o.layerId) || firstLayerId,
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
  } catch (err: any) {
    return {
      success: false,
      error: `Falha na leitura do arquivo JSON: ${err?.message || 'Sintaxe inválida'}`,
    };
  }
}

export function serializeProjectDocument(doc: ProjectDocument): string {
  return JSON.stringify(doc, null, 2);
}
