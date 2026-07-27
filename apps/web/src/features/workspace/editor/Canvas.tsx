import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line as KonvaLine, Text as KonvaText, Transformer, Group } from 'react-konva';
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
  createLineFromPoints,
  normalizeDragBounds,
  calculateCircleRadius,
  constrainSegmentAngle,
  appendPolylinePoint,
  removeLastPolylinePoint,
  deduplicateConsecutivePoints,
  getPolylineMidpoint,
  isValidPolyline,
  PolylineDrawingSession,
  PolylinePoint,
  DrawingSession,
  Viewport,
} from '@inframap/editor-core';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';

interface CanvasProps {
  onCursorMove?: (xMm: number, yMm: number) => void;
}

interface InlineTextEditSession {
  objectId: string;
  isNew: boolean;
  initialText: string;
  text: string;
  x: number; // world x (mm)
  y: number; // world y (mm)
  fontSize: number; // mm
  fontFamily: string;
  fill: string;
}

export const Canvas: React.FC<CanvasProps> = ({ onCursorMove }) => {
  const { t } = useTranslation();
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Alt and Space key state tracking
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Draft state for drag creation (Rectangle & Circle)
  const [draft, setDraft] = useState<DrawingSession | null>(null);

  // Multi-point polyline session for solid & dashed lines
  const [polylineSession, setPolylineSession] = useState<PolylineDrawingSession | null>(null);

  // Inline text editing state
  const [editingText, setEditingText] = useState<InlineTextEditSession | null>(null);

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

  // Listen for custom edit text event from PropertiesPanel
  useEffect(() => {
    const handleCustomEditText = (e: Event) => {
      const customEvent = e as CustomEvent<{ objectId: string }>;
      if (!customEvent.detail?.objectId || !activeProject) return;
      const targetObj = activeProject.objects.find((o) => o.id === customEvent.detail.objectId);
      if (targetObj && targetObj.type === 'text') {
        const txt = targetObj as TextObject;
        setEditingText({
          objectId: txt.id,
          isNew: false,
          initialText: txt.text,
          text: txt.text,
          x: txt.x,
          y: txt.y,
          fontSize: txt.fontSize,
          fontFamily: txt.fontFamily,
          fill: txt.fill,
        });
      }
    };

    window.addEventListener('inframap:edit-text', handleCustomEditText);
    return () => window.removeEventListener('inframap:edit-text', handleCustomEditText);
  }, [activeProject]);

  // Focus and select textarea on inline text edit start
  useEffect(() => {
    if (editingText && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingText?.objectId]);

  // Handle keys for polyline session (Enter, Escape, Backspace)
  useEffect(() => {
    const handlePolylineKeys = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Alt') setIsAltPressed(true);
      if (e.key === ' ' || e.code === 'Space') setIsSpacePressed(true);

      if (e.key === 'Escape') {
        if (polylineSession) {
          setPolylineSession(null);
        } else {
          setDraft(null);
        }
      }

      if (polylineSession) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isValidPolyline(polylineSession.fixedPoints)) {
            finishPolylineSession(polylineSession);
          }
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          const remaining = removeLastPolylinePoint(polylineSession.fixedPoints);
          if (remaining.length === 0) {
            setPolylineSession(null);
          } else {
            setPolylineSession({
              ...polylineSession,
              fixedPoints: remaining,
            });
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(false);
      if (e.key === ' ' || e.code === 'Space') setIsSpacePressed(false);
    };

    const handleBlur = () => {
      setIsAltPressed(false);
      setIsSpacePressed(false);
      setIsPanning(false);
      setDraft(null);
    };

    window.addEventListener('keydown', handlePolylineKeys);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handlePolylineKeys);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [polylineSession, activeProject]);

  // Reset drawing sessions when active tool changes
  useEffect(() => {
    setDraft(null);
    setPolylineSession(null);
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

  // Finish Polyline Session
  const finishPolylineSession = (session: PolylineDrawingSession) => {
    if (!activeProject) return;
    const cleanedPoints = deduplicateConsecutivePoints(session.fixedPoints);
    const lineObj = createLineFromPoints(
      session.layerId,
      cleanedPoints,
      session.tool === 'dashed-line' ? 'dashed' : 'solid'
    );

    if (lineObj) {
      pushHistory(activeProject.objects);
      updateActiveProject((doc) => ({
        ...doc,
        objects: [...doc.objects, lineObj],
      }));
      setSelectedIds([lineObj.id]);
    }
    setPolylineSession(null);
  };

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

    // Text tool: click on empty area to create & immediately start inline editing
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

      setEditingText({
        objectId: newObj.id,
        isNew: true,
        initialText: 'Texto',
        text: 'Texto',
        x: pos.x,
        y: pos.y,
        fontSize: newObj.fontSize,
        fontFamily: newObj.fontFamily,
        fill: newObj.fill,
      });
      return;
    }

    // Polyline drawing for line or dashed-line tool
    if ((activeTool === 'line' || activeTool === 'dashed-line') && clickedOnEmpty) {
      const rawX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const rawY = screenToWorld(pointer.y, viewport.scale, viewport.y);
      let pos = { x: rawX, y: rawY };

      if (polylineSession && polylineSession.fixedPoints.length > 0 && e.evt.shiftKey) {
        const last = polylineSession.fixedPoints[polylineSession.fixedPoints.length - 1];
        pos = constrainSegmentAngle(last, pos);
      }
      pos = getSnappedWorldPos(pos.x, pos.y);

      if (!polylineSession) {
        setPolylineSession({
          tool: activeTool,
          layerId: currentActiveLayerId,
          fixedPoints: [pos],
          previewPoint: pos,
        });
      } else {
        const nextPoints = appendPolylinePoint(polylineSession.fixedPoints, pos);
        setPolylineSession({
          ...polylineSession,
          fixedPoints: nextPoints,
          previewPoint: pos,
        });
      }
      return;
    }

    // Drag drafting session for Rectangle & Circle
    if (['rectangle', 'circle'].includes(activeTool) && clickedOnEmpty) {
      const rawX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const rawY = screenToWorld(pointer.y, viewport.scale, viewport.y);
      const pos = getSnappedWorldPos(rawX, rawY);

      setDraft({
        tool: activeTool as 'rectangle' | 'circle',
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

  // Stage Double Click (finish polyline session)
  const handleStageDblClick = () => {
    if (polylineSession && isValidPolyline(polylineSession.fixedPoints)) {
      finishPolylineSession(polylineSession);
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

    // Polyline session mouse move preview point
    if (polylineSession && pointer) {
      const rawX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const rawY = screenToWorld(pointer.y, viewport.scale, viewport.y);
      let pos = { x: rawX, y: rawY };

      if (polylineSession.fixedPoints.length > 0 && e.evt.shiftKey) {
        const last = polylineSession.fixedPoints[polylineSession.fixedPoints.length - 1];
        pos = constrainSegmentAngle(last, pos);
      }
      pos = getSnappedWorldPos(pos.x, pos.y);

      setPolylineSession((prev) => (prev ? { ...prev, previewPoint: pos } : null));
      return;
    }

    // Drag drafting session
    if (draft && pointer) {
      const rawX = screenToWorld(pointer.x, viewport.scale, viewport.x);
      const rawY = screenToWorld(pointer.y, viewport.scale, viewport.y);
      const currentPos = getSnappedWorldPos(rawX, rawY);

      setDraft((prev) => (prev ? { ...prev, currentX: currentPos.x, currentY: currentPos.y } : null));
    }
  };

  // Mouse / Pointer Up
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    // Confirm drag draft session creation (Rectangle, Circle)
    if (draft) {
      let newObj: CanvasObject | null = null;
      const start = { x: draft.startX, y: draft.startY };
      const end = { x: draft.currentX, y: draft.currentY };

      if (draft.tool === 'rectangle') {
        newObj = createRectangleFromDrag(start, end, draft.layerId);
      } else if (draft.tool === 'circle') {
        newObj = createCircleFromDrag(start, end, draft.layerId);
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

  // Inline text editing commit handler
  const handleCommitTextEdit = () => {
    if (!editingText || !activeProject) return;

    const trimmed = editingText.text.trim();

    if (trimmed.length === 0) {
      // Empty text confirmed: cancel creation or remove empty text object
      pushHistory(activeProject.objects);
      updateActiveProject((doc) => ({
        ...doc,
        objects: doc.objects.filter((o) => o.id !== editingText.objectId),
      }));
      clearSelection();
    } else {
      // Update text object
      pushHistory(activeProject.objects);
      updateActiveProject((doc) => ({
        ...doc,
        objects: doc.objects.map((o) =>
          o.id === editingText.objectId ? { ...o, text: editingText.text } : o
        ),
      }));
    }

    setEditingText(null);
  };

  // Textarea key handler
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommitTextEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (editingText?.isNew) {
        // Remove newly created text object on Escape
        updateActiveProject((doc) => ({
          ...doc,
          objects: doc.objects.filter((o) => o.id !== editingText.objectId),
        }));
        clearSelection();
      }
      setEditingText(null);
    }
  };

  // Drag start for objects in 'move' tool
  const handleObjectDragStart = (objId: string) => {
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

    if (stepPx < 6) return null;

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

  // Render Draft Shape Preview during drag creation (Rectangle, Circle)
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

    return null;
  };

  // Render Multi-point Polyline Session Preview
  const renderPolylinePreview = () => {
    if (!polylineSession || polylineSession.fixedPoints.length === 0) return null;

    const screenFixedPoints: number[] = [];
    polylineSession.fixedPoints.forEach((p) => {
      screenFixedPoints.push(p.x * viewport.scale + viewport.x, p.y * viewport.scale + viewport.y);
    });

    const isDashed = polylineSession.tool === 'dashed-line';
    const dashArray = isDashed ? [10, 6] : undefined;

    const lastFixed = polylineSession.fixedPoints[polylineSession.fixedPoints.length - 1];
    const preview = polylineSession.previewPoint || lastFixed;

    const lastScreenX = lastFixed.x * viewport.scale + viewport.x;
    const lastScreenY = lastFixed.y * viewport.scale + viewport.y;
    const previewScreenX = preview.x * viewport.scale + viewport.x;
    const previewScreenY = preview.y * viewport.scale + viewport.y;

    return (
      <Group listening={false}>
        {/* Fixed polyline segments */}
        {screenFixedPoints.length >= 4 && (
          <KonvaLine
            points={screenFixedPoints}
            stroke="#3b82f6"
            strokeWidth={3}
            dash={dashArray}
            listening={false}
          />
        )}

        {/* Dynamic preview segment to mouse cursor */}
        <KonvaLine
          points={[lastScreenX, lastScreenY, previewScreenX, previewScreenY]}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[6, 4]}
          opacity={0.8}
          listening={false}
        />

        {/* Fixed point handle circles */}
        {polylineSession.fixedPoints.map((p, idx) => (
          <Circle
            key={`pt-${idx}`}
            x={p.x * viewport.scale + viewport.x}
            y={p.y * viewport.scale + viewport.y}
            radius={4}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={1.5}
            listening={false}
          />
        ))}
      </Group>
    );
  };

  // Render Titles / Labels for Objects on Canvas
  const renderObjectTitle = (obj: CanvasObject) => {
    if (!obj.title || obj.title.trim().length === 0 || obj.showTitle === false) return null;

    let badgeX = obj.x * viewport.scale + viewport.x;
    let badgeY = obj.y * viewport.scale + viewport.y;

    if (obj.type === 'line') {
      const line = obj as LineObject;
      const worldPoints: PolylinePoint[] = [];
      for (let i = 0; i < line.points.length; i += 2) {
        worldPoints.push({
          x: obj.x + line.points[i],
          y: obj.y + line.points[i + 1],
        });
      }
      const mid = getPolylineMidpoint(worldPoints);
      badgeX = mid.x * viewport.scale + viewport.x;
      badgeY = mid.y * viewport.scale + viewport.y - 14;
    } else if (obj.type === 'rectangle') {
      const rect = obj as RectangleObject;
      badgeX = (obj.x + rect.width / 2) * viewport.scale + viewport.x;
      badgeY = obj.y * viewport.scale + viewport.y - 14;
    } else if (obj.type === 'circle') {
      const circ = obj as CircleObject;
      badgeX = obj.x * viewport.scale + viewport.x;
      badgeY = (obj.y - circ.radius) * viewport.scale + viewport.y - 14;
    } else if (obj.type === 'text') {
      if (obj.title === (obj as TextObject).text) return null;
      badgeY = obj.y * viewport.scale + viewport.y - 16;
    }

    const titleText = obj.title;
    const approxWidth = Math.max(36, titleText.length * 6 + 12);

    return (
      <Group key={`title-${obj.id}`} x={badgeX} y={badgeY} listening={false}>
        <Rect
          x={-approxWidth / 2}
          y={-10}
          width={approxWidth}
          height={18}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={1}
          cornerRadius={4}
          opacity={0.9}
        />
        <KonvaText
          x={-approxWidth / 2}
          y={-7}
          width={approxWidth}
          text={titleText}
          fontSize={10}
          fontFamily="sans-serif"
          fill="#e2e8f0"
          align="center"
        />
      </Group>
    );
  };

  // Cursor style class determination
  const getCursorStyle = () => {
    if (activeTool === 'pan' || isPanning || isSpacePressed) {
      return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    }
    if (activeTool === 'select') return 'cursor-default';
    if (activeTool === 'move') return 'cursor-move';
    if (['rectangle', 'circle', 'line', 'dashed-line'].includes(activeTool)) return 'cursor-crosshair';
    if (activeTool === 'text') return 'cursor-text';
    return 'cursor-default';
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-slate-950 relative overflow-hidden select-none ${getCursorStyle()}`}
    >
      {/* Floating Helper Banner during Polyline Creation */}
      {(polylineSession || activeTool === 'line' || activeTool === 'dashed-line') && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 border border-blue-500/50 text-blue-200 px-3 py-1.5 rounded-full text-[11px] font-medium shadow-lg backdrop-blur pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>{t('editor.instructions.polylineHelp')}</span>
        </div>
      )}

      {/* Inline Text Area Editor Overlay */}
      {editingText && (
        <textarea
          ref={textareaRef}
          value={editingText.text}
          onChange={(e) =>
            setEditingText((prev) => (prev ? { ...prev, text: e.target.value } : null))
          }
          onKeyDown={handleTextareaKeyDown}
          onBlur={handleCommitTextEdit}
          style={{
            position: 'absolute',
            left: `${editingText.x * viewport.scale + viewport.x}px`,
            top: `${editingText.y * viewport.scale + viewport.y}px`,
            fontSize: `${Math.max(12, editingText.fontSize * viewport.scale)}px`,
            fontFamily: editingText.fontFamily,
            color: editingText.fill === 'transparent' ? '#0f172a' : editingText.fill,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1.5px dashed #3b82f6',
            borderRadius: '4px',
            padding: '2px 6px',
            outline: 'none',
            resize: 'both',
            zIndex: 50,
            minWidth: '120px',
            minHeight: `${Math.max(12, editingText.fontSize * viewport.scale) * 1.5}px`,
          }}
        />
      )}

      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDblClick={handleStageDblClick}
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
              onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                if (obj.type === 'text') {
                  const txt = obj as TextObject;
                  setEditingText({
                    objectId: txt.id,
                    isNew: false,
                    initialText: txt.text,
                    text: txt.text,
                    x: txt.x,
                    y: txt.y,
                    fontSize: txt.fontSize,
                    fontFamily: txt.fontFamily,
                    fill: txt.fill,
                  });
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
                <React.Fragment key={obj.id}>
                  <Rect
                    {...commonProps}
                    width={rect.width * viewport.scale}
                    height={rect.height * viewport.scale}
                    fill={rect.fill}
                    stroke={isSelected ? '#3b82f6' : rect.stroke}
                    strokeWidth={isSelected ? Math.max(2, rect.strokeWidth * viewport.scale) : rect.strokeWidth * viewport.scale}
                    cornerRadius={2}
                  />
                  {renderObjectTitle(obj)}
                </React.Fragment>
              );
            }

            if (obj.type === 'circle') {
              const circ = obj as CircleObject;
              return (
                <React.Fragment key={obj.id}>
                  <Circle
                    {...commonProps}
                    radius={circ.radius * viewport.scale}
                    fill={circ.fill}
                    stroke={isSelected ? '#3b82f6' : circ.stroke}
                    strokeWidth={isSelected ? Math.max(2, circ.strokeWidth * viewport.scale) : circ.strokeWidth * viewport.scale}
                  />
                  {renderObjectTitle(obj)}
                </React.Fragment>
              );
            }

            if (obj.type === 'line') {
              const line = obj as LineObject;
              const scaledPoints = line.points.map((p) => p * viewport.scale);
              const isDashed = line.lineStyle === 'dashed' || line.name.toLowerCase().includes('dashed');
              return (
                <React.Fragment key={obj.id}>
                  <KonvaLine
                    {...commonProps}
                    points={scaledPoints}
                    stroke={isSelected ? '#3b82f6' : line.stroke}
                    strokeWidth={isSelected ? Math.max(3, line.strokeWidth * viewport.scale) : line.strokeWidth * viewport.scale}
                    dash={isDashed ? [10, 6] : undefined}
                  />
                  {renderObjectTitle(obj)}
                </React.Fragment>
              );
            }

            if (obj.type === 'text') {
              const txt = obj as TextObject;
              // If currently inline editing this text object, render with low opacity
              const isEditingThis = editingText?.objectId === obj.id;
              return (
                <React.Fragment key={obj.id}>
                  <KonvaText
                    {...commonProps}
                    text={txt.text}
                    fontSize={txt.fontSize * viewport.scale}
                    fontFamily={txt.fontFamily}
                    fill={isSelected ? '#3b82f6' : txt.fill}
                    align={txt.align}
                    opacity={isEditingThis ? 0.2 : txt.opacity}
                  />
                  {renderObjectTitle(obj)}
                </React.Fragment>
              );
            }

            return null;
          })}

          {/* Draft Preview Layer (Rectangle, Circle) */}
          {renderDraftPreview()}

          {/* Multi-point Polyline Preview Layer */}
          {renderPolylinePreview()}

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
