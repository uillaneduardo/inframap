import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MousePointer,
  Move,
  Hand,
  Square,
  Circle as CircleIcon,
  Minus,
  Type,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Sun,
  Moon,
  Contrast,
} from 'lucide-react';
import { Tooltip } from '@inframap/ui';
import { ToolType } from '@inframap/editor-core';
import { useEditorStore } from '../../../stores/useEditorStore';
import { useThemeStore } from '../../../stores/useThemeStore';

export const EditorToolbar: React.FC = () => {
  const { t } = useTranslation();

  const {
    activeTool,
    setActiveTool,
    canUndo,
    canRedo,
    undo,
    redo,
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    showGrid,
    toggleShowGrid,
    snapToGrid,
    toggleSnapToGrid,
  } = useEditorStore();

  const { themeMode, setThemeMode } = useThemeStore();

  const toolButtons: { tool: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { tool: 'select', label: t('editor.tools.select'), icon: <MousePointer className="w-3.5 h-3.5" />, shortcut: 'V' },
    { tool: 'move', label: t('editor.tools.move'), icon: <Move className="w-3.5 h-3.5" />, shortcut: 'M' },
    { tool: 'pan', label: t('editor.tools.pan'), icon: <Hand className="w-3.5 h-3.5" />, shortcut: 'H' },
    { tool: 'rectangle', label: t('editor.tools.rectangle'), icon: <Square className="w-3.5 h-3.5" />, shortcut: 'R' },
    { tool: 'circle', label: t('editor.tools.circle'), icon: <CircleIcon className="w-3.5 h-3.5" />, shortcut: 'C' },
    { tool: 'line', label: t('editor.tools.line'), icon: <Minus className="w-3.5 h-3.5" />, shortcut: 'L' },
    {
      tool: 'dashed-line',
      label: t('editor.tools.dashedLine'),
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3">
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      ),
      shortcut: 'D',
    },
    { tool: 'text', label: t('editor.tools.text'), icon: <Type className="w-3.5 h-3.5" />, shortcut: 'T' },
  ];

  const cycleTheme = () => {
    if (themeMode === 'light') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('high-contrast');
    else setThemeMode('light');
  };

  const getThemeIcon = () => {
    if (themeMode === 'light') return <Sun className="w-3.5 h-3.5 text-amber-500" />;
    if (themeMode === 'dark') return <Moon className="w-3.5 h-3.5 text-blue-400" />;
    return <Contrast className="w-3.5 h-3.5 text-yellow-400" />;
  };

  return (
    <div className="h-9 theme-bg-toolbar border-b theme-border flex items-center justify-between px-2.5 z-30 shrink-0 select-none overflow-x-auto">
      {/* Primary Tool Buttons */}
      <div className="flex items-center gap-1">
        {toolButtons.map((tb) => {
          const isActive = activeTool === tb.tool;
          return (
            <Tooltip key={tb.tool} content={`${tb.label} (${tb.shortcut})`}>
              <button
                onClick={() => setActiveTool(tb.tool)}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'theme-text-main hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {tb.icon}
              </button>
            </Tooltip>
          );
        })}

        <div className="h-4 w-px theme-border mx-1.5" />

        {/* Undo / Redo */}
        <Tooltip content={t('editor.actions.undo')}>
          <button
            onClick={() => undo([])}
            disabled={!canUndo}
            className="w-7 h-7 flex items-center justify-center rounded-md theme-text-main hover:bg-[var(--bg-surface-hover)] disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip content={t('editor.actions.redo')}>
          <button
            onClick={() => redo([])}
            disabled={!canRedo}
            className="w-7 h-7 flex items-center justify-center rounded-md theme-text-main hover:bg-[var(--bg-surface-hover)] disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <div className="h-4 w-px theme-border mx-1.5" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip content="Diminuir zoom">
            <button
              onClick={zoomOut}
              className="w-7 h-7 flex items-center justify-center rounded-md theme-text-main hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <span className="text-[11px] font-mono font-medium theme-text-muted px-1 min-w-[38px] text-center">
            {Math.round(viewport.scale * 100)}%
          </span>

          <Tooltip content="Aumentar zoom">
            <button
              onClick={zoomIn}
              className="w-7 h-7 flex items-center justify-center rounded-md theme-text-main hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip content={t('editor.status.fitToScreen')}>
            <button
              onClick={resetZoom}
              className="w-7 h-7 flex items-center justify-center rounded-md theme-text-main hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        <div className="h-4 w-px theme-border mx-1.5" />

        {/* Grid & Snap Controls */}
        <Tooltip content={t('editor.status.showGrid')}>
          <button
            onClick={toggleShowGrid}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              showGrid
                ? 'bg-[var(--bg-surface-active)] font-bold text-blue-500'
                : 'theme-text-muted hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip content={t('editor.status.snapToGrid')}>
          <button
            onClick={toggleSnapToGrid}
            className={`px-2 h-7 flex items-center gap-1 rounded-md text-[11px] font-medium transition-colors ${
              snapToGrid
                ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30'
                : 'theme-text-muted hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <span>Snap</span>
          </button>
        </Tooltip>
      </div>

      {/* Quick Theme Toggle */}
      <Tooltip content={`Alternar tema (${themeMode})`}>
        <button
          onClick={cycleTheme}
          className="w-7 h-7 flex items-center justify-center rounded-md theme-text-main hover:bg-[var(--bg-surface-hover)] border theme-border transition-colors"
        >
          {getThemeIcon()}
        </button>
      </Tooltip>
    </div>
  );
};
