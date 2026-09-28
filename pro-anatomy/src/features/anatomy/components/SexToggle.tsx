import { GenderFemale, GenderMale, type Icon } from '@phosphor-icons/react'
import { Button, Pill } from '@/components/ui'
import type { Sex } from '@/types/anatomy'

const OPTIONS: readonly { value: Sex; label: string; icon: Icon }[] = [
  { value: 'male', label: 'Male', icon: GenderMale },
  { value: 'female', label: 'Female', icon: GenderFemale },
]

interface SexToggleProps {
  value: Sex
  onChange: (sex: Sex) => void
}

export function SexToggle({ value, onChange }: SexToggleProps) {
  return (
    <Pill role="radiogroup" aria-label="Anatomy model">
      {OPTIONS.map(({ value: optionValue, label, icon }) => (
        <Button
          key={optionValue}
          icon={icon}
          role="radio"
          aria-checked={value === optionValue}
          active={value === optionValue}
          onClick={() => onChange(optionValue)}
        >
          {label}
        </Button>
      ))}
    </Pill>
  )
}
