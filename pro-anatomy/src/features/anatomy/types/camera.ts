export type Vec3 = readonly [x: number, y: number, z: number]

export interface CameraPose {
  position: Vec3
  target: Vec3
}

export type StandardView = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'side'

/** What the commands layer needs from the 3D view. Implemented inside the Canvas, used outside it. */
export interface CameraApi {
  getPose(): CameraPose
  animateTo(pose: CameraPose): void
  /** Frames these parts, keeping the current viewing direction. */
  focusOnParts(ids: ReadonlySet<string>): void
  /** Frames everything currently visible (skin excluded). */
  frameVisible(): void
  /** Pans so the visible parts are centred, keeping the zoom level. */
  recenterOnVisible(): void
  /** Multiplies the distance to the target by `factor`. < 1 zooms in, > 1 zooms out. Instant. */
  zoomBy(factor: number): void
  /** Frames everything visible again. Bound to Ctrl/Cmd+0. */
  resetView(): void
  /** Snaps to a standard anatomical view, keeping the current distance. */
  setStandardView(view: StandardView): void
}
