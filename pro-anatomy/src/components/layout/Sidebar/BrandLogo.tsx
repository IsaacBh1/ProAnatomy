import logoUrl from '@/assets/images/logo.svg'
import { cn } from '@/utils/cn'

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <div
      role="img"
      aria-label="ProAnatomy"
      className={cn('w-64 max-w-full', className)}
    >
      <img
        src={logoUrl}
        alt=""
        className="block h-auto w-full select-none"
        draggable={false}
      />
    </div>
  )
}
