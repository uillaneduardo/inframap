import { describe, it, expect } from 'vitest';
import {
  validateAndParseProjectJson,
  serializeProjectDocument,
  migrateProjectDocument,
} from '@inframap/project-schema';
import { ProjectDocument } from '@inframap/domain';

describe('Project Schema & JSON Validation', () => {
  const sampleDoc: ProjectDocument = {
    schemaVersion: 1,
    id: 'b7c2a2f8-9a3c-4e8a-8c3b-1d2e3f4a5b6c',
    organizationId: null,
    ownerId: null,
    name: 'Datacenter A',
    description: 'Teste de validação',
    unit: 'm',
    canonicalWidth: 10000,
    canonicalHeight: 8000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    version: 1,
    settings: {
      unit: 'm',
      width: 10,
      height: 8,
      gridSize: 0.5,
      canonicalWidth: 10000,
      canonicalHeight: 8000,
      canonicalGridSize: 500,
      snapToGrid: true,
      backgroundColor: '#ffffff',
    },
    layers: [
      {
        id: '10000000-1000-4000-8000-100000000001',
        name: 'Camada Padrão',
        visible: true,
        locked: false,
        order: 0,
      },
    ],
    objects: [
      {
        id: '10000000-1000-4000-8000-100000000002',
        type: 'rectangle',
        name: 'Rack 01',
        layerId: '10000000-1000-4000-8000-100000000001',
        x: 1000,
        y: 1000,
        rotation: 0,
        locked: false,
        visible: true,
        stroke: '#000000',
        strokeWidth: 2,
        fill: '#3b82f6',
        opacity: 1,
        width: 800,
        height: 1200,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };

  it('serializes and validates project document JSON correctly', () => {
    const jsonStr = serializeProjectDocument(sampleDoc);
    const res = validateAndParseProjectJson(jsonStr);

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.document.name).toBe('Datacenter A');
      expect(res.document.objects.length).toBe(1);
    }
  });

  it('migrates legacy format without schemaVersion to version 1', () => {
    const legacyRaw = {
      name: 'Projeto Legado',
      unit: 'm',
      width: 15,
      height: 10,
      gridSize: 1,
    };

    const migrated = migrateProjectDocument(legacyRaw);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.canonicalWidth).toBe(15000);
    expect(migrated.canonicalHeight).toBe(10000);
    expect(migrated.layers.length).toBe(1);
  });

  it('rejects malformed JSON strings gracefully', () => {
    const res = validateAndParseProjectJson('{ invalid json');
    expect(res.success).toBe(false);
  });
});
