import { describe, it, expect } from 'vitest';
import {
  displayUnitToMillimeters,
  millimetersToDisplayUnit,
  snapToGrid,
  formatUnitValue,
} from '@inframap/editor-core';

describe('Unit Conversion Utilities', () => {
  it('converts display units to millimeters correctly', () => {
    expect(displayUnitToMillimeters(1, 'm')).toBe(1000);
    expect(displayUnitToMillimeters(2.5, 'cm')).toBe(25);
    expect(displayUnitToMillimeters(50, 'mm')).toBe(50);
  });

  it('converts millimeters to display units correctly', () => {
    expect(millimetersToDisplayUnit(1000, 'm')).toBe(1);
    expect(millimetersToDisplayUnit(25, 'cm')).toBe(2.5);
    expect(millimetersToDisplayUnit(50, 'mm')).toBe(50);
  });

  it('snaps values to the nearest grid step in mm', () => {
    expect(snapToGrid(23, 10)).toBe(20);
    expect(snapToGrid(27, 10)).toBe(30);
    expect(snapToGrid(25, 10)).toBe(30);
    expect(snapToGrid(500, 100)).toBe(500);
  });

  it('formats values with correct display unit text', () => {
    expect(formatUnitValue(1500, 'm')).toContain('1');
    expect(formatUnitValue(1500, 'm')).toContain('5 m');
    expect(formatUnitValue(25, 'cm')).toContain('2');
    expect(formatUnitValue(100, 'mm')).toBe('100 mm');
  });
});
