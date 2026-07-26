import React, { useEffect, useRef, useState } from 'react';
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
  snapToGrid,
  createRectangleObject,
  createCircleObject,
  createLineObject,
  createTextObject,
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
    setActiveTool,
    selectedIds,
    setSelectedIds,
    clearSelection,
    activeLayerId,
    viewport,
    setViewport,
    snapToGrid: isSnapEnabled,
    pushHistory,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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

  // Update transformer node attachments when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedIds.length === 0) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
      return;
    }

    const selectedNodes: Konva.Node[] = [];
    selectedIds.forEach((id) => {
      const node = stageRef.current?.findOne(`#shape-${id}`);
      if (node) {
        selectedNodes.push(node);
      }
    });

    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, activeProject?.objects]);

  if (!activeProject) return null;

  const { canonicalWidth, canonicalHeight } = activeProject;
  const canonicalGridSize = activeProject.settings.canonicalGridSize;
  const currentActiveLayerId = activeLayerId || activeProject.layers[0]?.id || '';

  // Filter objects by layer visibility
  const visibleLayerIds = new Set(
    activeProject.layers.filter((l) => l.visible).map((l) => l.id)
  );

  const visibleObjects = activeProject.objects.filter((o) =>
    visibleLayerIds.has(o.layerId)
  );

  // Wheel zoom handler centered on mouse
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

  // Stage click/tap
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicked on stage background
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-grid';

    if (clickedOnEmpty) {
      if (activeTool === 'select' || activeTool === 'pan') {
        clearSelection();
        return;
      }

      // Handle shape creation
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      let worldX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      let worldY = screenToWorld(pointer.y, viewport.scale, viewport.y);

      if (isSnapEnabled) {
        worldX = snapToGrid(worldX, canonicalGridSize);
        worldY = snapToGrid(worldY, canonicalGridSize);
      }

      let newObj: CanvasObject | null = null;
      pushHistory(activeProject.objects);

      if (activeTool === 'rectangle') {
        newObj = createRectangleObject(currentActiveLayerId, worldX, worldY, 200, 100);
      } else if (activeTool === 'circle') {
        newObj = createCircleObject(currentActiveLayerId, worldX, worldY, 80);
      } else if (activeTool === 'line') {
        newObj = createLineObject(currentActiveLayerId, worldX, worldY, [0, 0, 200, 0]);
      } else if (activeTool === 'text') {
        newObj = createTextObject(currentActiveLayerId, worldX, worldY, 'Novo Texto', 24);
      }

      if (newObj) {
        updateActiveProject((doc) => ({
          ...doc,
          objects: [...doc.objects, newObj!],
        }));
        setSelectedIds([newObj.id]);
        setActiveTool('select');
      }
    }
  };

  // Mouse move over canvas
  const handleMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (pointer && onCursorMove) {
      const worldX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const worldY = screenToWorld(pointer.y, viewport.scale, viewport.y);
      onCursorMove(worldX, worldY);
    }

    if (isPanning) {
      if (!pointer) return;
      const dx = pointer.x - panStart.x;
      const dy = pointer.y - panStart.y;
      setViewport((prev: Viewport) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setPanStart({ x: pointer.x, y: pointer.y });
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'pan' || e.evt.button === 1) {
      const pointer = stageRef.current?.getPointerPosition();
      if (pointer) {
        setIsPanning(true);
        setPanStart({ x: pointer.x, y: pointer.y });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Drag End for shapes
  const handleShapeDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let newX = screenToWorld(node.x(), viewport.scale, viewport.x);
    let newY = screenToWorld(node.y(), viewport.scale, viewport.y);

    if (isSnapEnabled) {
      newX = snapToGrid(newX, canonicalGridSize);
      newY = snapToGrid(newY, canonicalGridSize);
    }

    pushHistory(activeProject.objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) => (o.id === id ? { ...o, x: newX, y: newY } : o)),
    }));
  };

  // Transform End
  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = Math.round(node.rotation());

    node.scaleX(1);
    node.scaleY(1);

    pushHistory(activeProject.objects);

    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) => {
        if (o.id !== id) return o;

        let newX = screenToWorld(node.x(), viewport.scale, viewport.x);
        let newY = screenToWorld(node.y(), viewport.scale, viewport.y);

        if (isSnapEnabled) {
          newX = snapToGrid(newX, canonicalGridSize);
          newY = snapToGrid(newY, canonicalGridSize);
        }

        if (o.type === 'rectangle') {
          const rect = o as RectangleObject;
          return {
            ...rect,
            x: newX,
            y: newY,
            rotation,
            width: Math.max(10, rect.width * scaleX),
            height: Math.max(10, rect.height * scaleY),
          };
        } else if (o.type === 'circle') {
          const circ = o as CircleObject;
          return {
            ...circ,
            x: newX,
            y: newY,
            rotation,
            radius: Math.max(5, circ.radius * Math.max(scaleX, scaleY)),
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

  // Render Grid lines
  const renderGridLines = () => {
    const lines = [];
    const stepPx = canonicalGridSize * viewport.scale;

    if (stepPx < 8) return null; // Avoid rendering dense grid lines when zoomed out

    const startX = (viewport.x % stepPx) - stepPx;
    const startY = (viewport.y % stepPx) - stepPx;

    const widthPx = containerSize.width + stepPx * 2;
    const heightPx = containerSize.height + stepPx * 2;

    for (let x = startX; x < widthPx; x += stepPx) {
      lines.push(
        <KonvaLine
          key={`v-${x}`}
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
          key={`h-${y}`}
          points={[0, y, containerSize.width, y]}
          stroke="#1e293b"
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    return lines;
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-slate-950 relative overflow-hidden select-none ${
        activeTool === 'pan' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
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

            const commonProps = {
              id: `shape-${obj.id}`,
              key: obj.id,
              x: screenX,
              y: screenY,
              rotation: obj.rotation,
              draggable: !isLocked && activeTool === 'select',
              opacity: obj.opacity,
              onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                if (activeTool === 'select') {
                  setSelectedIds([obj.id]);
                }
              },
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleShapeDragEnd(obj.id, e),
              onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(obj.id, e),
            };

            if (obj.type === 'rectangle') {
              const rect = obj as RectangleObject;
              return (
                <Rect
                  {...commonProps}
                  width={rect.width * viewport.scale}
                  height={rect.height * viewport.scale}
                  fill={rect.fill}
                  stroke={isSelected ? '#3b82f6' : rect.stroke}
                  strokeWidth={rect.strokeWidth * viewport.scale}
                  cornerRadius={2}
                />
              );
            }

            if (obj.type === 'circle') {
              const circ = obj as CircleObject;
              return (
                <Circle
                  {...commonProps}
                  radius={circ.radius * viewport.scale}
                  fill={circ.fill}
                  stroke={isSelected ? '#3b82f6' : circ.stroke}
                  strokeWidth={circ.strokeWidth * viewport.scale}
                />
              );
            }

            if (obj.type === 'line') {
              const line = obj as LineObject;
              const scaledPoints = line.points.map((p) => p * viewport.scale);
              return (
                <KonvaLine
                  {...commonProps}
                  points={scaledPoints}
                  stroke={isSelected ? '#3b82f6' : line.stroke}
                  strokeWidth={line.strokeWidth * viewport.scale}
                />
              );
            }

            if (obj.type === 'text') {
              const txt = obj as TextObject;
              return (
                <KonvaText
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

          {/* Transformer */}
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
