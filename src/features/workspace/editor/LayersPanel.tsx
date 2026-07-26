import React, { useState } from 'react';
import { Layers as LayersIcon, Plus, Eye, EyeOff, Lock, Unlock, Trash2, Edit2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layer } from '@inframap/domain';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';

export const LayersPanel: React.FC = () => {
  const { t } = useTranslation();
  const { activeProject, updateActiveProject } = useProjectStore();
  const { activeLayerId, setActiveLayerId } = useEditorStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!activeProject) return null;

  const layers = activeProject.layers;
  const currentActiveLayerId = activeLayerId || layers[0]?.id || '';

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `Camada ${layers.length + 1}`,
      visible: true,
      locked: false,
      order: layers.length,
    };

    updateActiveProject((doc) => ({
      ...doc,
      layers: [...doc.layers, newLayer],
    }));

    setActiveLayerId(newLayer.id);
  };

  const handleToggleVisible = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateActiveProject((doc) => ({
      ...doc,
      layers: doc.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    }));
  };

  const handleToggleLocked = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateActiveProject((doc) => ({
      ...doc,
      layers: doc.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    }));
  };

  const handleDeleteLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (layers.length <= 1) return;

    updateActiveProject((doc) => ({
      ...doc,
      layers: doc.layers.filter((l) => l.id !== id),
      // Move objects from deleted layer to first remaining layer
      objects: doc.objects.map((o) =>
        o.layerId === id ? { ...o, layerId: doc.layers.find((l) => l.id !== id)!.id } : o
      ),
    }));

    if (currentActiveLayerId === id) {
      const remaining = layers.find((l) => l.id !== id);
      if (remaining) setActiveLayerId(remaining.id);
    }
  };

  const handleStartRename = (layer: Layer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditingName(layer.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      updateActiveProject((doc) => ({
        ...doc,
        layers: doc.layers.map((l) => (l.id === id ? { ...l, name: editingName.trim() } : l)),
      }));
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col border-t border-slate-800 bg-slate-900 text-slate-200">
      <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <LayersIcon className="w-3.5 h-3.5 text-blue-400" />
          {t('editor.layers.title')}
        </span>
        <button
          onClick={handleAddLayer}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title={t('editor.layers.add')}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto flex flex-col p-1 gap-1 text-xs">
        {layers.map((layer) => {
          const isActive = layer.id === currentActiveLayerId;
          const isEditing = layer.id === editingId;

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400' : 'bg-slate-600'}`} />
                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(layer.id)}
                      className="w-full bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(layer.id)}
                      className="p-1 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="truncate font-medium text-xs">{layer.name}</span>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleToggleVisible(layer.id, e)}
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                  </button>
                  <button
                    onClick={(e) => handleToggleLocked(layer.id, e)}
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={(e) => handleStartRename(layer, e)}
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteLayer(layer.id, e)}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
