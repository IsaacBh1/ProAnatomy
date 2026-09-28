import { useBandStore } from '../store/bandStore'

/** The dashed rubber-band rectangle. Coordinates are relative to the viewer, like the canvas. */
export function BandOverlay() {
  const rect = useBandStore((state) => state.rect)
  if (!rect) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[6] rounded-sm border border-dashed border-content/70 bg-content/10"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    />
  )
}
