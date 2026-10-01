// src/features/anatomy/hooks/useSnapshotPreview.ts
import { useEffect, useState } from 'react'
import { canvasToBlob } from '../services/snapshot'
import type { CaptureFn, CaptureOptions } from '../types/snapshot'

interface PreviewState {
  url: string | null
  failed: boolean
}

/** Low-resolution live preview. Regenerates whenever an option that changes the picture changes. */
export function useSnapshotPreview(
  capture: CaptureFn | null,
  { includeLabels, transparent, watermark }: Omit<CaptureOptions, 'scale'>,
): PreviewState {
  const [state, setState] = useState<PreviewState>({ url: null, failed: false })

  useEffect(() => {
    if (!capture) return
    let cancelled = false
    let objectUrl: string | null = null

    void (async () => {
      try {
        const { canvas } = await capture({ scale: 1, includeLabels, transparent, watermark })
        if (cancelled) return
        const blob = await canvasToBlob(canvas)
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setState({ url: objectUrl, failed: false })
      } catch {
        if (!cancelled) setState((current) => ({ ...current, failed: true }))
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [capture, includeLabels, transparent, watermark])

  return state
}
