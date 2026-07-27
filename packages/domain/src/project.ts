import { Layer } from './layer';
import { CanvasObject } from './canvasObject';

export type ProjectUnit = 'mm' | 'cm' | 'm';

export interface ProjectSettings {
  unit: ProjectUnit;
  width: number; // Width in display unit
  height: number; // Height in display unit
  gridSize: number; // Grid size in display unit
  canonicalWidth: number; // Width in mm
  canonicalHeight: number; // Height in mm
  canonicalGridSize: number; // Grid size in mm
  snapToGrid: boolean;
  backgroundColor: string;
}

export interface ProjectSummary {
  id: string;
  organizationId: string | null;
  ownerId: string | null;
  name: string;
  description?: string;
  unit: ProjectUnit;
  canonicalWidth: number;
  canonicalHeight: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ProjectDocument extends ProjectSummary {
  schemaVersion: number;
  settings: ProjectSettings;
  layers: Layer[];
  objects: CanvasObject[];
  viewport?: {
    x: number;
    y: number;
    scale: number;
  };
}
