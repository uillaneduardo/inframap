export type ToolType = 'select' | 'pan' | 'rectangle' | 'circle' | 'line' | 'text';

export type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

export interface Viewport {
  x: number; // canvas pan offset X in pixels
  y: number; // canvas pan offset Y in pixels
  scale: number; // zoom scale factor (e.g. 1.0 = 100%)
}
