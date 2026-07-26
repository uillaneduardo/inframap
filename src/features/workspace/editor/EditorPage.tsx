import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  FileDown,
  FileUp,
  Image,
  MousePointer,
  Hand,
  Square,
  Circle as CircleIcon,
  Minus,
  Type,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { Tooltip, LoadingState, ErrorState } from '@inframap/ui';
import { ToolType, formatUnitValue, exportStageToPng } from '@inframap/editor-core';
import { validateAndParseProjectJson, serializeProjectDocument } from '@inframap/project-schema';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { LayersPanel } from './LayersPanel';
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
    saveStatus,
    loadProject,
    importProject,
    updateActiveProject,
    closeActiveProject,
  } = useProjectStore();

  const {
    activeTool,
    setActiveTool,
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    snapToGrid,
    toggleSnapToGrid,
    selectedIds,
    clearSelection,
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
  } = useEditorStore();

  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
      else if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
      else if (e.key === 'r' || e.key === 'R') setActiveTool('rectangle');
      else if (e.key === 'c' || e.key === 'C') setActiveTool('circle');
      else if (e.key === 'l' || e.key === 'L') setActiveTool('line');
      else if (e.key === 't' || e.key === 'T') setActiveTool('text');
      else if (e.key === 'Escape') clearSelection();
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <LoadingState message="Carregando editor visual do InfraMap..." />
      </div>
    );
  }

  if (errorMessage || !activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 p-8">
        <ErrorState
          message={errorMessage || 'Projeto não encontrado.'}
          onRetry={() => navigate('/workspace/projects')}
        />
      </div>
    );
  }

  const handleExportJson = () => {
    const jsonStr = serializeProjectDocument(activeProject);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject.name.replace(/\s+/g, '_').toLowerCase()}_inframap.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    const stageContainer = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
    if (stageContainer) {
      const dataUrl = stageContainer.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${activeProject.name.replace(/\s+/g, '_').toLowerCase()}_inframap.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseProjectJson(content, false);
      if (res.success) {
        await importProject(res.document);
      } else {
        alert(res.error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUndoAction = () => {
    if (canUndo && activeProject) {
      const prev = undo(activeProject.objects);
      if (prev) updateActiveProject((doc) => ({ ...doc, objects: prev }));
    }
  };

  const handleRedoAction = () => {
    if (canRedo && activeProject) {
      const next = redo(activeProject.objects);
      if (next) updateActiveProject((doc) => ({ ...doc, objects: next }));
    }
  };

  const toolButtons: { tool: ToolType; label: string; icon: React.ReactNode }[] = [
    { tool: 'select', label: t('editor.tools.select'), icon: <MousePointer className="w-4 h-4" /> },
    { tool: 'pan', label: t('editor.tools.pan'), icon: <Hand className="w-4 h-4" /> },
    { tool: 'rectangle', label: t('editor.tools.rectangle'), icon: <Square className="w-4 h-4" /> },
    { tool: 'circle', label: t('editor.tools.circle'), icon: <CircleIcon className="w-4 h-4" /> },
    { tool: 'line', label: t('editor.tools.line'), icon: <Minus className="w-4 h-4" /> },
    { tool: 'text', label: t('editor.tools.text'), icon: <Type className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3rem)] overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Header Controls */}
      <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workspace/projects')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('editor.actions.backToProjects')}</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <h2 className="text-xs font-bold text-slate-100 truncate max-w-[200px]">
            {activeProject.name}
          </h2>

          {/* Save status badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border">
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 border-emerald-900/60 bg-emerald-950/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {t('editor.status.saved')}
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-blue-400 border-blue-900/60 bg-blue-950/40 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                {t('editor.status.saving')}
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-amber-400 border-amber-900/60 bg-amber-950/40 flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-amber-400" />
                {t('editor.status.unsaved')}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 border-red-900/60 bg-red-950/40 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                {t('editor.status.error')}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Tooltip content={t('editor.actions.undo')}>
            <button
              onClick={handleUndoAction}
              disabled={!canUndo}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content={t('editor.actions.redo')}>
            <button
              onClick={handleRedoAction}
              disabled={!canRedo}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </Tooltip>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <label className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer">
            <Tooltip content="Importar JSON">
              <FileUp className="w-4 h-4" />
            </Tooltip>
            <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
          </label>

          <Tooltip content={t('editor.actions.exportJson')}>
            <button
              onClick={handleExportJson}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content={t('editor.actions.exportPng')}>
            <button
              onClick={handleExportPng}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Image className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Tools & Layers */}
        <div className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shrink-0">
          <div className="p-3 border-b border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Ferramentas
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {toolButtons.map((tb) => (
                <button
                  key={tb.tool}
                  onClick={() => setActiveTool(tb.tool)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTool === tb.tool
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {tb.icon}
                  <span className="truncate">{tb.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <LayersPanel />
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
          <Canvas onCursorMove={(x, y) => setCursorCoords({ x, y })} />
        </div>

        {/* Right Properties Panel */}
        <PropertiesPanel />
      </div>

      {/* Footer Status Bar */}
      <div className="h-7 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-3 text-[11px] font-mono text-slate-400 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <span>
            X: {formatUnitValue(cursorCoords.x, activeProject.unit)}
          </span>
          <span>
            Y: {formatUnitValue(cursorCoords.y, activeProject.unit)}
          </span>
          <span className="text-slate-500">
            Dimensão: {formatUnitValue(activeProject.canonicalWidth, activeProject.unit)} × {formatUnitValue(activeProject.canonicalHeight, activeProject.unit)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSnapToGrid}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
              snapToGrid ? 'bg-blue-950 text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>{t('editor.status.snapToGrid')}</span>
          </button>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              className="p-1 hover:text-white rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="min-w-[40px] text-center font-bold text-slate-200">
              {Math.round(viewport.scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1 hover:text-white rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 hover:text-white rounded transition-colors"
              title={t('editor.status.fitToScreen')}
            >
              <Maximize className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
