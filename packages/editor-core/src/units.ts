import { ProjectUnit } from '@inframap/domain';

/**
 * Converts a value in display unit (mm, cm, or m) to canonical unit (mm).
 */
export function displayUnitToMillimeters(value: number, unit: ProjectUnit): number {
  if (isNaN(value)) return 0;
  let mm: number;
  switch (unit) {
    case 'cm':
      mm = value * 10;
      break;
    case 'm':
      mm = value * 1000;
      break;
    case 'mm':
    default:
      mm = value;
      break;
  }
  return roundPrecision(mm);
}

/**
 * Converts a canonical value in mm to display unit (mm, cm, or m).
 */
export function millimetersToDisplayUnit(valueMm: number, unit: ProjectUnit): number {
  if (isNaN(valueMm)) return 0;
  let displayVal: number;
  switch (unit) {
    case 'cm':
      displayVal = valueMm / 10;
      break;
    case 'm':
      displayVal = valueMm / 1000;
      break;
    case 'mm':
    default:
      displayVal = valueMm;
      break;
  }
  return roundPrecision(displayVal);
}

/**
 * Transforms world (canonical mm) coordinate to screen pixel coordinate based on scale and pan offset.
 */
export function worldToScreen(worldMm: number, scale: number, panOffsetPx: number): number {
  return worldMm * scale + panOffsetPx;
}

/**
 * Transforms screen pixel coordinate to world (canonical mm) coordinate based on scale and pan offset.
 */
export function screenToWorld(screenPx: number, scale: number, panOffsetPx: number): number {
  if (scale === 0) return 0;
  return (screenPx - panOffsetPx) / scale;
}

/**
 * Snaps a canonical value in mm to the nearest grid step (also in mm).
 */
export function snapToGrid(valueMm: number, gridSizeMm: number): number {
  if (!gridSizeMm || gridSizeMm <= 0) return valueMm;
  return Math.round(valueMm / gridSizeMm) * gridSizeMm;
}

/**
 * Formats a canonical mm value into a human readable string with unit suffix.
 */
export function formatUnitValue(valueMm: number, unit: ProjectUnit, decimals = 2): string {
  const displayVal = millimetersToDisplayUnit(valueMm, unit);
  const formatted = displayVal.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ${unit}`;
}

export type ToolType =
  | 'select'
  | 'move'
  | 'pan'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'dashed-line'
  | 'text';

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export function exportStageToPng(canvasElement: HTMLCanvasElement, fileName: string): void {
  const dataUrl = canvasElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function roundPrecision(num: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}
