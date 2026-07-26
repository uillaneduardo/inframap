import { Project, ProjectUnit } from '../types/project';
import { Layer } from '../types/layer';
import { CanvasObject, CanvasObjectType } from '../types/canvas';
import { toCanonical } from './units';

export interface ExportedProjectData {
  version: string;
  project: Project;
  layers: Layer[];
  objects: CanvasObject[];
  exportedAt: string;
}

export function exportProjectToJson(
  project: Project,
  layers: Layer[],
  objects: CanvasObject[]
): string {
  const exportData: ExportedProjectData = {
    version: '1.0.0',
    project,
    layers,
    objects,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: {
    project: Project;
    layers: Layer[];
    objects: CanvasObject[];
  };
}

export function validateAndParseProjectJson(
  jsonString: string,
  generateNewIds = false
): ValidationResult {
  try {
    const raw = JSON.parse(jsonString);
    if (!raw || typeof raw !== 'object') {
      return { valid: false, error: 'O arquivo não contém um objeto JSON válido.' };
    }

    const rawProject = raw.project || raw;
    if (!rawProject.name || typeof rawProject.name !== 'string') {
      return { valid: false, error: 'Atributo "name" do projeto é obrigatório.' };
    }

    const unit: ProjectUnit = ['mm', 'cm', 'm'].includes(rawProject.unit)
      ? rawProject.unit
      : 'mm';

    const width = typeof rawProject.width === 'number' && rawProject.width > 0 ? rawProject.width : 1000;
    const height = typeof rawProject.height === 'number' && rawProject.height > 0 ? rawProject.height : 1000;
    const gridSize = typeof rawProject.gridSize === 'number' && rawProject.gridSize > 0 ? rawProject.gridSize : 10;

    const newProjectId = generateNewIds ? crypto.randomUUID() : rawProject.id || crypto.randomUUID();

    const project: Project = {
      id: newProjectId,
      name: rawProject.name,
      description: rawProject.description || '',
      unit,
      width,
      height,
      gridSize,
      canonicalWidth: rawProject.canonicalWidth || toCanonical(width, unit),
      canonicalHeight: rawProject.canonicalHeight || toCanonical(height, unit),
      canonicalGridSize: rawProject.canonicalGridSize || toCanonical(gridSize, unit),
      createdAt: rawProject.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Parse layers
    const layerIdMap = new Map<string, string>();
    const rawLayers = Array.isArray(raw.layers) ? raw.layers : [];
    let layers: Layer[] = [];

    if (rawLayers.length === 0) {
      const defaultLayerId = crypto.randomUUID();
      layers.push({
        id: defaultLayerId,
        name: 'Camada Padrão',
        visible: true,
        locked: false,
        order: 0,
      });
    } else {
      layers = rawLayers.map((l: any, index: number) => {
        const oldId = l.id || `layer-${index}`;
        const newId = generateNewIds ? crypto.randomUUID() : oldId;
        layerIdMap.set(oldId, newId);

        return {
          id: newId,
          name: typeof l.name === 'string' ? l.name : `Camada ${index + 1}`,
          visible: typeof l.visible === 'boolean' ? l.visible : true,
          locked: typeof l.locked === 'boolean' ? l.locked : false,
          order: typeof l.order === 'number' ? l.order : index,
        };
      });
    }

    const fallbackLayerId = layers[0].id;

    // Parse objects
    const rawObjects = Array.isArray(raw.objects) ? raw.objects : [];
    const validObjectTypes: CanvasObjectType[] = ['rectangle', 'circle', 'line', 'text'];

    const objects: CanvasObject[] = [];

    for (let i = 0; i < rawObjects.length; i++) {
      const obj = rawObjects[i];
      if (!obj || typeof obj !== 'object' || !validObjectTypes.includes(obj.type)) {
        continue;
      }

      const oldLayerId = obj.layerId;
      const targetLayerId = generateNewIds
        ? layerIdMap.get(oldLayerId) || fallbackLayerId
        : layers.some((l) => l.id === oldLayerId)
        ? oldLayerId
        : fallbackLayerId;

      const baseObj = {
        id: generateNewIds ? crypto.randomUUID() : obj.id || crypto.randomUUID(),
        type: obj.type as CanvasObjectType,
        name: typeof obj.name === 'string' ? obj.name : `${obj.type}_${i + 1}`,
        x: typeof obj.x === 'number' ? obj.x : 0,
        y: typeof obj.y === 'number' ? obj.y : 0,
        rotation: typeof obj.rotation === 'number' ? obj.rotation : 0,
        layerId: targetLayerId,
        locked: typeof obj.locked === 'boolean' ? obj.locked : false,
        visible: typeof obj.visible === 'boolean' ? obj.visible : true,
        stroke: typeof obj.stroke === 'string' ? obj.stroke : '#000000',
        strokeWidth: typeof obj.strokeWidth === 'number' ? obj.strokeWidth : 1,
        fill: typeof obj.fill === 'string' ? obj.fill : '#3b82f6',
        opacity: typeof obj.opacity === 'number' ? Math.max(0, Math.min(1, obj.opacity)) : 1,
        createdAt: obj.createdAt || new Date().toISOString(),
        updatedAt: obj.updatedAt || new Date().toISOString(),
      };

      if (obj.type === 'rectangle') {
        objects.push({
          ...baseObj,
          type: 'rectangle',
          width: typeof obj.width === 'number' && obj.width > 0 ? obj.width : 100,
          height: typeof obj.height === 'number' && obj.height > 0 ? obj.height : 100,
        });
      } else if (obj.type === 'circle') {
        objects.push({
          ...baseObj,
          type: 'circle',
          radius: typeof obj.radius === 'number' && obj.radius > 0 ? obj.radius : 50,
        });
      } else if (obj.type === 'line') {
        const pts = Array.isArray(obj.points) && obj.points.length >= 4 ? obj.points : [0, 0, 100, 100];
        objects.push({
          ...baseObj,
          type: 'line',
          points: [pts[0], pts[1], pts[2], pts[3]],
        });
      } else if (obj.type === 'text') {
        objects.push({
          ...baseObj,
          type: 'text',
          text: typeof obj.text === 'string' ? obj.text : 'Texto',
          fontSize: typeof obj.fontSize === 'number' && obj.fontSize > 0 ? obj.fontSize : 16,
          fontFamily: typeof obj.fontFamily === 'string' ? obj.fontFamily : 'sans-serif',
          align: ['left', 'center', 'right'].includes(obj.align) ? obj.align : 'left',
        });
      }
    }

    return {
      valid: true,
      data: { project, layers, objects },
    };
  } catch (e: any) {
    return {
      valid: false,
      error: `Falha ao processar arquivo JSON: ${e?.message || 'Sintaxe inválida.'}`,
    };
  }
}
