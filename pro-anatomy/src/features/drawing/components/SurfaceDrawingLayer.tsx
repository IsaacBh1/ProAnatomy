// src/features/drawing/components/SurfaceDrawingLayer.tsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useDrawingStore } from '../store/drawingStore'
import type { SurfaceStroke } from '../types'

/** Wakes up the demand-driven render loop whenever the surface store changes. */
function InvalidateOnChange() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => useDrawingStore.subscribe(() => invalidate()), [invalidate])
  return null
}

function SurfaceLine({ stroke, active }: { stroke: SurfaceStroke; active: boolean }) {
  if (stroke.points.length < 2) return null
  return (
    <Line
      points={stroke.points.map((p) => [p[0], p[1], p[2]] as [number, number, number])}
      color={stroke.style.stroke}
      lineWidth={stroke.style.strokeWidth * 2}
      transparent
      opacity={active ? Math.min(1, stroke.style.opacity + 0.1) : stroke.style.opacity}
      // No depth test: strokes must stay visible over curved surfaces.
      depthTest={false}
      depthWrite={false}
      renderOrder={998}
    />
  )
}

/** Every committed surface stroke plus the in-flight one. */
export function SurfaceDrawingLayer() {
  const strokes = useDrawingStore((s) => s.surfaceStrokes)
  const active = useDrawingStore((s) => s.activeSurface)

  return (
    <>
      <InvalidateOnChange />
      {strokes.map((stroke) => (
        <SurfaceLine key={stroke.id} stroke={stroke} active={false} />
      ))}
      {active && <SurfaceLine stroke={active} active />}
    </>
  )
}
