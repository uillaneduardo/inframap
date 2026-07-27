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

export interface PolylinePoint {
  x: number;
  y: number;
}

export interface PolylineDrawingSession {
  tool: 'line' | 'dashed-line';
  layerId: string;
  fixedPoints: PolylinePoint[];
  previewPoint: PolylinePoint | null;
}

/**
 * Appends a new point to the polyline fixed points.
 */
export function appendPolylinePoint(points: PolylinePoint[], point: PolylinePoint): PolylinePoint[] {
  return [...points, point];
}

/**
 * Removes the last fixed point from a list of polyline points.
 */
export function removeLastPolylinePoint(points: PolylinePoint[]): PolylinePoint[] {
  return points.slice(0, Math.max(0, points.length - 1));
}

/**
 * Removes consecutive duplicate points within a tolerance.
 */
export function deduplicateConsecutivePoints(points: PolylinePoint[]): PolylinePoint[] {
  if (points.length === 0) return [];
  const result: PolylinePoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 0.001) {
      result.push(curr);
    }
  }
  return result;
}

/**
 * Calculates total cumulative length of a multi-point line.
 */
export function getPolylineLength(points: PolylinePoint[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Validates if polyline points form a valid multi-point line meeting minimum length.
 */
export function isValidPolyline(points: PolylinePoint[], minimumLength = 2): boolean {
  const deduped = deduplicateConsecutivePoints(points);
  if (deduped.length < 2) return false;
  return getPolylineLength(deduped) >= minimumLength;
}

/**
 * Calculates the midpoint along 50% of the total cumulative length of a polyline.
 */
export function getPolylineMidpoint(points: PolylinePoint[]): PolylinePoint {
  const deduped = deduplicateConsecutivePoints(points);
  if (deduped.length === 0) return { x: 0, y: 0 };
  if (deduped.length === 1) return deduped[0];

  const totalLength = getPolylineLength(deduped);
  if (totalLength === 0) return deduped[0];

  const targetLength = totalLength / 2;
  let accumulated = 0;

  for (let i = 0; i < deduped.length - 1; i++) {
    const p1 = deduped[i];
    const p2 = deduped[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);

    if (accumulated + segLen >= targetLength) {
      const remaining = targetLength - accumulated;
      const ratio = segLen > 0 ? remaining / segLen : 0;
      return {
        x: p1.x + dx * ratio,
        y: p1.y + dy * ratio,
      };
    }
    accumulated += segLen;
  }

  return deduped[deduped.length - 1];
}

/**
 * Constrains a segment from origin to cursor to standard 45-degree angles.
 */
export function constrainSegmentAngle(origin: PolylinePoint, cursor: PolylinePoint): PolylinePoint {
  const dx = cursor.x - origin.x;
  const dy = cursor.y - origin.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return cursor;

  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;
  const snappedDeg = Math.round(angleDeg / 45) * 45;
  const snappedRad = (snappedDeg * Math.PI) / 180;

  return {
    x: origin.x + length * Math.cos(snappedRad),
    y: origin.y + length * Math.sin(snappedRad),
  };
}

/**
 * Creates a multi-point LineObject from world coordinate points.
 */
export function createLineFromPoints(
  layerId: string,
  fixedPoints: PolylinePoint[],
  lineStyle: 'solid' | 'dashed' = 'solid',
  options?: { name?: string; title?: string }
): LineObject | null {
  if (!isValidPolyline(fixedPoints)) return null;
  const deduped = deduplicateConsecutivePoints(fixedPoints);

  const originX = deduped[0].x;
  const originY = deduped[0].y;

  const relativePoints: number[] = [];
  deduped.forEach((p) => {
    relativePoints.push(p.x - originX, p.y - originY);
  });

  return createLineObject(
    layerId,
    originX,
    originY,
    relativePoints,
    options?.name,
    lineStyle,
    options?.title
  );
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
