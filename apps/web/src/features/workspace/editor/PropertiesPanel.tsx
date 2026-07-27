import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Unlock, Eye, EyeOff, Trash2, Copy, SlidersHorizontal } from 'lucide-react';
import { Input, Button } from '@inframap/ui';
import {
  CanvasObject,
  RectangleObject,
  CircleObject,
  TextObject,
} from '@inframap/domain';
import {
  millimetersToDisplayUnit,
  displayUnitToMillimeters,
  duplicateCanvasObject,
} from '@inframap/editor-core';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';

export const PropertiesPanel: React.FC = () => {
  const { t } = useTranslation();
  const { activeProject, updateActiveProject } = useProjectStore();
  const { selectedIds, clearSelection, pushHistory } = useEditorStore();

  if (!activeProject || selectedIds.length === 0) {
    return (
      <div className="w-64 bg-slate-900 border-l border-slate-800 p-4 flex flex-col items-center justify-center text-center text-slate-500 select-none">
        <SlidersHorizontal className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <p className="text-xs font-semibold text-slate-300">{t('editor.properties.noSelection')}</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[180px]">
          {t('editor.properties.noSelectionDesc')}
        </p>
      </div>
    );
  }

  const selectedObject = activeProject.objects.find((o) => o.id === selectedIds[0]);

  if (!selectedObject) {
    return null;
  }

  const unit = activeProject.unit;

  const handleUpdate = (updater: (obj: CanvasObject) => CanvasObject) => {
    pushHistory(activeProject.objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) => (o.id === selectedObject.id ? updater(o) : o)),
    }));
  };

  const handleDelete = () => {
    pushHistory(activeProject.objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.filter((o) => o.id !== selectedObject.id),
    }));
    clearSelection();
  };

  const handleDuplicate = () => {
    pushHistory(activeProject.objects);
    const newObj = duplicateCanvasObject(selectedObject, 20);
    updateActiveProject((doc) => ({
      ...doc,
      objects: [...doc.objects, newObj],
    }));
  };

  return (
    <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none overflow-y-auto">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          {t('editor.properties.title')}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleUpdate((o) => ({ ...o, locked: !o.locked }))}
            className={`p-1.5 rounded transition-colors ${
              selectedObject.locked
                ? 'text-amber-400 bg-amber-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={selectedObject.locked ? 'Desbloquear' : 'Bloquear'}
          >
            {selectedObject.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleUpdate((o) => ({ ...o, visible: !o.visible }))}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title={selectedObject.visible ? 'Ocultar' : 'Exibir'}
          >
            {selectedObject.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 text-xs">
        {/* General Fields */}
        <Input
          label={t('editor.properties.objectName')}
          value={selectedObject.name}
          onChange={(e) => handleUpdate((o) => ({ ...o, name: e.target.value }))}
        />

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            label={`${t('editor.properties.positionX')} (${unit})`}
            type="number"
            step="any"
            value={millimetersToDisplayUnit(selectedObject.x, unit)}
            onChange={(e) =>
              handleUpdate((o) => ({
                ...o,
                x: displayUnitToMillimeters(parseFloat(e.target.value) || 0, unit),
              }))
            }
          />
          <Input
            label={`${t('editor.properties.positionY')} (${unit})`}
            type="number"
            step="any"
            value={millimetersToDisplayUnit(selectedObject.y, unit)}
            onChange={(e) =>
              handleUpdate((o) => ({
                ...o,
                y: displayUnitToMillimeters(parseFloat(e.target.value) || 0, unit),
              }))
            }
          />
        </div>

        {/* Dimension specific */}
        {selectedObject.type === 'rectangle' && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              label={`${t('editor.properties.width')} (${unit})`}
              type="number"
              step="any"
              value={millimetersToDisplayUnit((selectedObject as RectangleObject).width, unit)}
              onChange={(e) =>
                handleUpdate((o) => ({
                  ...o,
                  width: Math.max(1, displayUnitToMillimeters(parseFloat(e.target.value) || 1, unit)),
                }))
              }
            />
            <Input
              label={`${t('editor.properties.height')} (${unit})`}
              type="number"
              step="any"
              value={millimetersToDisplayUnit((selectedObject as RectangleObject).height, unit)}
              onChange={(e) =>
                handleUpdate((o) => ({
                  ...o,
                  height: Math.max(1, displayUnitToMillimeters(parseFloat(e.target.value) || 1, unit)),
                }))
              }
            />
          </div>
        )}

        {selectedObject.type === 'circle' && (
          <Input
            label={`${t('editor.properties.radius')} (${unit})`}
            type="number"
            step="any"
            value={millimetersToDisplayUnit((selectedObject as CircleObject).radius, unit)}
            onChange={(e) =>
              handleUpdate((o) => ({
                ...o,
                radius: Math.max(1, displayUnitToMillimeters(parseFloat(e.target.value) || 1, unit)),
              }))
            }
          />
        )}

        {selectedObject.type === 'text' && (
          <>
            <Input
              label={t('editor.properties.text')}
              value={(selectedObject as TextObject).text}
              onChange={(e) => handleUpdate((o) => ({ ...o, text: e.target.value }))}
            />
            <Input
              label={`${t('editor.properties.fontSize')} (${unit})`}
              type="number"
              step="any"
              value={millimetersToDisplayUnit((selectedObject as TextObject).fontSize, unit)}
              onChange={(e) =>
                handleUpdate((o) => ({
                  ...o,
                  fontSize: Math.max(1, displayUnitToMillimeters(parseFloat(e.target.value) || 1, unit)),
                }))
              }
            />
          </>
        )}

        {/* Rotation */}
        <Input
          label={t('editor.properties.rotation')}
          type="number"
          min="0"
          max="360"
          value={selectedObject.rotation}
          onChange={(e) =>
            handleUpdate((o) => ({ ...o, rotation: parseFloat(e.target.value) || 0 }))
          }
        />

        {/* Colors */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-300">{t('editor.properties.fill')}</label>
            <div className="flex items-center gap-2 border border-slate-700 bg-slate-950 rounded p-1">
              <input
                type="color"
                value={selectedObject.fill === 'transparent' ? '#ffffff' : selectedObject.fill}
                onChange={(e) => handleUpdate((o) => ({ ...o, fill: e.target.value }))}
                className="w-6 h-6 border-0 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-[10px] text-slate-300 uppercase">{selectedObject.fill}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-300">{t('editor.properties.stroke')}</label>
            <div className="flex items-center gap-2 border border-slate-700 bg-slate-950 rounded p-1">
              <input
                type="color"
                value={selectedObject.stroke === 'transparent' ? '#000000' : selectedObject.stroke}
                onChange={(e) => handleUpdate((o) => ({ ...o, stroke: e.target.value }))}
                className="w-6 h-6 border-0 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-[10px] text-slate-300 uppercase">{selectedObject.stroke}</span>
            </div>
          </div>
        </div>

        {/* Stroke Width & Opacity */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            label={t('editor.properties.strokeWidth')}
            type="number"
            min="0"
            value={selectedObject.strokeWidth}
            onChange={(e) =>
              handleUpdate((o) => ({ ...o, strokeWidth: parseFloat(e.target.value) || 0 }))
            }
          />
          <Input
            label={t('editor.properties.opacity')}
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={selectedObject.opacity}
            onChange={(e) =>
              handleUpdate((o) => ({
                ...o,
                opacity: Math.max(0, Math.min(1, parseFloat(e.target.value) || 1)),
              }))
            }
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="w-3.5 h-3.5" />
            <span>{t('editor.properties.actions.duplicate')}</span>
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('editor.properties.actions.delete')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
