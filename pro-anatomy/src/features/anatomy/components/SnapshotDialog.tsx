import { useState } from 'react'
import { Copy, DownloadSimple } from '@phosphor-icons/react'
import { Button, CheckboxRow, Input, Modal, Select } from '@/components/ui'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { downloadBlob } from '@/utils/download'
import { useSnapshotPreview } from '../hooks/useSnapshotPreview'
import {
  canvasToBlob,
  copyImageToClipboard,
  defaultSnapshotName,
  sanitizeFilename,
} from '../services/snapshot'
import { useCaptureStore } from '../store/captureStore'
import type { CaptureOptions } from '../types/snapshot'

const RESOLUTIONS = [
  { value: '1', label: '1× (native)' },
  { value: '2', label: '2× (recommended)' },
  { value: '3', label: '3× (print quality)' },
  { value: '4', label: '4× (ultra)' },
]

interface Status {
  tone: 'ok' | 'warn' | 'error'
  message: string
}

function SnapshotForm({ onClose }: { onClose: () => void }) {
  const sex = useAnatomyStore((state) => state.sex)
  const showLabels = useAnatomyStore((state) => state.showLabels)
  const capture = useCaptureStore((state) => state.capture)

  const [options, setOptions] = useState<CaptureOptions>({
    scale: 2,
    includeLabels: true,
    transparent: false,
    watermark: true,
  })
  const [filename, setFilename] = useState(() => defaultSnapshotName(sex))
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)

  const preview = useSnapshotPreview(capture, options)
  const update = (patch: Partial<CaptureOptions>) => setOptions((c) => ({ ...c, ...patch }))

  const run = async (task: (blob: Blob) => Promise<void> | void, success: string) => {
    if (!capture) return
    setBusy(true)
    setStatus(null)
    try {
      const { canvas, warnings } = await capture(options)
      const blob = await canvasToBlob(canvas)
      await task(blob)
      if (warnings.length > 0) {
        setStatus({ tone: 'warn', message: `${success} — ${warnings.join(' ')}` })
      } else {
        setStatus({ tone: 'ok', message: success })
      }
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong',
      })
    } finally {
      setBusy(false)
    }
  }

  const download = () =>
    run((blob) => {
      const name = sanitizeFilename(filename, defaultSnapshotName(sex))
      downloadBlob(blob, `${name}.png`)
    }, 'Saved')

  return (
    <>
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Resolution</span>
          <Select
            value={String(options.scale)}
            onValueChange={(value) => update({ scale: Number(value) })}
            options={RESOLUTIONS}
          />
        </label>

        {showLabels && (
          <CheckboxRow
            emphasized
            label="Include labels"
            checked={options.includeLabels}
            onCheckedChange={(includeLabels) => update({ includeLabels })}
          />
        )}
        <CheckboxRow
          emphasized
          label="Transparent background"
          checked={options.transparent}
          onCheckedChange={(transparent) => update({ transparent })}
        />
        <CheckboxRow
          emphasized
          label="Watermark"
          checked={options.watermark}
          onCheckedChange={(watermark) => update({ watermark })}
        />

        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Filename</span>
          <Input
            value={filename}
            onChange={(event) => setFilename(event.target.value)}
            spellCheck={false}
            className="w-52 font-mono text-xs"
          />
        </label>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-canvas">
        {preview.url ? (
          <img src={preview.url} alt="Snapshot preview" className="size-full object-contain" />
        ) : (
          <p className="absolute inset-0 grid place-items-center text-xs text-muted">
            {preview.failed ? 'Preview failed' : 'Generating preview…'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <p
          role="status"
          className={cn(
            'mr-auto text-xs',
            status?.tone === 'error' && 'text-red-400',
            status?.tone === 'warn' && 'text-amber-400',
            (!status || status.tone === 'ok') && 'text-muted',
          )}
        >
          {status?.message}
        </p>
        <Button className="border border-border px-4" onClick={onClose}>
          Cancel
        </Button>
        <Button
          icon={Copy}
          className="border border-border"
          disabled={busy}
          onClick={() => void run(copyImageToClipboard, 'Copied to clipboard')}
        >
          Copy
        </Button>
        <Button
          icon={DownloadSimple}
          className="bg-content text-canvas hover:bg-content/85"
          disabled={busy}
          onClick={() => void download()}
        >
          {busy ? 'Rendering…' : 'Download PNG'}
        </Button>
      </div>
    </>
  )
}

export function SnapshotDialog() {
  const open = useUiStore((state) => state.snapshotOpen)
  const setOpen = useUiStore((state) => state.setSnapshotOpen)
  const close = () => setOpen(false)

  return (
    <Modal
      open={open}
      onClose={close}
      title="Capture screenshot"
      description="Render the current view at higher resolution. Annotations are included."
    >
      {open && <SnapshotForm onClose={close} />}
    </Modal>
  )
}
