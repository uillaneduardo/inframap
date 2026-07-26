import { create } from 'zustand';
import { ProjectDocument, ProjectSummary, ProjectUnit } from '@inframap/domain';
import { displayUnitToMillimeters } from '@inframap/editor-core';
import { ProjectRepository } from '../infrastructure/repositories/ProjectRepository';
import { defaultProjectRepository } from '../infrastructure/repositories/IndexedDbProjectRepository';

export type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

export interface CreateProjectParams {
  name: string;
  description?: string;
  unit: ProjectUnit;
  width: number;
  height: number;
  gridSize: number;
}

interface ProjectState {
  projects: ProjectSummary[];
  activeProject: ProjectDocument | null;
  saveStatus: SaveStatus;
  isLoading: boolean;
  errorMessage: string | null;

  // Actions
  fetchProjects: (repository?: ProjectRepository) => Promise<void>;
  loadProject: (id: string, repository?: ProjectRepository) => Promise<ProjectDocument | null>;
  createProject: (params: CreateProjectParams, repository?: ProjectRepository) => Promise<ProjectDocument>;
  saveProject: (repository?: ProjectRepository) => Promise<void>;
  updateActiveProject: (updater: (doc: ProjectDocument) => ProjectDocument) => void;
  deleteProject: (id: string, repository?: ProjectRepository) => Promise<void>;
  duplicateProject: (id: string, repository?: ProjectRepository) => Promise<ProjectDocument>;
  importProject: (doc: ProjectDocument, repository?: ProjectRepository) => Promise<ProjectDocument>;
  closeActiveProject: () => void;
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  saveStatus: 'saved',
  isLoading: false,
  errorMessage: null,

  fetchProjects: async (repository = defaultProjectRepository) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const projects = await repository.list();
      set({ projects, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        errorMessage: `Erro ao carregar lista de projetos: ${err?.message || 'Erro desconhecido'}`,
      });
    }
  },

  loadProject: async (id: string, repository = defaultProjectRepository) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const doc = await repository.findById(id);
      if (doc) {
        set({ activeProject: doc, saveStatus: 'saved', isLoading: false });
        return doc;
      } else {
        set({
          isLoading: false,
          errorMessage: `Projeto ID "${id}" não encontrado.`,
        });
        return null;
      }
    } catch (err: any) {
      set({
        isLoading: false,
        errorMessage: `Erro ao abrir projeto: ${err?.message || 'Erro desconhecido'}`,
      });
      return null;
    }
  },

  createProject: async (params: CreateProjectParams, repository = defaultProjectRepository) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const defaultLayerId = crypto.randomUUID();

    const canonicalWidth = displayUnitToMillimeters(params.width, params.unit);
    const canonicalHeight = displayUnitToMillimeters(params.height, params.unit);
    const canonicalGridSize = displayUnitToMillimeters(params.gridSize, params.unit);

    const doc: ProjectDocument = {
      schemaVersion: 1,
      id,
      organizationId: null,
      ownerId: null,
      name: params.name,
      description: params.description || '',
      unit: params.unit,
      canonicalWidth,
      canonicalHeight,
      createdAt: now,
      updatedAt: now,
      version: 1,
      settings: {
        unit: params.unit,
        width: params.width,
        height: params.height,
        gridSize: params.gridSize,
        canonicalWidth,
        canonicalHeight,
        canonicalGridSize,
        snapToGrid: true,
        backgroundColor: '#ffffff',
      },
      layers: [
        {
          id: defaultLayerId,
          name: 'Camada Padrão',
          visible: true,
          locked: false,
          order: 0,
        },
      ],
      objects: [],
      viewport: { x: 0, y: 0, scale: 1 },
    };

    set({ isLoading: true });
    try {
      await repository.save(doc);
      set({ activeProject: doc, saveStatus: 'saved', isLoading: false });
      await get().fetchProjects(repository);
      return doc;
    } catch (err: any) {
      set({
        isLoading: false,
        errorMessage: `Erro ao criar projeto: ${err?.message || 'Erro desconhecido'}`,
      });
      throw err;
    }
  },

  saveProject: async (repository = defaultProjectRepository) => {
    const { activeProject } = get();
    if (!activeProject) return;

    set({ saveStatus: 'saving' });
    try {
      await repository.save(activeProject);
      set({ saveStatus: 'saved' });
      await get().fetchProjects(repository);
    } catch (err: any) {
      set({
        saveStatus: 'error',
        errorMessage: `Erro ao salvar localmente: ${err?.message || 'Erro desconhecido'}`,
      });
    }
  },

  updateActiveProject: (updater: (doc: ProjectDocument) => ProjectDocument) => {
    const { activeProject } = get();
    if (!activeProject) return;

    const updated = updater(activeProject);
    set({ activeProject: updated, saveStatus: 'unsaved' });

    // Debounced auto-save
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      get().saveProject();
    }, 1200);
  },

  deleteProject: async (id: string, repository = defaultProjectRepository) => {
    set({ isLoading: true });
    try {
      await repository.delete(id);
      const { activeProject } = get();
      if (activeProject?.id === id) {
        set({ activeProject: null });
      }
      set({ isLoading: false });
      await get().fetchProjects(repository);
    } catch (err: any) {
      set({
        isLoading: false,
        errorMessage: `Erro ao excluir projeto: ${err?.message || 'Erro desconhecido'}`,
      });
    }
  },

  duplicateProject: async (id: string, repository = defaultProjectRepository) => {
    set({ isLoading: true });
    try {
      const duplicated = await repository.duplicate(id);
      set({ isLoading: false });
      await get().fetchProjects(repository);
      return duplicated;
    } catch (err: any) {
      set({
        isLoading: false,
        errorMessage: `Erro ao duplicar projeto: ${err?.message || 'Erro desconhecido'}`,
      });
      throw err;
    }
  },

  importProject: async (doc: ProjectDocument, repository = defaultProjectRepository) => {
    set({ isLoading: true });
    try {
      const imported = await repository.import(doc);
      set({ activeProject: imported, saveStatus: 'saved', isLoading: false });
      await get().fetchProjects(repository);
      return imported;
    } catch (err: any) {
      set({
        isLoading: false,
        errorMessage: `Erro ao importar projeto: ${err?.message || 'Erro desconhecido'}`,
      });
      throw err;
    }
  },

  closeActiveProject: () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    set({ activeProject: null, saveStatus: 'saved' });
  },
}));
