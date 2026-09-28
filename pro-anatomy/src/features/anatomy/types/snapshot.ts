// src/features/anatomy/types/snapshot.ts
export interface CaptureOptions {
  /** Multiplier of the on-screen size. Clamped to what the GPU supports. */
  scale: number
  includeLabels: boolean
  transparent: boolean
  watermark: boolean
}

/**
 * Renders the current view into a new canvas.
 *
 * Async because the drawing overlay is composited from a serialised SVG → Image, which
 * resolves on the microtask queue. Everything else (WebGL capture) is still synchronous.
 */
export type CaptureFn = (options: CaptureOptions) => Promise<HTMLCanvasElement>
