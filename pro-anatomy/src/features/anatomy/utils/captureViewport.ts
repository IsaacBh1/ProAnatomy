// src/features/anatomy/utils/captureViewport.ts
import { Vector2, type Camera, type Scene, type WebGLRenderer } from 'three'
import { readCssVar } from '@/utils/cssVar'
import type { LabelItem } from '../types/labels'
import type { CaptureOptions } from '../types/snapshot'
import { drawLabels, drawWatermark, type CanvasPalette } from './drawOverlays'

interface RenderContext {
  gl: WebGLRenderer
  scene: Scene
  camera: Camera
}

function readPalette(): CanvasPalette {
  return {
    text: readCssVar('--color-content', '#d0d0d0'),
    halo: readCssVar('--color-canvas', '#1e1e1e'),
    line: readCssVar('--color-muted', '#a0a0a0'),
    fontFamily: getComputedStyle(document.body).fontFamily || 'sans-serif',
  }
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load SVG for compositing'))
    img.src = src
  })

/**
 * Rasterises the drawing overlay onto the snapshot canvas. Reads the always-mounted
 * `[data-drawing-surface] svg`, strips the selection overlay (it's a UI affordance, not
 * content), then draws it at the snapshot's pixel size.
 *
 * Never throws: a compositing failure degrades to "3D only", which is still useful.
 */
async function compositeDrawings(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): Promise<void> {
  const wrapper = document.querySelector<HTMLElement>('[data-drawing-surface]')
  const svg = wrapper?.querySelector('svg')
  if (!svg) return

  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[data-layer="selection"]').forEach((el) => el.remove())

  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const xml = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const img = await loadImage(url)
    ctx.drawImage(img, 0, 0, width, height)
  } catch (err) {
    console.warn('[capture] drawing overlay compositing failed:', err)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Re-renders the scene at `options.scale` times the on-screen size and composites
 * background, drawing overlay, labels and watermark on top.
 *
 * IMPORTANT: the WebGL renderer is resized and then restored synchronously — before any
 * `await` — so a stalled compositing step can never leave the live canvas in a bad state.
 */
export async function captureViewport(
  { gl, scene, camera }: RenderContext,
  options: CaptureOptions,
  labels: readonly LabelItem[],
): Promise<HTMLCanvasElement> {
  const size = gl.getSize(new Vector2()) // CSS px
  const previousRatio = gl.getPixelRatio()
  const scale = Math.min(options.scale, gl.capabilities.maxTextureSize / Math.max(size.x, size.y))

  const source = gl.domElement
  const output = document.createElement('canvas')
  const ctx = output.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')

  const palette = readPalette()
  let ratio = 1

  try {
    gl.setPixelRatio(scale)
    gl.setSize(size.x, size.y, false) // false: leave the canvas' CSS size alone
    gl.render(scene, camera)

    output.width = source.width
    output.height = source.height
    ratio = output.width / size.x

    // The WebGL canvas is transparent: the page background is what made it look dark.
    if (!options.transparent) {
      ctx.fillStyle = palette.halo
      ctx.fillRect(0, 0, output.width, output.height)
    }
    ctx.drawImage(source, 0, 0)
  } finally {
    // Restore the live renderer synchronously, before any await.
    gl.setPixelRatio(previousRatio)
    gl.setSize(size.x, size.y, false)
    gl.render(scene, camera)
  }

  // --- Async compositing (renderer already back to normal) ---
  await compositeDrawings(ctx, output.width, output.height)

  if (labels.length > 0) drawLabels(ctx, labels, ratio, palette)
  if (options.watermark) drawWatermark(ctx, output.width, output.height, ratio, palette)

  return output
}
