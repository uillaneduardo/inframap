import {
  RectangleObject,
  CircleObject,
  LineObject,
} from '@inframap/domain';
import { createRectangleObject, createCircleObject, createLineObject } from './objects';

export interface DragPoint {
  x: number;
  y: number;
}

export interface NormalizedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawingSession {
  tool: 'rectangle' | 'circle' | 'line';
  layerId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Normalizes two points into top-left (x, y) and absolute width/height.
 * Works in all 4 drag quadrants (left->right, right->left, top->bottom, bottom->top).
 */
export function normalizeDragBounds(start: DragPoint, current: DragPoint): NormalizedBounds {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  return { x, y, width, height };
}

/**
 * Creates a Rectangle object from a drag gesture if dimensions meet minimum threshold.
 * Returns null if width or height is below minSizeMm.
 */
export function createRectangleFromDrag(
  start: DragPoint,
  current: DragPoint,
  layerId: string,
  options?: { minSizeMm?: number; name?: string }
): RectangleObject | null {
  const minSize = options?.minSizeMm ?? 2;
  const bounds = normalizeDragBounds(start, current);

  if (bounds.width < minSize || bounds.height < minSize) {
    return null;
  }

  return createRectangleObject(
    layerId,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    options?.name
  );
}

/**
 * Calculates radius from center point to edge point.
 */
export function calculateCircleRadius(center: DragPoint, edge: DragPoint): number {
  const dx = edge.x - center.x;
  const dy = edge.y - center.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Creates a Circle object from a center-to-edge drag gesture if radius meets minimum threshold.
 * Returns null if radius is below minRadiusMm.
 */
export function createCircleFromDrag(
  center: DragPoint,
  edge: DragPoint,
  layerId: string,
  options?: { minRadiusMm?: number; name?: string }
): CircleObject | null {
  const minRadius = options?.minRadiusMm ?? 2;
  const radius = calculateCircleRadius(center, edge);

  if (radius < minRadius) {
    return null;
  }

  return createCircleObject(layerId, center.x, center.y, radius, options?.name);
}

/**
 * Constrains line endpoint to common angles (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°).
 */
export function constrainLineAngle(start: DragPoint, current: DragPoint): DragPoint {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return current;

  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  // Snap angle to nearest 45 degrees
  const snappedDeg = Math.round(angleDeg / 45) * 45;
  const snappedRad = (snappedDeg * Math.PI) / 180;

  return {
    x: start.x + length * Math.cos(snappedRad),
    y: start.y + length * Math.sin(snappedRad),
  };
}

/**
 * Calculates line length.
 */
export function calculateLineLength(start: DragPoint, end: DragPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Creates a Line object from a start-to-end drag gesture if length meets minimum threshold.
 * Returns null if length is below minLengthMm.
 */
export function createLineFromDrag(
  start: DragPoint,
  end: DragPoint,
  layerId: string,
  options?: { minLengthMm?: number; name?: string; constrainAngle?: boolean }
): LineObject | null {
  const minLength = options?.minLengthMm ?? 2;
  const finalEnd = options?.constrainAngle ? constrainLineAngle(start, end) : end;
  const length = calculateLineLength(start, finalEnd);

  if (length < minLength) {
    return null;
  }

  const dx = finalEnd.x - start.x;
  const dy = finalEnd.y - start.y;

  return createLineObject(
    layerId,
    start.x,
    start.y,
    [0, 0, dx, dy],
    options?.name
  );
}
