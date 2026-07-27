export type CanvasObjectType = 'rectangle' | 'circle' | 'line' | 'text';

export interface BaseCanvasObject {
  id: string;
  type: CanvasObjectType;
  name: string;
  title?: string;
  showTitle?: boolean;
  layerId: string;
  x: number; // In mm (canonical)
  y: number; // In mm (canonical)
  rotation: number; // Degrees 0-360
  locked: boolean;
  visible: boolean;
  stroke: string;
  strokeWidth: number; // In mm
  fill: string;
  opacity: number; // 0 to 1
  createdAt: string;
  updatedAt: string;
}

export interface RectangleObject extends BaseCanvasObject {
  type: 'rectangle';
  width: number; // In mm
  height: number; // In mm
}

export interface CircleObject extends BaseCanvasObject {
  type: 'circle';
  radius: number; // In mm
}

export interface LineObject extends BaseCanvasObject {
  type: 'line';
  points: number[]; // [x1, y1, x2, y2, x3, y3, ...] relative to (x, y) in mm
  lineStyle?: 'solid' | 'dashed';
}

export interface TextObject extends BaseCanvasObject {
  type: 'text';
  text: string;
  fontSize: number; // In mm
  fontFamily: string;
  align: 'left' | 'center' | 'right';
}

export type CanvasObject =
  | RectangleObject
  | CircleObject
  | LineObject
  | TextObject;
