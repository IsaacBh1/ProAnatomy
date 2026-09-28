import { Chip, Pill } from '@/components/ui'
import { restoreAll } from '../services/viewCommands'
import { useViewStore } from '../store/viewStore'

export function HiddenBadge() {
  const count = useViewStore((state) => state.hiddenIds.size)
  if (count === 0) return null

  return (
    <div className="pointer-events-none absolute top-[86px] right-6 z-10">
      <Pill className="gap-2 pl-4" role="status">
        <span className="text-xs">{count} hidden</span>
        <Chip onClick={restoreAll}>Restore all</Chip>
      </Pill>
    </div>
  )
}
