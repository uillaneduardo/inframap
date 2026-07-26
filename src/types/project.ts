export type ProjectUnit = 'mm' | 'cm' | 'm';

export interface Project {
  id: string;
  name: string;
  description?: string;
  unit: ProjectUnit; // UI display unit: mm, cm, or m
  width: number; // width in UI project unit
  height: number; // height in UI project unit
  gridSize: number; // grid size in UI project unit
  canonicalWidth: number; // width in mm (canonical)
  canonicalHeight: number; // height in mm (canonical)
  canonicalGridSize: number; // grid size in mm (canonical)
  createdAt: string;
  updatedAt: string;
}
