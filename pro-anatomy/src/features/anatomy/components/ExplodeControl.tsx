import { ArrowsOut } from '@phosphor-icons/react'
import { Pill, Slider } from '@/components/ui'

interface ExplodeControlProps {
  value: number
  onChange: (value: number) => void
}

export function ExplodeControl({ value, onChange }: ExplodeControlProps) {
  return (
    <Pill className="w-[289px] justify-center">
      <div className="flex h-8 shrink-0 items-center gap-1 pr-4 pl-3">
        <ArrowsOut size={16} aria-hidden />
        <span className="text-sm">Explode</span>
      </div>
      <div className="w-[151px]">
        <Slider label="Explode amount" value={value} onValueChange={onChange} />
      </div>
    </Pill>
  )
}
