export interface CaptureOptions {
  /** Multiplier of the on-screen size. Clamped to what the GPU supports. */
  scale: number
  includeLabels: boolean
  transparent: boolean
  watermark: boolean
}

/**
 * What a capture produces: the rendered canvas plus any non-fatal problems the
 * caller should tell the user about (e.g. the drawing overlay couldn't be
 * serialised). The capture itself always succeeds — warnings are informational.
 */
export interface CaptureResult {
  canvas: HTMLCanvasElement
  warnings: readonly string[]
}

export type CaptureFn = (options: CaptureOptions) => Promise<CaptureResult>
