import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project } from '../types/project';
import { Layer } from '../types/layer';
import { CanvasObject } from '../types/canvas';

interface InfraMapDBSchema extends DBSchema {
  projects: {
    key: string;
    value: Project;
  };
  layers: {
    key: string;
    value: Layer & { projectId: string };
    indexes: { 'by-projectId': string };
  };
  objects: {
    key: string;
    value: CanvasObject & { projectId: string };
    indexes: { 'by-projectId': string };
  };
  preferences: {
    key: string;
    value: { key: string; value: any };
  };
}

const DB_NAME = 'InfraMapDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<InfraMapDBSchema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<InfraMapDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('layers')) {
          const layerStore = db.createObjectStore('layers', { keyPath: 'id' });
          layerStore.createIndex('by-projectId', 'projectId');
        }
        if (!db.objectStoreNames.contains('objects')) {
          const objectStore = db.createObjectStore('objects', { keyPath: 'id' });
          objectStore.createIndex('by-projectId', 'projectId');
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export const dbService = {
  async getAllProjects(): Promise<Project[]> {
    const db = await getDB();
    const projects = await db.getAll('projects');
    return projects.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getProject(id: string): Promise<Project | undefined> {
    const db = await getDB();
    return db.get('projects', id);
  },

  async saveProject(project: Project): Promise<void> {
    const db = await getDB();
    await db.put('projects', project);
  },

  async deleteProject(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['projects', 'layers', 'objects'], 'readwrite');

    // Delete project
    await tx.objectStore('projects').delete(id);

    // Delete associated layers
    const layerIndex = tx.objectStore('layers').index('by-projectId');
    const layerKeys = await layerIndex.getAllKeys(id);
    for (const key of layerKeys) {
      await tx.objectStore('layers').delete(key);
    }

    // Delete associated objects
    const objectIndex = tx.objectStore('objects').index('by-projectId');
    const objectKeys = await objectIndex.getAllKeys(id);
    for (const key of objectKeys) {
      await tx.objectStore('objects').delete(key);
    }

    await tx.done;
  },

  async getProjectLayers(projectId: string): Promise<Layer[]> {
    const db = await getDB();
    const items = await db.getAllFromIndex('layers', 'by-projectId', projectId);
    return items
      .map(({ projectId: _, ...layer }) => layer)
      .sort((a, b) => a.order - b.order);
  },

  async saveProjectLayers(projectId: string, layers: Layer[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('layers', 'readwrite');
    const store = tx.objectStore('layers');

    // Remove existing layers for this project
    const existingKeys = await store.index('by-projectId').getAllKeys(projectId);
    for (const key of existingKeys) {
      await store.delete(key);
    }

    // Put new layers
    for (const layer of layers) {
      await store.put({ ...layer, projectId });
    }

    await tx.done;
  },

  async getProjectObjects(projectId: string): Promise<CanvasObject[]> {
    const db = await getDB();
    const items = await db.getAllFromIndex('objects', 'by-projectId', projectId);
    return items.map(({ projectId: _, ...obj }) => obj);
  },

  async saveProjectObjects(projectId: string, objects: CanvasObject[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('objects', 'readwrite');
    const store = tx.objectStore('objects');

    // Remove existing objects for this project
    const existingKeys = await store.index('by-projectId').getAllKeys(projectId);
    for (const key of existingKeys) {
      await store.delete(key);
    }

    // Put new objects
    for (const obj of objects) {
      await store.put({ ...obj, projectId });
    }

    await tx.done;
  },

  async getPreference<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const db = await getDB();
      const res = await db.get('preferences', key);
      return res ? res.value : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async setPreference(key: string, value: any): Promise<void> {
    try {
      const db = await getDB();
      await db.put('preferences', { key, value });
    } catch {
      // ignore storage error
    }
  },
};
