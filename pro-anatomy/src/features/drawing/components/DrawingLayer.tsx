import { useDrawingStore } from '../store/drawingStore'
import { ElementRenderer } from './ElementRenderer'

/**
 * Every committed element plus the in-flight draft. Z-order = array order.
 * `pointerEvents: none` on the wrapper: hit-testing is done by the interaction hook
 * (via `findTopElementAt`), not by the SVG, so the shapes stay pure presentation.
 *
 * The element currently being edited (`editingTextId`) is skipped here — the inline
 * `<input>` renders its content instead, and showing both would double the text.
 */
export function DrawingLayer() {
  const elements = useDrawingStore((s) => s.elements)
  const draft = useDrawingStore((s) => s.draft)
  const editingTextId = useDrawingStore((s) => s.editingTextId)

  return (
    <g data-layer="elements" style={{ pointerEvents: 'none' }}>
      {elements.map((el) =>
        el.id === editingTextId ? null : <ElementRenderer key={el.id} element={el} />,
      )}
      {draft && <ElementRenderer element={draft} />}
    </g>
  )
}
