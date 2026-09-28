// src/features/anatomy/hooks/useCaptureApi.ts
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useCaptureStore } from '../store/captureStore'
import { useLabelStore } from '../store/labelStore'
import { captureViewport } from '../utils/captureViewport'

/** Registers a renderer-bound capture function, so the dialog outside the Canvas can take snapshots. */
export function useCaptureApi(): void {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    useCaptureStore.getState().setCapture((options) =>
      captureViewport(
        { gl, scene, camera },
        options,
        options.includeLabels ? useLabelStore.getState().items : [],
      ),
    )
    return () => useCaptureStore.getState().setCapture(null)
  }, [gl, scene, camera])
}
