import { ProjectUnit } from '../types/project';

/**
 * Converts a value in display unit (mm, cm, or m) to canonical unit (mm).
 */
export function toCanonical(value: number, unit: ProjectUnit): number {
  if (isNaN(value)) return 0;
  let canonical: number;
  switch (unit) {
    case 'cm':
      canonical = value * 10;
      break;
    case 'm':
      canonical = value * 1000;
      break;
    case 'mm':
    default:
      canonical = value;
      break;
  }
  return roundPrecision(canonical);
}

/**
 * Converts a canonical value in mm to display unit (mm, cm, or m).
 */
export function fromCanonical(valueMm: number, unit: ProjectUnit): number {
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
 * Formats a canonical mm value into a readable display string with unit symbol.
 */
export function formatValueWithUnit(
  valueMm: number,
  unit: ProjectUnit,
  decimals = 2
): string {
  const val = fromCanonical(valueMm, unit);
  const formatted = val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ${unit}`;
}

/**
 * Rounds numbers to avoid floating point precision artifacts (e.g. 0.0000000000001).
 */
export function roundPrecision(num: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}
