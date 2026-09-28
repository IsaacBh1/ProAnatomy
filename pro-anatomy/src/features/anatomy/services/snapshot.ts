import type { Sex } from '@/types/anatomy'

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image'))),
      'image/png',
    ),
  )
}

/** Safe filename without extension. Falls back when nothing usable is left. */
export function sanitizeFilename(raw: string, fallback: string): string {
  const cleaned = raw
    .trim()
    .replace(/\.png$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
  return cleaned || fallback
}

export function defaultSnapshotName(sex: Sex, date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
  const time = `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  return `pro-anatomy-${sex}-${day}-${time}`
}

export async function copyImageToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Copying images is not supported in this browser')
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
