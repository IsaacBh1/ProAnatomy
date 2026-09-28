import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * Keeps the demand-driven render loop awake while auto-rotation is on.
 * <Canvas frameloop="demand"> only renders on request; without this the frame callback that
 * applies the OrbitControls `autoRotate` delta would never run.
 */
export function useAutoRotateDriver(enabled: boolean): void {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!enabled) return
    let frame = 0
    const tick = () => {
      invalidate()
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [enabled, invalidate])
}
