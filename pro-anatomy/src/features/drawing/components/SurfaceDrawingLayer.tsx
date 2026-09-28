// src/features/drawing/components/SurfaceDrawingLayer.tsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useResolvedTheme } from '@/hooks/useTheme'
import { useDrawingStore } from '../store/drawingStore'
import type { SurfaceStroke } from '../types'

/** Wakes up the demand-driven render loop whenever the surface store changes. */
function InvalidateOnChange() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => useDrawingStore.subscribe(() => invalidate()), [invalidate])
  return null
}

interface SurfaceLineProps {
  stroke: SurfaceStroke
  selected: boolean
  active: boolean
  accent: string
}

function SurfaceLine({ stroke, selected, active, accent }: SurfaceLineProps) {
  if (stroke.points.length < 2) return null

  const points = stroke.points.map((p) => [p[0], p[1], p[2]] as [number, number, number])
  const baseOpacity = active ? Math.min(1, stroke.style.opacity + 0.1) : stroke.style.opacity

  return (
    <>
      {selected && (
        // Selection halo — same geometry, wider and translucent, so the element's
        // own colour is never overwritten and the halo contrasts on both themes.
        <Line
          points={points}
          color={accent}
          lineWidth={stroke.style.strokeWidth * 2 + 8}
          transparent
          opacity={0.35}
          depthTest={false}
          depthWrite={false}
          renderOrder={997}
        />
      )}
      <Line
        points={points}
        color={stroke.style.stroke}
        lineWidth={stroke.style.strokeWidth * 2}
        transparent
        opacity={baseOpacity}
        // No depth test: strokes must stay visible over curved surfaces.
        depthTest={false}
        depthWrite={false}
        renderOrder={998}
      />
    </>
  )
}

/** Every committed surface stroke plus the in-flight one. */
export function SurfaceDrawingLayer() {
  const strokes = useDrawingStore((s) => s.surfaceStrokes)
  const active = useDrawingStore((s) => s.activeSurface)
  const selectedIds = useDrawingStore((s) => s.selectedIds)

  // The layer sits inside the Canvas, which doesn't re-render on theme change on
  // its own. Subscribing here keeps the selection accent in sync.
  const theme = useResolvedTheme()
  const accent = theme === 'dark' ? '#ffffff' : '#1a1d21'

  return (
    <>
      <InvalidateOnChange />
      {strokes.map((stroke) => (
        <SurfaceLine
          key={stroke.id}
          stroke={stroke}
          selected={selectedIds.has(stroke.id)}
          active={false}
          accent={accent}
        />
      ))}
      {active && <SurfaceLine stroke={active} selected={false} active accent={accent} />}
    </>
  )
}
