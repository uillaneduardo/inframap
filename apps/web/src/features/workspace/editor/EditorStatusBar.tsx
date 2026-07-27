import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, RefreshCw, FileCheck, AlertTriangle } from 'lucide-react';
import { formatUnitValue } from '@inframap/editor-core';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';

interface EditorStatusBarProps {
  cursorCoords: { x: number; y: number };
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({ cursorCoords }) => {
  const { t } = useTranslation();
  const { activeProject, saveStatus } = useProjectStore();
  const { selectedIds, viewport } = useEditorStore();

  if (!activeProject) return null;

  return (
    <div className="h-6 theme-bg-status border-t theme-border flex items-center justify-between px-3 text-[10px] font-mono theme-text-muted z-30 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <span>
          X: <strong className="theme-text-main">{formatUnitValue(cursorCoords.x, activeProject.unit)}</strong>
        </span>
        <span>
          Y: <strong className="theme-text-main">{formatUnitValue(cursorCoords.y, activeProject.unit)}</strong>
        </span>
        <span className="hidden sm:inline">
          Dimensão: {formatUnitValue(activeProject.canonicalWidth, activeProject.unit)} × {formatUnitValue(activeProject.canonicalHeight, activeProject.unit)}
        </span>
        <span className="hidden md:inline">
          Unidade: <strong className="uppercase theme-text-main">{activeProject.unit}</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {selectedIds.length > 0 && (
          <span className="text-blue-500 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
            {selectedIds.length} {selectedIds.length === 1 ? 'objeto selecionado' : 'objetos selecionados'}
          </span>
        )}

        <span>Zoom: {Math.round(viewport.scale * 100)}%</span>

        <div className="h-3 w-px theme-border" />

        {/* Save Status */}
        <div className="flex items-center gap-1 font-sans">
          {saveStatus === 'saved' && (
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {t('editor.status.saved')}
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-blue-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              {t('editor.status.saving')}
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-amber-500 flex items-center gap-1">
              <FileCheck className="w-3 h-3 text-amber-500" />
              {t('editor.status.unsaved')}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              {t('editor.status.error')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
