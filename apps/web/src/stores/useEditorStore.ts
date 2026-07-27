import { create } from 'zustand';
import { CanvasObject } from '@inframap/domain';
import { ToolType, Viewport } from '@inframap/editor-core';
import { HistoryStack } from '@inframap/editor-core';

interface EditorState {
  activeTool: ToolType;
  selectedIds: string[];
  activeLayerId: string | null;
  viewport: Viewport;
  showGrid: boolean;
  snapToGrid: boolean;
  history: HistoryStack<CanvasObject[]>;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setActiveTool: (tool: ToolType) => void;
  setSelectedIds: (ids: string[]) => void;
  selectObject: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  setActiveLayerId: (id: string) => void;
  setViewport: (viewport: Viewport | ((prev: Viewport) => Viewport)) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleShowGrid: () => void;
  toggleSnapToGrid: () => void;

  // History Actions
  pushHistory: (objects: CanvasObject[]) => void;
  undo: (currentObjects: CanvasObject[]) => CanvasObject[] | null;
  redo: (currentObjects: CanvasObject[]) => CanvasObject[] | null;
  resetHistory: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'select',
  selectedIds: [],
  activeLayerId: null,
  viewport: { x: 0, y: 0, scale: 1 },
  showGrid: true,
  snapToGrid: false,
  history: new HistoryStack<CanvasObject[]>(50),
  canUndo: false,
  canRedo: false,

  setActiveTool: (tool) => set({ activeTool: tool }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  selectObject: (id, multiSelect = false) => {
    const { selectedIds } = get();
    if (multiSelect) {
      if (selectedIds.includes(id)) {
        set({ selectedIds: selectedIds.filter((item) => item !== id) });
      } else {
        set({ selectedIds: [...selectedIds, id] });
      }
    } else {
      set({ selectedIds: [id] });
    }
  },

  clearSelection: () => set({ selectedIds: [] }),

  setActiveLayerId: (id) => set({ activeLayerId: id }),

  setViewport: (updater) => {
    const { viewport } = get();
    const next = typeof updater === 'function' ? updater(viewport) : updater;
    set({ viewport: next });
  },

  zoomIn: () => {
    const { viewport } = get();
    const newScale = Math.min(5, viewport.scale * 1.2);
    set({ viewport: { ...viewport, scale: newScale } });
  },

  zoomOut: () => {
    const { viewport } = get();
    const newScale = Math.max(0.1, viewport.scale / 1.2);
    set({ viewport: { ...viewport, scale: newScale } });
  },

  resetZoom: () => {
    set({ viewport: { x: 0, y: 0, scale: 1 } });
  },

  toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  pushHistory: (objects) => {
    const { history } = get();
    history.push(JSON.parse(JSON.stringify(objects)));
    set({ canUndo: history.canUndo(), canRedo: history.canRedo() });
  },

  undo: (currentObjects) => {
    const { history } = get();
    const previous = history.undo(JSON.parse(JSON.stringify(currentObjects)));
    set({ canUndo: history.canUndo(), canRedo: history.canRedo() });
    return previous;
  },

  redo: (currentObjects) => {
    const { history } = get();
    const next = history.redo(JSON.parse(JSON.stringify(currentObjects)));
    set({ canUndo: history.canUndo(), canRedo: history.canRedo() });
    return next;
  },

  resetHistory: () => {
    const { history } = get();
    history.clear();
    set({ canUndo: false, canRedo: false });
  },
}));
