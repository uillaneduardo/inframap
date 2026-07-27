import React, { useState, useRef, useEffect } from 'react';
import {
  Layers as LayersIcon,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Square,
  Circle as CircleIcon,
  Minus,
  Type,
  MoreVertical,
  Check,
  Copy,
  CornerDownRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layer, CanvasObject } from '@inframap/domain';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';

interface LayerDeleteModalState {
  layerId: string;
  layerName: string;
  objectCount: number;
}

export const LayersPanel: React.FC = () => {
  const { t } = useTranslation();
  const { activeProject, updateActiveProject } = useProjectStore();
  const {
    activeLayerId,
    setActiveLayerId,
    selectedIds,
    setSelectedIds,
    selectObject,
    pushHistory,
  } = useEditorStore();

  // Expanded layers state
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});

  // Inline editing state (for layer name or object title)
  const [editingType, setEditingType] = useState<'layer' | 'object' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetType: 'layer' | 'object';
    targetId: string;
  } | null>(null);

  // Layer Delete Modal State
  const [deleteModal, setDeleteModal] = useState<LayerDeleteModalState | null>(null);

  // Drag State for Drop Zone Feedback
  const [dragOverTarget, setDragOverTarget] = useState<{
    id: string;
    type: 'layer' | 'object';
    position?: 'before' | 'after' | 'inside';
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  if (!activeProject) return null;

  const layers = activeProject.layers;
  const objects = activeProject.objects;
  const currentActiveLayerId = activeLayerId || layers[0]?.id || '';

  // Auto expand layer containing selected object and scroll into view
  useEffect(() => {
    if (selectedIds.length > 0) {
      const selectedObj = objects.find((o) => selectedIds.includes(o.id));
      if (selectedObj) {
        setExpandedLayers((prev) => ({ ...prev, [selectedObj.layerId]: true }));
      }
    }
  }, [selectedIds, objects]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const toggleLayerExpanded = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedLayers((prev) => ({
      ...prev,
      [layerId]: prev[layerId] === undefined ? true : !prev[layerId],
    }));
  };

  const handleAddLayer = () => {
    pushHistory(objects);
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
    setExpandedLayers((prev) => ({ ...prev, [newLayer.id]: true }));
  };

  const handleToggleLayerVisible = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pushHistory(objects);
    updateActiveProject((doc) => ({
      ...doc,
      layers: doc.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    }));
  };

  const handleToggleLayerLocked = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pushHistory(objects);
    updateActiveProject((doc) => ({
      ...doc,
      layers: doc.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    }));
  };

  const handleToggleObjectVisible = (objId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pushHistory(objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) => (o.id === objId ? { ...o, visible: !o.visible } : o)),
    }));
  };

  const handleToggleObjectLocked = (objId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pushHistory(objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) => (o.id === objId ? { ...o, locked: !o.locked } : o)),
    }));
  };

  const handleDeleteLayerRequest = (layer: Layer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (layers.length <= 1) return;

    const layerObjs = objects.filter((o) => o.layerId === layer.id);
    if (layerObjs.length > 0) {
      setDeleteModal({
        layerId: layer.id,
        layerName: layer.name,
        objectCount: layerObjs.length,
      });
    } else {
      executeDeleteLayer(layer.id, 'move');
    }
  };

  const executeDeleteLayer = (layerId: string, action: 'move' | 'delete') => {
    pushHistory(objects);
    const targetLayer = layers.find((l) => l.id !== layerId)!;

    updateActiveProject((doc) => {
      const nextLayers = doc.layers.filter((l) => l.id !== layerId);
      let nextObjects = doc.objects;

      if (action === 'move') {
        nextObjects = doc.objects.map((o) => (o.layerId === layerId ? { ...o, layerId: targetLayer.id } : o));
      } else {
        nextObjects = doc.objects.filter((o) => o.layerId !== layerId);
      }

      return {
        ...doc,
        layers: nextLayers,
        objects: nextObjects,
      };
    });

    if (currentActiveLayerId === layerId) {
      setActiveLayerId(targetLayer.id);
    }
    setDeleteModal(null);
  };

  const getObjectDisplayName = (obj: CanvasObject): string => {
    if (obj.title && obj.title.trim()) return obj.title;
    if (obj.name && obj.name.trim()) return obj.name;
    const typeNames: Record<string, string> = {
      rectangle: 'Retângulo',
      circle: 'Círculo',
      line: obj.lineStyle === 'dashed' ? 'Linha pontilhada' : 'Linha',
      text: 'Texto',
    };
    return `${typeNames[obj.type] || obj.type} ${obj.id.substring(0, 4).toUpperCase()}`;
  };

  const getObjectIcon = (obj: CanvasObject) => {
    if (obj.type === 'rectangle') return <Square className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    if (obj.type === 'circle') return <CircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    if (obj.type === 'line') {
      if (obj.lineStyle === 'dashed') {
        return (
          <svg className="w-3.5 h-3.5 text-purple-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3">
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        );
      }
      return <Minus className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    }
    return <Type className="w-3.5 h-3.5 text-pink-500 shrink-0" />;
  };

  // Inline renaming
  const handleStartRenameLayer = (layer: Layer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingType('layer');
    setEditingId(layer.id);
    setEditingText(layer.name);
  };

  const handleStartRenameObject = (obj: CanvasObject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingType('object');
    setEditingId(obj.id);
    setEditingText(obj.title || obj.name);
  };

  const handleSaveRename = () => {
    if (!editingId || !editingText.trim()) {
      setEditingId(null);
      return;
    }

    pushHistory(objects);
    if (editingType === 'layer') {
      updateActiveProject((doc) => ({
        ...doc,
        layers: doc.layers.map((l) => (l.id === editingId ? { ...l, name: editingText.trim() } : l)),
      }));
    } else {
      updateActiveProject((doc) => ({
        ...doc,
        objects: doc.objects.map((o) => (o.id === editingId ? { ...o, title: editingText.trim() } : o)),
      }));
    }
    setEditingId(null);
  };

  // Context Menu Trigger
  const handleContextMenu = (e: React.MouseEvent, type: 'layer' | 'object', id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: type,
      targetId: id,
    });
  };

  // Drag and Drop Event Handlers
  const handleDragStartObject = (e: React.DragEvent, obj: CanvasObject, sourceLayerId: string) => {
    const moveIds = selectedIds.includes(obj.id) ? selectedIds : [obj.id];
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'object', objectIds: moveIds, sourceLayerId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartLayer = (e: React.DragEvent, layer: Layer) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'layer', layerId: layer.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverLayer = (e: React.DragEvent, layer: Layer) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ id: layer.id, type: 'layer', position: 'inside' });
  };

  const handleDragOverObject = (e: React.DragEvent, obj: CanvasObject) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ id: obj.id, type: 'object', position: 'before' });
  };

  const handleDropOnLayer = (e: React.DragEvent, targetLayer: Layer) => {
    e.preventDefault();
    setDragOverTarget(null);

    const dataRaw = e.dataTransfer.getData('application/json');
    if (!dataRaw) return;

    try {
      const data = JSON.parse(dataRaw);
      pushHistory(objects);

      if (data.type === 'object') {
        const objectIds: string[] = data.objectIds || [];
        // Move objects to targetLayer
        updateActiveProject((doc) => ({
          ...doc,
          objects: doc.objects.map((o) =>
            objectIds.includes(o.id) && !o.locked ? { ...o, layerId: targetLayer.id } : o
          ),
        }));
      } else if (data.type === 'layer') {
        const sourceLayerId: string = data.layerId;
        if (sourceLayerId === targetLayer.id) return;
        // Reorder layers
        updateActiveProject((doc) => {
          const reordered = [...doc.layers];
          const sourceIdx = reordered.findIndex((l) => l.id === sourceLayerId);
          const targetIdx = reordered.findIndex((l) => l.id === targetLayer.id);
          if (sourceIdx !== -1 && targetIdx !== -1) {
            const [removed] = reordered.splice(sourceIdx, 1);
            reordered.splice(targetIdx, 0, removed);
          }
          return { ...doc, layers: reordered };
        });
      }
    } catch {
      // Ignore invalid drag data
    }
  };

  const handleDropOnObject = (e: React.DragEvent, targetObj: CanvasObject) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const dataRaw = e.dataTransfer.getData('application/json');
    if (!dataRaw) return;

    try {
      const data = JSON.parse(dataRaw);
      if (data.type === 'object') {
        const objectIds: string[] = data.objectIds || [];
        pushHistory(objects);

        updateActiveProject((doc) => {
          // Move to target object's layer and reorder index
          const nextObjects = [...doc.objects];
          const movedObjs = nextObjects.filter((o) => objectIds.includes(o.id) && !o.locked);
          const remainingObjs = nextObjects.filter((o) => !objectIds.includes(o.id));

          const targetIdx = remainingObjs.findIndex((o) => o.id === targetObj.id);
          const updatedMoved = movedObjs.map((o) => ({ ...o, layerId: targetObj.layerId }));

          if (targetIdx !== -1) {
            remainingObjs.splice(targetIdx, 0, ...updatedMoved);
          } else {
            remainingObjs.push(...updatedMoved);
          }

          return { ...doc, objects: remainingObjs };
        });
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full theme-bg-surface theme-text-main text-xs select-none">
      {/* Header */}
      <div className="px-3 py-2 border-b theme-border flex items-center justify-between shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider theme-text-muted flex items-center gap-1.5">
          <LayersIcon className="w-3.5 h-3.5 text-blue-500" />
          {t('editor.layers.title')}
        </span>
        <button
          onClick={handleAddLayer}
          className="p-1 theme-text-muted hover:theme-text-main hover:bg-[var(--bg-surface-hover)] rounded transition-colors"
          title={t('editor.layers.add')}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Tree */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {layers.map((layer) => {
          const isLayerActive = layer.id === currentActiveLayerId;
          const isExpanded = expandedLayers[layer.id] ?? true;
          const layerObjects = objects.filter((o) => o.layerId === layer.id);
          const isEditingLayer = editingType === 'layer' && editingId === layer.id;
          const isDragTarget = dragOverTarget?.id === layer.id && dragOverTarget?.type === 'layer';

          return (
            <div
              key={layer.id}
              className={`rounded-md transition-all border ${
                isDragTarget
                  ? 'border-blue-500 bg-blue-500/10'
                  : isLayerActive
                  ? 'border-blue-500/40 bg-[var(--bg-surface-hover)]'
                  : 'border-transparent hover:bg-[var(--bg-surface-hover)]'
              }`}
              draggable
              onDragStart={(e) => handleDragStartLayer(e, layer)}
              onDragOver={(e) => handleDragOverLayer(e, layer)}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={(e) => handleDropOnLayer(e, layer)}
              onContextMenu={(e) => handleContextMenu(e, 'layer', layer.id)}
            >
              {/* Layer Header Row */}
              <div
                onClick={() => setActiveLayerId(layer.id)}
                className="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded"
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                  <button
                    onClick={(e) => toggleLayerExpanded(layer.id, e)}
                    className="p-0.5 theme-text-muted hover:theme-text-main rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isEditingLayer ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                        className="w-full theme-bg-input border border-blue-500 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                        autoFocus
                      />
                      <button onClick={handleSaveRename} className="p-1 text-emerald-500">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate font-semibold text-xs flex-1">
                      {layer.name}
                    </span>
                  )}

                  {/* Object count badge */}
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded theme-bg-app theme-text-muted">
                    {layerObjects.length}
                  </span>
                </div>

                {!isEditingLayer && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => handleToggleLayerVisible(layer.id, e)}
                      className="p-1 theme-text-muted hover:theme-text-main"
                      title="Visibilidade da camada"
                    >
                      {layer.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleToggleLayerLocked(layer.id, e)}
                      className="p-1 theme-text-muted hover:theme-text-main"
                      title="Bloqueio da camada"
                    >
                      {layer.locked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleContextMenu(e, 'layer', layer.id)}
                      className="p-1 theme-text-muted hover:theme-text-main"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Layer Object Children */}
              {isExpanded && layerObjects.length > 0 && (
                <div className="pl-4 pr-1 pb-1 space-y-0.5 border-l-2 border-blue-500/20 ml-3">
                  {layerObjects.map((obj) => {
                    const isSelected = selectedIds.includes(obj.id);
                    const isEditingObj = editingType === 'object' && editingId === obj.id;
                    const isDragTargetObj = dragOverTarget?.id === obj.id && dragOverTarget?.type === 'object';
                    const isEffectiveLocked = obj.locked || layer.locked;

                    return (
                      <div
                        key={obj.id}
                        ref={isSelected ? selectedItemRef : null}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectObject(obj.id, e.shiftKey || e.ctrlKey || e.metaKey);
                        }}
                        onDoubleClick={(e) => handleStartRenameObject(obj, e)}
                        className={`group flex items-center justify-between px-2 py-1 rounded transition-all cursor-pointer border ${
                          isDragTargetObj
                            ? 'border-t-2 border-t-blue-500 bg-blue-500/10'
                            : isSelected
                            ? 'bg-blue-600/15 text-blue-500 border-blue-500/30 font-medium'
                            : 'border-transparent hover:bg-[var(--bg-surface-hover)]'
                        }`}
                        draggable={!isEffectiveLocked}
                        onDragStart={(e) => handleDragStartObject(e, obj, layer.id)}
                        onDragOver={(e) => handleDragOverObject(e, obj)}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={(e) => handleDropOnObject(e, obj)}
                        onContextMenu={(e) => handleContextMenu(e, 'object', obj.id)}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                          <CornerDownRight className="w-3 h-3 theme-text-subtle shrink-0" />
                          {getObjectIcon(obj)}

                          {isEditingObj ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                                className="w-full theme-bg-input border border-blue-500 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                                autoFocus
                              />
                              <button onClick={handleSaveRename} className="p-1 text-emerald-500">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="truncate text-xs">
                              {getObjectDisplayName(obj)}
                            </span>
                          )}
                        </div>

                        {!isEditingObj && (
                          <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100">
                            <button
                              onClick={(e) => handleToggleObjectVisible(obj.id, e)}
                              className="p-1 theme-text-muted hover:theme-text-main"
                              title="Visibilidade do objeto"
                            >
                              {obj.visible ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-red-400" />
                              )}
                            </button>
                            <button
                              onClick={(e) => handleToggleObjectLocked(obj.id, e)}
                              className="p-1 theme-text-muted hover:theme-text-main"
                              title="Bloqueio do objeto"
                            >
                              {isEffectiveLocked ? (
                                <Lock className="w-3 h-3 text-amber-500" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 theme-bg-surface border theme-border rounded-md shadow-2xl py-1 text-xs"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetType === 'layer' ? (
            <>
              {(() => {
                const layer = layers.find((l) => l.id === contextMenu.targetId);
                if (!layer) return null;
                return (
                  <>
                    <button
                      onClick={() => {
                        handleStartRenameLayer(layer);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Renomear camada
                    </button>
                    <button
                      onClick={() => {
                        handleToggleLayerVisible(layer.id, { stopPropagation: () => {} } as React.MouseEvent);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" /> {layer.visible ? 'Ocultar camada' : 'Exibir camada'}
                    </button>
                    <button
                      onClick={() => {
                        handleToggleLayerLocked(layer.id, { stopPropagation: () => {} } as React.MouseEvent);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" /> {layer.locked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    {layers.length > 1 && (
                      <button
                        onClick={() => {
                          handleDeleteLayerRequest(layer);
                          setContextMenu(null);
                        }}
                        className="w-full px-3 py-1.5 text-left text-red-500 hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir camada
                      </button>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <>
              {(() => {
                const obj = objects.find((o) => o.id === contextMenu.targetId);
                if (!obj) return null;
                return (
                  <>
                    <button
                      onClick={() => {
                        setSelectedIds([obj.id]);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-500" /> Selecionar
                    </button>
                    <button
                      onClick={() => {
                        handleStartRenameObject(obj);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Alterar título
                    </button>
                    <button
                      onClick={() => {
                        pushHistory(objects);
                        const duplicatedObj: CanvasObject = {
                          ...JSON.parse(JSON.stringify(obj)),
                          id: crypto.randomUUID(),
                          x: obj.x + 10,
                          y: obj.y + 10,
                          name: `${obj.name} (cópia)`,
                        };
                        updateActiveProject((doc) => ({
                          ...doc,
                          objects: [...doc.objects, duplicatedObj],
                        }));
                        setSelectedIds([duplicatedObj.id]);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicar
                    </button>
                    <button
                      onClick={() => {
                        handleToggleObjectVisible(obj.id, { stopPropagation: () => {} } as React.MouseEvent);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" /> {obj.visible ? 'Ocultar' : 'Exibir'}
                    </button>
                    <button
                      onClick={() => {
                        handleToggleObjectLocked(obj.id, { stopPropagation: () => {} } as React.MouseEvent);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" /> {obj.locked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button
                      onClick={() => {
                        pushHistory(objects);
                        updateActiveProject((doc) => ({
                          ...doc,
                          objects: doc.objects.filter((o) => o.id !== obj.id),
                        }));
                        setSelectedIds(selectedIds.filter((id) => id !== obj.id));
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-red-500 hover:bg-[var(--bg-surface-hover)] flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Layer Deletion Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="theme-bg-surface border theme-border rounded-lg shadow-2xl p-5 max-w-sm w-full space-y-4 theme-text-main text-xs">
            <h3 className="text-sm font-bold text-red-500 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" /> Excluir camada &ldquo;{deleteModal.layerName}&rdquo;
            </h3>
            <p className="theme-text-muted leading-relaxed">
              Esta camada contém <strong>{deleteModal.objectCount}</strong> {deleteModal.objectCount === 1 ? 'objeto' : 'objetos'}. Como deseja proceder?
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => executeDeleteLayer(deleteModal.layerId, 'move')}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs transition-colors flex items-center justify-center gap-2"
              >
                Mover objetos para outra camada
              </button>
              <button
                onClick={() => executeDeleteLayer(deleteModal.layerId, 'delete')}
                className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 font-medium rounded text-xs transition-colors flex items-center justify-center gap-2"
              >
                Excluir camada e objetos
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="w-full px-3 py-2 theme-bg-app hover:bg-[var(--bg-surface-hover)] theme-text-main border theme-border font-medium rounded text-xs transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
