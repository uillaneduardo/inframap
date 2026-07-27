import { describe, it, expect } from 'vitest';
import {
  createRectangleObject,
  createCircleObject,
  createLineObject,
  createTextObject,
  duplicateCanvasObject,
} from '@inframap/editor-core';

describe('Canvas Objects Factory Functions', () => {
  const layerId = 'layer-1';

  it('creates rectangle object with canonical dimensions', () => {
    const rect = createRectangleObject(layerId, 100, 200, 300, 150, 'Rack A');
    expect(rect.type).toBe('rectangle');
    expect(rect.x).toBe(100);
    expect(rect.y).toBe(200);
    expect(rect.width).toBe(300);
    expect(rect.height).toBe(150);
    expect(rect.name).toBe('Rack A');
    expect(rect.layerId).toBe(layerId);
  });

  it('creates circle object with canonical radius', () => {
    const circle = createCircleObject(layerId, 50, 50, 40, 'Ponto de Acesso');
    expect(circle.type).toBe('circle');
    expect(circle.radius).toBe(40);
    expect(circle.name).toBe('Ponto de Acesso');
  });

  it('creates line object with canonical points', () => {
    const line = createLineObject(layerId, 0, 0, [0, 0, 500, 0], 'Cabo Fibra');
    expect(line.type).toBe('line');
    expect(line.points).toEqual([0, 0, 500, 0]);
  });

  it('creates text object with text content and font size', () => {
    const text = createTextObject(layerId, 10, 10, 'Switch 01', 30);
    expect(text.type).toBe('text');
    expect(text.text).toBe('Switch 01');
    expect(text.fontSize).toBe(30);
  });

  it('duplicates canvas object with offset and new UUID', () => {
    const rect = createRectangleObject(layerId, 100, 100, 200, 200, 'Original');
    const copy = duplicateCanvasObject(rect, 25);

    expect(copy.id).not.toBe(rect.id);
    expect(copy.x).toBe(125);
    expect(copy.y).toBe(125);
    expect(copy.name).toBe('Original (Cópia)');
  });
});
