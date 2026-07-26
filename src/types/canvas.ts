export type CanvasObjectType = 'rectangle' | 'circle' | 'line' | 'text';

export interface BaseCanvasObject {
  id: string;
  type: CanvasObjectType;
  name: string;
  x: number; // in mm (canonical)
  y: number; // in mm (canonical)
  rotation: number; // degrees
  layerId: string;
  locked: boolean;
  visible: boolean;
  stroke: string;
  strokeWidth: number; // in mm
  fill: string;
  opacity: number; // 0 to 1
  createdAt: string;
  updatedAt: string;
}

export interface RectangleObject extends BaseCanvasObject {
  type: 'rectangle';
  width: number; // in mm
  height: number; // in mm
}

export interface CircleObject extends BaseCanvasObject {
  type: 'circle';
  radius: number; // in mm
}

export interface LineObject extends BaseCanvasObject {
  type: 'line';
  points: [number, number, number, number]; // [x1, y1, x2, y2] in mm relative to (x, y)
}

export interface TextObject extends BaseCanvasObject {
  type: 'text';
  text: string;
  fontSize: number; // in mm
  fontFamily: string;
  align: 'left' | 'center' | 'right';
}

export type CanvasObject =
  | RectangleObject
  | CircleObject
  | LineObject
  | TextObject;
