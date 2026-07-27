import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line as KonvaLine, Text as KonvaText, Transformer } from 'react-konva';
import Konva from 'konva';
import {
  CanvasObject,
  RectangleObject,
  CircleObject,
  LineObject,
  TextObject,
} from '@inframap/domain';
import {
  screenToWorld,
  snapToGrid as snapToGridUtil,
  createTextObject,
  createRectangleFromDrag,
  createCircleFromDrag,
  createLineFromDrag,
  normalizeDragBounds,
  calculateCircleRadius,
  constrainLineAngle,
  DrawingSession,
  Viewport,
} from '@inframap/editor-core';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';

interface CanvasProps {
  onCursorMove?: (xMm: number, yMm: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ onCursorMove }) => {
  const { activeProject, updateActiveProject } = useProjectStore();
  const {
    activeTool,
    selectedIds,
    setSelectedIds,
    clearSelection,
    activeLayerId,
    viewport,
    setViewport,
    showGrid,
    snapToGrid: isSnapEnabled,
    pushHistory,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Alt and Space key state tracking
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Draft state for drag creation
  const [draft, setDraft] = useState<DrawingSession | null>(null);

  // Drag start positions for move tool multi-selection movement
  const dragStartWorldPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Update container size with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Listen for global modifier keys (Alt, Space, Escape) and window blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'Alt') {
        setIsAltPressed(true);
      }
      if (e.key === ' ' || e.code === 'Space') {
        setIsSpacePressed(true);
      }
      if (e.key === 'Escape') {
        setDraft(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
      if (e.key === ' ' || e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    const handleBlur = () => {
      setIsAltPressed(false);
      setIsSpacePressed(false);
      setIsPanning(false);
      setDraft(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Cancel draft if active tool changes
  useEffect(() => {
    setDraft(null);
  }, [activeTool]);

  // Update transformer node attachments when selection changes safely
  useLayoutEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    // Show transformer ONLY in 'select' tool
    if (activeTool !== 'select' || selectedIds.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const selectedNodes: Konva.Node[] = [];
    selectedIds.forEach((id) => {
      // Don't attach transformer to lines to avoid distorting line endpoints
      const obj = activeProject?.objects.find((o) => o.id === id);
      if (obj && obj.type === 'line') return;

      const node = stage.findOne(`#shape-${id}`);
      if (node && node.getStage()) {
        selectedNodes.push(node);
      }
    });

    transformer.nodes(selectedNodes);
    transformer.getLayer()?.batchDraw();

    return () => {
      if (transformerRef.current) {
        try {
          transformerRef.current.nodes([]);
          transformerRef.current.getLayer()?.batchDraw();
        } catch {
          // ignore if stage destroyed
        }
      }
    };
  }, [selectedIds, activeTool, activeProject?.objects, activeProject?.layers]);

  if (!activeProject) return null;

  const { canonicalWidth, canonicalHeight } = activeProject;
  const canonicalGridSize = activeProject.settings.canonicalGridSize;
  const currentActiveLayerId = activeLayerId || activeProject.layers[0]?.id || '';

  // Snapping rule: const shouldSnap = snapToGrid && !event.altKey;
  const shouldSnap = isSnapEnabled && !isAltPressed;

  const getSnappedWorldPos = (worldX: number, worldY: number) => {
    if (!shouldSnap) return { x: worldX, y: worldY };
    return {
      x: snapToGridUtil(worldX, canonicalGridSize),
      y: snapToGridUtil(worldY, canonicalGridSize),
    };
  };

  // Filter objects by layer visibility
  const visibleLayerIds = new Set(
    activeProject.layers.filter((l) => l.visible).map((l) => l.id)
  );

  const visibleObjects = activeProject.objects.filter((o) =>
    visibleLayerIds.has(o.layerId)
  );

  // Wheel zoom handler centered on pointer
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.15;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(10, newScale));

    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    const newX = pointer.x - mousePointTo.x * clampedScale;
    const newY = pointer.y - mousePointTo.y * clampedScale;

    setViewport({ x: newX, y: newY, scale: clampedScale });
  };

  // Mouse / Pointer Down
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Pan with middle mouse, spacebar, or pan tool
    if (activeTool === 'pan' || isSpacePressed || e.evt.button === 1) {
      setIsPanning(true);
      setPanStart({ x: pointer.x, y: pointer.y });
      return;
    }

    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-grid';

    // Single click for Text tool on empty area
    if (activeTool === 'text' && clickedOnEmpty) {
      const rawX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const rawY = screenToWorld(pointer.y, viewport.scale, viewport.y);
      const pos = getSnappedWorldPos(rawX, rawY);

      const newObj = createTextObject(currentActiveLayerId, pos.x, pos.y, 'Texto', 24);
      pushHistory(activeProject.objects);
      updateActiveProject((doc) => ({
        ...doc,
        objects: [...doc.objects, newObj],
      }));
      setSelectedIds([newObj.id]);
      return;
    }

    // Start drafting session for rectangle, circle, line
    if (['rectangle', 'circle', 'line'].includes(activeTool) && clickedOnEmpty) {
      const rawX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const rawY = screenToWorld(pointer.y, viewport.scale, viewport.y);
      const pos = getSnappedWorldPos(rawX, rawY);

      setDraft({
        tool: activeTool as 'rectangle' | 'circle' | 'line',
        layerId: currentActiveLayerId,
        startX: pos.x,
        startY: pos.y,
        currentX: pos.x,
        currentY: pos.y,
      });
      return;
    }

    // Clear selection on empty stage click for select or move tools
    if (clickedOnEmpty && (activeTool === 'select' || activeTool === 'move')) {
      clearSelection();
    }
  };

  // Mouse / Pointer Move
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();

    if (pointer && onCursorMove) {
      const worldX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const worldY = screenToWorld(pointer.y, viewport.scale, viewport.y);
      onCursorMove(worldX, worldY);
    }

    // Viewport panning
    if (isPanning && pointer) {
      const dx = pointer.x - panStart.x;
      const dy = pointer.y - panStart.y;
      setViewport((prev: Viewport) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setPanStart({ x: pointer.x, y: pointer.y });
      return;
    }

    // Updating active drafting session
    if (draft && pointer) {
      const rawX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const rawY = screenToWorld(pointer.y, viewport.scale, viewport.y);

      let currentPos = getSnappedWorldPos(rawX, rawY);

      if (draft.tool === 'line' && e.evt.shiftKey) {
        currentPos = constrainLineAngle(
          { x: draft.startX, y: draft.startY },
          currentPos
        );
      }

      setDraft((prev) => (prev ? { ...prev, currentX: currentPos.x, currentY: currentPos.y } : null));
    }
  };

  // Mouse / Pointer Up
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    // Confirm draft session creation
    if (draft) {
      let newObj: CanvasObject | null = null;
      const start = { x: draft.startX, y: draft.startY };
      const end = { x: draft.currentX, y: draft.currentY };

      if (draft.tool === 'rectangle') {
        newObj = createRectangleFromDrag(start, end, draft.layerId);
      } else if (draft.tool === 'circle') {
        newObj = createCircleFromDrag(start, end, draft.layerId);
      } else if (draft.tool === 'line') {
        newObj = createLineFromDrag(start, end, draft.layerId);
      }

      if (newObj) {
        pushHistory(activeProject.objects);
        updateActiveProject((doc) => ({
          ...doc,
          objects: [...doc.objects, newObj!],
        }));
        setSelectedIds([newObj.id]);
      }

      setDraft(null);
    }
  };

  // Drag start for objects in 'move' tool
  const handleObjectDragStart = (objId: string) => {
    // Determine target selection
    let targets = selectedIds;
    if (!selectedIds.includes(objId)) {
      targets = [objId];
      setSelectedIds([objId]);
    }

    const positions = new Map<string, { x: number; y: number }>();
    targets.forEach((id) => {
      const targetObj = activeProject.objects.find((o) => o.id === id);
      if (targetObj) {
        positions.set(id, { x: targetObj.x, y: targetObj.y });
      }
    });

    dragStartWorldPosRef.current = positions;
  };

  // Drag end for shapes in 'move' tool
  const handleShapeDragEnd = (draggedId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let newX = screenToWorld(node.x(), viewport.scale, viewport.x);
    let newY = screenToWorld(node.y(), viewport.scale, viewport.y);

    if (shouldSnap) {
      const snapped = getSnappedWorldPos(newX, newY);
      newX = snapped.x;
      newY = snapped.y;
    }

    const initialPos = dragStartWorldPosRef.current.get(draggedId);
    if (!initialPos) {
      // Fallback single object update
      pushHistory(activeProject.objects);
      updateActiveProject((doc) => ({
        ...doc,
        objects: doc.objects.map((o) => (o.id === draggedId ? { ...o, x: newX, y: newY } : o)),
      }));
      return;
    }

    const deltaX = newX - initialPos.x;
    const deltaY = newY - initialPos.y;

    const movingIds = new Set(dragStartWorldPosRef.current.keys());

    pushHistory(activeProject.objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) => {
        if (!movingIds.has(o.id)) return o;
        const startPos = dragStartWorldPosRef.current.get(o.id);
        if (!startPos) return o;
        return {
          ...o,
          x: startPos.x + deltaX,
          y: startPos.y + deltaY,
        };
      }),
    }));

    dragStartWorldPosRef.current.clear();
  };

  // Transform End (for resizing in 'select' tool)
  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = Math.round(node.rotation());

    node.scaleX(1);
    node.scaleY(1);

    let newX = screenToWorld(node.x(), viewport.scale, viewport.x);
    let newY = screenToWorld(node.y(), viewport.scale, viewport.y);

    if (shouldSnap) {
      const snapped = getSnappedWorldPos(newX, newY);
      newX = snapped.x;
      newY = snapped.y;
    }

    pushHistory(activeProject.objects);

    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) => {
        if (o.id !== id) return o;

        if (o.type === 'rectangle') {
          const rect = o as RectangleObject;
          return {
            ...rect,
            x: newX,
            y: newY,
            rotation,
            width: Math.max(2, rect.width * scaleX),
            height: Math.max(2, rect.height * scaleY),
          };
        } else if (o.type === 'circle') {
          const circ = o as CircleObject;
          return {
            ...circ,
            x: newX,
            y: newY,
            rotation,
            radius: Math.max(2, circ.radius * Math.max(scaleX, scaleY)),
          };
        } else {
          return {
            ...o,
            x: newX,
            y: newY,
            rotation,
          };
        }
      }),
    }));
  };

  // Render Grid lines if showGrid is true
  const renderGridLines = () => {
    if (!showGrid) return null;

    const lines = [];
    const stepPx = canonicalGridSize * viewport.scale;

    if (stepPx < 6) return null; // Avoid rendering dense grid lines when zoomed far out

    const startX = (viewport.x % stepPx) - stepPx;
    const startY = (viewport.y % stepPx) - stepPx;

    const widthPx = containerSize.width + stepPx * 2;
    const heightPx = containerSize.height + stepPx * 2;

    let index = 0;
    for (let x = startX; x < widthPx; x += stepPx) {
      lines.push(
        <KonvaLine
          key={`v-${index++}-${Math.round(x)}`}
          points={[x, 0, x, containerSize.height]}
          stroke="#1e293b"
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    for (let y = startY; y < heightPx; y += stepPx) {
      lines.push(
        <KonvaLine
          key={`h-${index++}-${Math.round(y)}`}
          points={[0, y, containerSize.width, y]}
          stroke="#1e293b"
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    return lines;
  };

  // Render Draft Shape Preview during drag creation
  const renderDraftPreview = () => {
    if (!draft) return null;

    if (draft.tool === 'rectangle') {
      const bounds = normalizeDragBounds(
        { x: draft.startX, y: draft.startY },
        { x: draft.currentX, y: draft.currentY }
      );
      const screenX = bounds.x * viewport.scale + viewport.x;
      const screenY = bounds.y * viewport.scale + viewport.y;

      return (
        <Rect
          x={screenX}
          y={screenY}
          width={bounds.width * viewport.scale}
          height={bounds.height * viewport.scale}
          stroke="#3b82f6"
          strokeWidth={1.5}
          dash={[6, 4]}
          fill="#3b82f6"
          opacity={0.35}
          listening={false}
        />
      );
    }

    if (draft.tool === 'circle') {
      const radius = calculateCircleRadius(
        { x: draft.startX, y: draft.startY },
        { x: draft.currentX, y: draft.currentY }
      );
      const screenX = draft.startX * viewport.scale + viewport.x;
      const screenY = draft.startY * viewport.scale + viewport.y;

      return (
        <Circle
          x={screenX}
          y={screenY}
          radius={radius * viewport.scale}
          stroke="#3b82f6"
          strokeWidth={1.5}
          dash={[6, 4]}
          fill="#3b82f6"
          opacity={0.35}
          listening={false}
        />
      );
    }

    if (draft.tool === 'line') {
      const screenStartX = draft.startX * viewport.scale + viewport.x;
      const screenStartY = draft.startY * viewport.scale + viewport.y;
      const screenEndX = draft.currentX * viewport.scale + viewport.x;
      const screenEndY = draft.currentY * viewport.scale + viewport.y;

      return (
        <KonvaLine
          points={[screenStartX, screenStartY, screenEndX, screenEndY]}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[6, 4]}
          listening={false}
        />
      );
    }

    return null;
  };

  // Cursor style class determination
  const getCursorStyle = () => {
    if (activeTool === 'pan' || isPanning || isSpacePressed) {
      return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    }
    if (activeTool === 'select') return 'cursor-default';
    if (activeTool === 'move') return 'cursor-move';
    if (['rectangle', 'circle', 'line'].includes(activeTool)) return 'cursor-crosshair';
    if (activeTool === 'text') return 'cursor-text';
    return 'cursor-default';
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-slate-950 relative overflow-hidden select-none ${getCursorStyle()}`}
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Background grid */}
          {renderGridLines()}

          {/* Project boundary Rect */}
          <Rect
            x={viewport.x}
            y={viewport.y}
            width={canonicalWidth * viewport.scale}
            height={canonicalHeight * viewport.scale}
            stroke="#334155"
            strokeWidth={1.5}
            dash={[6, 6]}
            listening={false}
            name="background-grid"
          />

          {/* Render Objects */}
          {visibleObjects.map((obj) => {
            const isSelected = selectedIds.includes(obj.id);
            const layer = activeProject.layers.find((l) => l.id === obj.layerId);
            const isLocked = obj.locked || layer?.locked || false;

            const screenX = obj.x * viewport.scale + viewport.x;
            const screenY = obj.y * viewport.scale + viewport.y;

            // In 'select' tool: objects are NOT draggable directly (only transformer resizes/rotates).
            // In 'move' tool: objects ARE draggable if unlocked.
            const isDraggable = !isLocked && activeTool === 'move';

            const commonProps = {
              id: `shape-${obj.id}`,
              x: screenX,
              y: screenY,
              rotation: obj.rotation,
              draggable: isDraggable,
              opacity: obj.opacity,
              onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                if (activeTool === 'select' || activeTool === 'move') {
                  if (e.evt.shiftKey) {
                    // Multi-select toggle
                    if (selectedIds.includes(obj.id)) {
                      setSelectedIds(selectedIds.filter((id) => id !== obj.id));
                    } else {
                      setSelectedIds([...selectedIds, obj.id]);
                    }
                  } else {
                    setSelectedIds([obj.id]);
                  }
                }
              },
              onDragStart: () => {
                if (activeTool === 'move') {
                  handleObjectDragStart(obj.id);
                }
              },
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
                if (activeTool === 'move') {
                  handleShapeDragEnd(obj.id, e);
                }
              },
              onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(obj.id, e),
            };

            if (obj.type === 'rectangle') {
              const rect = obj as RectangleObject;
              return (
                <Rect
                  key={obj.id}
                  {...commonProps}
                  width={rect.width * viewport.scale}
                  height={rect.height * viewport.scale}
                  fill={rect.fill}
                  stroke={isSelected ? '#3b82f6' : rect.stroke}
                  strokeWidth={isSelected ? Math.max(2, rect.strokeWidth * viewport.scale) : rect.strokeWidth * viewport.scale}
                  cornerRadius={2}
                />
              );
            }

            if (obj.type === 'circle') {
              const circ = obj as CircleObject;
              return (
                <Circle
                  key={obj.id}
                  {...commonProps}
                  radius={circ.radius * viewport.scale}
                  fill={circ.fill}
                  stroke={isSelected ? '#3b82f6' : circ.stroke}
                  strokeWidth={isSelected ? Math.max(2, circ.strokeWidth * viewport.scale) : circ.strokeWidth * viewport.scale}
                />
              );
            }

            if (obj.type === 'line') {
              const line = obj as LineObject;
              const scaledPoints = line.points.map((p) => p * viewport.scale);
              return (
                <KonvaLine
                  key={obj.id}
                  {...commonProps}
                  points={scaledPoints}
                  stroke={isSelected ? '#3b82f6' : line.stroke}
                  strokeWidth={isSelected ? Math.max(3, line.strokeWidth * viewport.scale) : line.strokeWidth * viewport.scale}
                />
              );
            }

            if (obj.type === 'text') {
              const txt = obj as TextObject;
              return (
                <KonvaText
                  key={obj.id}
                  {...commonProps}
                  text={txt.text}
                  fontSize={txt.fontSize * viewport.scale}
                  fontFamily={txt.fontFamily}
                  fill={isSelected ? '#3b82f6' : txt.fill}
                  align={txt.align}
                />
              );
            }

            return null;
          })}

          {/* Draft Preview Layer */}
          {renderDraftPreview()}

          {/* Transformer for Selection Tool */}
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            anchorSize={8}
            anchorCornerRadius={2}
            borderStroke="#3b82f6"
            anchorStroke="#3b82f6"
            anchorFill="#ffffff"
          />
        </Layer>
      </Stage>
    </div>
  );
};
