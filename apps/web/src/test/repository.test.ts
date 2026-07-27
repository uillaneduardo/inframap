import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectDocument, ProjectSummary } from '@inframap/domain';
import { ProjectRepository } from '../infrastructure/repositories/ProjectRepository';

class MemoryProjectRepository implements ProjectRepository {
  private docs = new Map<string, ProjectDocument>();

  async list(): Promise<ProjectSummary[]> {
    return Array.from(this.docs.values()).map((doc) => ({
      id: doc.id,
      organizationId: doc.organizationId,
      ownerId: doc.ownerId,
      name: doc.name,
      description: doc.description,
      unit: doc.unit,
      canonicalWidth: doc.canonicalWidth,
      canonicalHeight: doc.canonicalHeight,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      version: doc.version,
    }));
  }

  async findById(id: string): Promise<ProjectDocument | null> {
    return this.docs.get(id) || null;
  }

  async save(project: ProjectDocument): Promise<void> {
    this.docs.set(project.id, { ...project });
  }

  async delete(id: string): Promise<void> {
    this.docs.delete(id);
  }

  async duplicate(id: string): Promise<ProjectDocument> {
    const source = this.docs.get(id);
    if (!source) throw new Error('Not found');
    const newId = crypto.randomUUID();
    const copy: ProjectDocument = {
      ...source,
      id: newId,
      name: `${source.name} (Cópia)`,
    };
    this.docs.set(newId, copy);
    return copy;
  }

  async import(project: ProjectDocument): Promise<ProjectDocument> {
    this.docs.set(project.id, project);
    return project;
  }
}

describe('Project Repository CRUD Operations', () => {
  let repo: ProjectRepository;

  beforeEach(() => {
    repo = new MemoryProjectRepository();
  });

  it('saves and retrieves a project document', async () => {
    const doc: ProjectDocument = {
      schemaVersion: 1,
      id: 'proj-1',
      organizationId: null,
      ownerId: null,
      name: 'Datacenter A',
      description: 'Planta 1',
      unit: 'm',
      canonicalWidth: 10000,
      canonicalHeight: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      settings: {
        unit: 'm',
        width: 10,
        height: 10,
        gridSize: 1,
        canonicalWidth: 10000,
        canonicalHeight: 10000,
        canonicalGridSize: 1000,
        snapToGrid: true,
        backgroundColor: '#ffffff',
      },
      layers: [],
      objects: [],
    };

    await repo.save(doc);

    const retrieved = await repo.findById('proj-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Datacenter A');

    const list = await repo.list();
    expect(list.length).toBe(1);
  });

  it('duplicates project correctly', async () => {
    const doc: ProjectDocument = {
      schemaVersion: 1,
      id: 'proj-1',
      organizationId: null,
      ownerId: null,
      name: 'Sede SP',
      unit: 'm',
      canonicalWidth: 5000,
      canonicalHeight: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      settings: {
        unit: 'm',
        width: 5,
        height: 5,
        gridSize: 1,
        canonicalWidth: 5000,
        canonicalHeight: 5000,
        canonicalGridSize: 1000,
        snapToGrid: true,
        backgroundColor: '#ffffff',
      },
      layers: [],
      objects: [],
    };

    await repo.save(doc);
    const duplicated = await repo.duplicate('proj-1');

    expect(duplicated.id).not.toBe('proj-1');
    expect(duplicated.name).toBe('Sede SP (Cópia)');

    const list = await repo.list();
    expect(list.length).toBe(2);
  });

  it('deletes project from storage', async () => {
    const doc: ProjectDocument = {
      schemaVersion: 1,
      id: 'proj-1',
      organizationId: null,
      ownerId: null,
      name: 'Temp Project',
      unit: 'm',
      canonicalWidth: 1000,
      canonicalHeight: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      settings: {
        unit: 'm',
        width: 1,
        height: 1,
        gridSize: 1,
        canonicalWidth: 1000,
        canonicalHeight: 1000,
        canonicalGridSize: 1000,
        snapToGrid: true,
        backgroundColor: '#ffffff',
      },
      layers: [],
      objects: [],
    };

    await repo.save(doc);
    await repo.delete('proj-1');

    const retrieved = await repo.findById('proj-1');
    expect(retrieved).toBeNull();

    const list = await repo.list();
    expect(list.length).toBe(0);
  });
});
