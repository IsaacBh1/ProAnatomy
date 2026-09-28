import type { CSSProperties } from 'react'
import { cn } from '@/utils/cn'

interface SliderProps {
  value: number
  onValueChange: (value: number) => void
  label: string
  min?: number
  max?: number
  className?: string
}

export function Slider({
  value,
  onValueChange,
  label,
  min = 0,
  max = 100,
  className,
}: SliderProps) {
  const progress = ((value - min) / (max - min)) * 100

  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={cn('slider', className)}
      style={{ '--slider-progress': `${progress}%` } as CSSProperties}
    />
  )
}
