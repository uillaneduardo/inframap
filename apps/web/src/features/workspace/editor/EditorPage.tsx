import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoadingState, ErrorState, Dialog, Input, Select, Button } from '@inframap/ui';
import { ProjectUnit } from '@inframap/domain';
import { CreateProjectFormSchema } from '@inframap/project-schema';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { LayersPanel } from './LayersPanel';
import { EditorMenuBar } from './EditorMenuBar';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { PanelResizer } from './PanelResizer';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';

export const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    activeProject,
    isLoading,
    errorMessage,
    loadProject,
    createProject,
    updateActiveProject,
    closeActiveProject,
  } = useProjectStore();

  const {
    setActiveTool,
    selectedIds,
    clearSelection,
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
  } = useEditorStore();

  // Panel visibility state
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  // Cursor coordinates
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // New Project Dialog State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [newProjectData, setNewProjectData] = useState({
    name: 'Novo Projeto InfraMap',
    description: 'Documentação visual de infraestrutura.',
    unit: 'm' as ProjectUnit,
    width: 20,
    height: 15,
    gridSize: 0.5,
  });
  const [newProjectErrors, setNewProjectErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
    return () => {
      closeActiveProject();
    };
  }, [projectId, loadProject, closeActiveProject]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      else if (e.key === 'm' || e.key === 'M') setActiveTool('move');
      else if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
      else if (e.key === 'r' || e.key === 'R') setActiveTool('rectangle');
      else if (e.key === 'c' || e.key === 'C') setActiveTool('circle');
      else if (e.key === 'l' || e.key === 'L') setActiveTool('line');
      else if (e.key === 'd' || e.key === 'D') setActiveTool('dashed-line');
      else if (e.key === 't' || e.key === 'T') setActiveTool('text');
      else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setShowLeftPanel((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setShowRightPanel((prev) => !prev);
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (!activeProject) return;
        pushHistory(activeProject.objects);
        updateActiveProject((doc) => ({
          ...doc,
          objects: doc.objects.filter((o) => !selectedIds.includes(o.id)),
        }));
        clearSelection();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo && activeProject) {
            const next = redo(activeProject.objects);
            if (next) updateActiveProject((doc) => ({ ...doc, objects: next }));
          }
        } else {
          if (canUndo && activeProject) {
            const prev = undo(activeProject.objects);
            if (prev) updateActiveProject((doc) => ({ ...doc, objects: prev }));
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo && activeProject) {
          const next = redo(activeProject.objects);
          if (next) updateActiveProject((doc) => ({ ...doc, objects: next }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeProject,
    selectedIds,
    canUndo,
    canRedo,
    setActiveTool,
    clearSelection,
    updateActiveProject,
    pushHistory,
    undo,
    redo,
  ]);

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewProjectErrors({});

    const result = CreateProjectFormSchema.safeParse(newProjectData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setNewProjectErrors(errors);
      return;
    }

    try {
      const newProject = await createProject(result.data);
      setIsNewProjectModalOpen(false);
      navigate(`/workspace/projects/${newProject.id}`);
    } catch {
      // Store handles error state
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center theme-bg-app">
        <LoadingState message="Carregando editor visual do InfraMap..." />
      </div>
    );
  }

  if (errorMessage || !activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center theme-bg-app p-8">
        <ErrorState
          message={errorMessage || 'Projeto não encontrado.'}
          onRetry={() => navigate('/workspace/projects')}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden theme-bg-app theme-text-main select-none">
      {/* 1. Desktop Top Menu Bar */}
      <EditorMenuBar
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
      />

      {/* 2. Fixed Horizontal Toolbar */}
      <EditorToolbar />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Layers Panel */}
        <PanelResizer
          side="left"
          defaultWidth={240}
          minWidth={180}
          maxWidth={360}
          isVisible={showLeftPanel}
          onToggleVisible={() => setShowLeftPanel((prev) => !prev)}
        >
          <LayersPanel />
        </PanelResizer>

        {/* Center Canvas Area - Maximized */}
        <div className="flex-1 flex flex-col relative overflow-hidden theme-bg-canvas">
          <Canvas onCursorMove={(x, y) => setCursorCoords({ x, y })} />
        </div>

        {/* Right Sidebar: Properties Panel */}
        <PanelResizer
          side="right"
          defaultWidth={260}
          minWidth={200}
          maxWidth={380}
          isVisible={showRightPanel}
          onToggleVisible={() => setShowRightPanel((prev) => !prev)}
        >
          <PropertiesPanel />
        </PanelResizer>
      </div>

      {/* 4. Desktop Bottom Status Bar */}
      <EditorStatusBar cursorCoords={cursorCoords} />

      {/* New Project Modal */}
      <Dialog
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title={t('projects.create.title')}
        description={t('projects.create.description')}
      >
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs">
          <Input
            label={t('projects.create.name')}
            value={newProjectData.name}
            onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
            error={newProjectErrors.name}
            required
          />

          <Input
            label={t('projects.create.projectDescription')}
            value={newProjectData.description}
            onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
            error={newProjectErrors.description}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('projects.create.unit')}
              value={newProjectData.unit}
              onChange={(e) => setNewProjectData({ ...newProjectData, unit: e.target.value as ProjectUnit })}
              options={[
                { value: 'mm', label: t('projects.units.mm') },
                { value: 'cm', label: t('projects.units.cm') },
                { value: 'm', label: t('projects.units.m') },
              ]}
            />

            <Input
              label={t('projects.create.gridSize')}
              type="number"
              step="any"
              min="0.1"
              value={newProjectData.gridSize}
              onChange={(e) => setNewProjectData({ ...newProjectData, gridSize: parseFloat(e.target.value) || 0.1 })}
              error={newProjectErrors.gridSize}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('projects.create.width')}
              type="number"
              step="any"
              min="1"
              value={newProjectData.width}
              onChange={(e) => setNewProjectData({ ...newProjectData, width: parseFloat(e.target.value) || 1 })}
              error={newProjectErrors.width}
              required
            />

            <Input
              label={t('projects.create.height')}
              type="number"
              step="any"
              min="1"
              value={newProjectData.height}
              onChange={(e) => setNewProjectData({ ...newProjectData, height: parseFloat(e.target.value) || 1 })}
              error={newProjectErrors.height}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t theme-border">
            <Button variant="outline" type="button" onClick={() => setIsNewProjectModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('projects.create.submit')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
