import { ProjectDocument, ProjectSummary } from '@inframap/domain';
import { ProjectRepository } from './ProjectRepository';
import { dbInstance } from '../persistence/dexie.db';

export class IndexedDbProjectRepository implements ProjectRepository {
  async list(): Promise<ProjectSummary[]> {
    const list = await dbInstance.projects.toArray();
    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async findById(id: string): Promise<ProjectDocument | null> {
    const doc = await dbInstance.documents.get(id);
    return doc || null;
  }

  async save(project: ProjectDocument): Promise<void> {
    const now = new Date().toISOString();
    const updatedDoc: ProjectDocument = {
      ...project,
      updatedAt: now,
      version: (project.version || 0) + 1,
    };

    const summary: ProjectSummary = {
      id: updatedDoc.id,
      organizationId: updatedDoc.organizationId,
      ownerId: updatedDoc.ownerId,
      name: updatedDoc.name,
      description: updatedDoc.description,
      unit: updatedDoc.unit,
      canonicalWidth: updatedDoc.canonicalWidth,
      canonicalHeight: updatedDoc.canonicalHeight,
      createdAt: updatedDoc.createdAt,
      updatedAt: now,
      version: updatedDoc.version,
    };

    await dbInstance.transaction('rw', [dbInstance.projects, dbInstance.documents], async () => {
      await dbInstance.projects.put(summary);
      await dbInstance.documents.put(updatedDoc);
    });
  }

  async delete(id: string): Promise<void> {
    await dbInstance.transaction('rw', [dbInstance.projects, dbInstance.documents], async () => {
      await dbInstance.projects.delete(id);
      await dbInstance.documents.delete(id);
    });
  }

  async duplicate(id: string): Promise<ProjectDocument> {
    const sourceDoc = await this.findById(id);
    if (!sourceDoc) {
      throw new Error(`Projeto com ID "${id}" não encontrado.`);
    }

    const now = new Date().toISOString();
    const newProjectId = crypto.randomUUID();

    const layerIdMap = new Map<string, string>();
    const newLayers = sourceDoc.layers.map((l) => {
      const newLayerId = crypto.randomUUID();
      layerIdMap.set(l.id, newLayerId);
      return { ...l, id: newLayerId };
    });

    const fallbackLayerId = newLayers[0]?.id || crypto.randomUUID();

    const newObjects = sourceDoc.objects.map((o) => ({
      ...o,
      id: crypto.randomUUID(),
      name: `${o.name} (Cópia)`,
      layerId: layerIdMap.get(o.layerId) || fallbackLayerId,
      createdAt: now,
      updatedAt: now,
    }));

    const duplicatedDoc: ProjectDocument = {
      ...sourceDoc,
      id: newProjectId,
      name: `${sourceDoc.name} (Cópia)`,
      createdAt: now,
      updatedAt: now,
      version: 1,
      layers: newLayers,
      objects: newObjects,
    };

    await this.save(duplicatedDoc);
    return duplicatedDoc;
  }

  async import(project: ProjectDocument): Promise<ProjectDocument> {
    await this.save(project);
    return project;
  }
}

export const defaultProjectRepository: ProjectRepository = new IndexedDbProjectRepository();
