// src/features/drawing/index.ts
export { DrawingCanvas } from './components/DrawingCanvas'
export { DrawingLayer } from './components/DrawingLayer'
export { DrawingToolbar } from './components/DrawingToolbar'
export { StylePanel } from './components/StylePanel'
export { LayersPanel } from './components/LayersPanel'
export { ViewerModeToggle } from './components/ViewerModeToggle'
export { SurfaceDrawingSurface } from './components/SurfaceDrawingSurface'
export { SurfaceDrawingLayer } from './components/SurfaceDrawingLayer'
export { useDrawingStore } from './store/drawingStore'
export type {
  DrawElement,
  DrawElementType,
  DrawingDocument,
  ElementStyle,
  Point,
  SurfaceStroke,
  ToolId,
  Vec3,
} from './types'
