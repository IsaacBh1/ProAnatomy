export type LabelSide = 'left' | 'right'

export interface ViewportSize {
  width: number
  height: number
}

/** A part projected onto the screen, before layout. Higher priority wins when there are too many. */
export interface LabelAnchor {
  id: string
  name: string
  x: number
  y: number
  priority: number
  /** Distance to the camera; nearer wins ties. */
  distance: number
}

/** A laid-out label: the dot at (anchorX, anchorY), the text on the row at labelY. */
export interface LabelItem {
  id: string
  name: string
  side: LabelSide
  anchorX: number
  anchorY: number
  labelY: number
  /** True when the user pinned this label. Rendered with emphasis. */
  pinned?: boolean
}
