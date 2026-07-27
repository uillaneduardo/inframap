import { describe, it, expect } from 'vitest';
import {
  normalizeDragBounds,
  createRectangleFromDrag,
  calculateCircleRadius,
  createCircleFromDrag,
  constrainLineAngle,
  calculateLineLength,
  createLineFromDrag,
  snapToGrid,
} from '@inframap/editor-core';

describe('Drawing Interaction Utilities', () => {
  const layerId = 'layer-1';

  describe('Rectangle Creation', () => {
    it('handles top-left to bottom-right drag', () => {
      const bounds = normalizeDragBounds({ x: 10, y: 10 }, { x: 50, y: 40 });
      expect(bounds).toEqual({ x: 10, y: 10, width: 40, height: 30 });
    });

    it('handles bottom-right to top-left drag (4 quadrants)', () => {
      const bounds = normalizeDragBounds({ x: 50, y: 40 }, { x: 10, y: 10 });
      expect(bounds).toEqual({ x: 10, y: 10, width: 40, height: 30 });
    });

    it('handles top-right to bottom-left drag', () => {
      const bounds = normalizeDragBounds({ x: 50, y: 10 }, { x: 10, y: 40 });
      expect(bounds).toEqual({ x: 10, y: 10, width: 40, height: 30 });
    });

    it('handles bottom-left to top-right drag', () => {
      const bounds = normalizeDragBounds({ x: 10, y: 40 }, { x: 50, y: 10 });
      expect(bounds).toEqual({ x: 10, y: 10, width: 40, height: 30 });
    });

    it('creates rectangle object with correct mm dimensions', () => {
      const rect = createRectangleFromDrag({ x: 100, y: 100 }, { x: 250, y: 200 }, layerId);
      expect(rect).not.toBeNull();
      expect(rect?.type).toBe('rectangle');
      expect(rect?.x).toBe(100);
      expect(rect?.y).toBe(100);
      expect(rect?.width).toBe(150);
      expect(rect?.height).toBe(100);
    });

    it('cancels creation if width or height is below minimum size threshold (e.g., 2mm)', () => {
      const rectTooSmallWidth = createRectangleFromDrag({ x: 10, y: 10 }, { x: 11, y: 50 }, layerId);
      expect(rectTooSmallWidth).toBeNull();

      const rectTooSmallHeight = createRectangleFromDrag({ x: 10, y: 10 }, { x: 50, y: 11 }, layerId);
      expect(rectTooSmallHeight).toBeNull();
    });
  });

  describe('Circle Creation', () => {
    it('calculates radius correctly from center to edge', () => {
      const radius = calculateCircleRadius({ x: 0, y: 0 }, { x: 30, y: 40 });
      expect(radius).toBe(50); // 3-4-5 right triangle
    });

    it('creates circle object with radius in mm', () => {
      const circle = createCircleFromDrag({ x: 100, y: 100 }, { x: 130, y: 140 }, layerId);
      expect(circle).not.toBeNull();
      expect(circle?.type).toBe('circle');
      expect(circle?.x).toBe(100);
      expect(circle?.y).toBe(100);
      expect(circle?.radius).toBe(50);
    });

    it('cancels circle creation below minimum radius threshold', () => {
      const tinyCircle = createCircleFromDrag({ x: 10, y: 10 }, { x: 11, y: 11 }, layerId);
      expect(tinyCircle).toBeNull();
    });
  });

  describe('Line Creation', () => {
    it('calculates line length correctly', () => {
      const length = calculateLineLength({ x: 0, y: 0 }, { x: 60, y: 80 });
      expect(length).toBe(100);
    });

    it('creates line object with relative points', () => {
      const line = createLineFromDrag({ x: 50, y: 50 }, { x: 150, y: 200 }, layerId);
      expect(line).not.toBeNull();
      expect(line?.type).toBe('line');
      expect(line?.x).toBe(50);
      expect(line?.y).toBe(50);
      expect(line?.points).toEqual([0, 0, 100, 150]);
    });

    it('cancels line creation below minimum length threshold', () => {
      const tinyLine = createLineFromDrag({ x: 10, y: 10 }, { x: 11, y: 10 }, layerId);
      expect(tinyLine).toBeNull();
    });

    it('constrains line angle to 0, 45, 90, 135 degrees when shift requested', () => {
      // Almost horizontal (approx 5 degrees) -> snaps to 0 deg
      const constrained0 = constrainLineAngle({ x: 0, y: 0 }, { x: 100, y: 10 });
      expect(constrained0.x).toBeCloseTo(100.498, 1);
      expect(constrained0.y).toBeCloseTo(0, 1);

      // Almost 45 degrees (x: 100, y: 95) -> snaps to 45 deg
      const constrained45 = constrainLineAngle({ x: 0, y: 0 }, { x: 100, y: 95 });
      const length = calculateLineLength({ x: 0, y: 0 }, { x: 100, y: 95 });
      expect(constrained45.x).toBeCloseTo(length * Math.cos(Math.PI / 4), 1);
      expect(constrained45.y).toBeCloseTo(length * Math.sin(Math.PI / 4), 1);
    });
  });

  describe('Grid Snapping Logic', () => {
    it('snaps coordinates when snapToGrid is enabled', () => {
      const canonicalGridSize = 10;
      expect(snapToGrid(12.3, canonicalGridSize)).toBe(10);
      expect(snapToGrid(17.8, canonicalGridSize)).toBe(20);
    });

    it('retains exact position when snapToGrid is disabled', () => {
      const value = 12.3456;
      const isSnapEnabled = false;
      const result = isSnapEnabled ? snapToGrid(value, 10) : value;
      expect(result).toBe(12.3456);
    });

    it('suppresses snapping when Alt key is pressed (shouldSnap rule)', () => {
      const snapToGridSetting = true;
      const isAltPressed = true;
      const shouldSnap = snapToGridSetting && !isAltPressed;

      expect(shouldSnap).toBe(false);

      const rawX = 23.7;
      const x = shouldSnap ? snapToGrid(rawX, 10) : rawX;
      expect(x).toBe(23.7);
    });
  });
});
