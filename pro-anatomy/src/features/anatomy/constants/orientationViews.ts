import type { StandardView } from '../types/camera'

export interface OrientationView {
  /** Ties the button to a `StandardView`. */
  id: StandardView
  /** Single letter shown on the button. */
  label: string
  /** Full name for aria-label and tooltip. */
  name: string
}

/** Display order in the vertical bar, top to bottom. */
export const ORIENTATION_VIEWS: readonly OrientationView[] = [
  { id: 'front', label: 'F', name: 'Front view' },
  { id: 'left', label: 'L', name: 'Left view' },
  { id: 'right', label: 'R', name: 'Right view' },
  { id: 'side', label: 'S', name: 'Side view (45°)' },
  { id: 'back', label: 'B', name: 'Back view' },
]
