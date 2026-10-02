import logoForDark from '@/assets/images/logo.svg'
import logoForLight from '@/assets/images/logo-light.svg'
import { useResolvedTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

interface BrandLogoProps {
  className?: string
}
export function BrandLogo({ className }: BrandLogoProps) {
  const theme = useResolvedTheme()
  const src = theme === 'dark' ? logoForDark : logoForLight

  return (
    <div
      role="img"
      aria-label="ProAnatomy"
      className={cn('w-36 max-w-full', className)}
    >
      <img
        src={src}
        alt=""
        className="block h-auto w-full select-none"
        draggable={false}
      />
    </div>
  )
}
