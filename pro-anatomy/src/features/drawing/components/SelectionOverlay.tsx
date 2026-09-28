// src/features/drawing/components/SelectionOverlay.tsx
import { HANDLE_SIZE } from '../constants'
import { useDrawingStore } from '../store/drawingStore'
import { handlesOf, unionBbox } from '../utils/geometry'

/**
 * Visual-only overlay: dashed bounding box around the current selection, plus a
 * resize handle per control point of the (single) selected element. Handles are
 * not interactive in the DOM — `useDrawingInteractions` does the hit-testing
 * with `handlesOf()` so all pointer logic stays in one place.
 *
 * `pointerEvents: none` on the wrapper: the SVG must stay invisible to the
 * pointer so the WebGL canvas underneath keeps receiving gestures.
 */
export function SelectionOverlay() {
  const selectedIds = useDrawingStore((s) => s.selectedIds)
  const elements = useDrawingStore((s) => s.elements)

  if (selectedIds.size === 0) return null

  const selected = elements.filter((el) => selectedIds.has(el.id))
  if (selected.length === 0) return null

  const box = unionBbox(selected)
  const single = selected.length === 1 ? selected[0] : null

  return (
    <g data-layer="selection" style={{ pointerEvents: 'none' }}>
      {box && (
        <rect
          x={box.x - 3}
          y={box.y - 3}
          width={box.width + 6}
          height={box.height + 6}
          fill="none"
          stroke="var(--color-content)"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.75}
        />
      )}

      {single &&
        handlesOf(single).map((h) => (
          <rect
            key={h.id}
            x={h.x - HANDLE_SIZE / 2}
            y={h.y - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            rx={1.5}
            fill="var(--color-canvas)"
            stroke="var(--color-content)"
            strokeWidth={1.5}
          />
        ))}
    </g>
  )
}
