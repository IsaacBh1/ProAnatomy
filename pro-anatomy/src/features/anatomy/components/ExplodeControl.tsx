import { ArrowsOut } from '@phosphor-icons/react'
import { Pill, Slider } from '@/components/ui'

interface ExplodeControlProps {
  value: number
  onChange: (value: number) => void
}

export function ExplodeControl({ value, onChange }: ExplodeControlProps) {
  return (
    <Pill className="w-[min(289px,calc(100vw-2rem))] justify-center">
      <div className="flex h-8 shrink-0 items-center gap-1 pr-3 pl-3 md:pr-4">
        <ArrowsOut size={16} aria-hidden />
        <span className="text-sm">Explode</span>
      </div>
      <div className="min-w-0 flex-1 pr-3 md:w-[151px] md:flex-none md:pr-0">
        <Slider label="Explode amount" value={value} onValueChange={onChange} />
      </div>
    </Pill>
  )
}
