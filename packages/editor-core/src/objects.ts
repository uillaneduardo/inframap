import {
  CanvasObject,
  CircleObject,
  LineObject,
  RectangleObject,
  TextObject,
} from '@inframap/domain';

export function createRectangleObject(
  layerId: string,
  x: number,
  y: number,
  width = 200,
  height = 100,
  name?: string
): RectangleObject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: 'rectangle',
    name: name || 'Retângulo',
    layerId,
    x,
    y,
    rotation: 0,
    locked: false,
    visible: true,
    stroke: '#0f172a',
    strokeWidth: 2,
    fill: '#3b82f6',
    opacity: 0.9,
    width,
    height,
    createdAt: now,
    updatedAt: now,
  };
}

export function createCircleObject(
  layerId: string,
  x: number,
  y: number,
  radius = 80,
  name?: string
): CircleObject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: 'circle',
    name: name || 'Círculo',
    layerId,
    x,
    y,
    rotation: 0,
    locked: false,
    visible: true,
    stroke: '#0f172a',
    strokeWidth: 2,
    fill: '#10b981',
    opacity: 0.9,
    radius,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLineObject(
  layerId: string,
  x: number,
  y: number,
  points: [number, number, number, number] = [0, 0, 200, 0],
  name?: string
): LineObject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: 'line',
    name: name || 'Linha',
    layerId,
    x,
    y,
    rotation: 0,
    locked: false,
    visible: true,
    stroke: '#0f172a',
    strokeWidth: 3,
    fill: 'transparent',
    opacity: 1,
    points,
    createdAt: now,
    updatedAt: now,
  };
}

export function createTextObject(
  layerId: string,
  x: number,
  y: number,
  text = 'Rack A1',
  fontSize = 24,
  name?: string
): TextObject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: 'text',
    name: name || 'Texto',
    layerId,
    x,
    y,
    rotation: 0,
    locked: false,
    visible: true,
    stroke: 'transparent',
    strokeWidth: 0,
    fill: '#0f172a',
    opacity: 1,
    text,
    fontSize,
    fontFamily: 'Inter, sans-serif',
    align: 'left',
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateCanvasObject(
  obj: CanvasObject,
  offsetMm = 20
): CanvasObject {
  const now = new Date().toISOString();
  const newId = crypto.randomUUID();

  return {
    ...obj,
    id: newId,
    name: `${obj.name} (Cópia)`,
    x: obj.x + offsetMm,
    y: obj.y + offsetMm,
    createdAt: now,
    updatedAt: now,
  };
}
