import { motion, useTransform } from 'framer-motion'
import { useSectionScroll } from './motion'

const RINGS = [
  { r: 46, label: 'Skin' },
  { r: 82, label: 'Muscle' },
  { r: 118, label: 'Skeleton' },
  { r: 154, label: 'Vessels' },
  { r: 190, label: 'Nerves' },
  { r: 226, label: 'Organs' },
]

export function HeroLayers() {
  const { ref, progress } = useSectionScroll<HTMLDivElement>()

  return (
    <div ref={ref} className="relative grid size-full place-items-center">
      <svg
        viewBox="0 0 560 560"
        className="size-full max-h-[560px] w-auto"
        aria-hidden
        fill="none"
      >
        <defs>
          <radialGradient id="hero-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#863bff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#863bff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="280" cy="280" r="240" fill="url(#hero-core)" />

        {RINGS.map((ring, i) => (
          <Ring key={ring.label} r={ring.r} index={i} progress={progress} />
        ))}

        {/* Centre pip — the "you are here" of the diagram. */}
        <circle cx="280" cy="280" r="4" fill="currentColor" className="text-content" />
      </svg>
    </div>
  )
}

function Ring({
  r,
  index,
  progress,
}: {
  r: number
  index: number
  progress: ReturnType<typeof useSectionScroll>['progress']
}) {
  const start = 0.05 + index * 0.06
  const end = start + 0.25
  const opacity = useTransform(progress, [start, end], [0.08, 0.65])
  const scale = useTransform(progress, [start, end], [0.92, 1])

  return (
    <motion.circle
      cx="280"
      cy="280"
      r={r}
      stroke="currentColor"
      strokeWidth={1}
      className="text-content"
      style={{ opacity, scale, transformOrigin: '280px 280px' }}
    />
  )
}
