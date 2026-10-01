// src/features/landing/components/FeatureCard.tsx
import { motion } from 'framer-motion'
import type { Icon } from '@phosphor-icons/react'
import { revealItem } from './motion'

interface FeatureCardProps {
  icon: Icon
  title: string
  body: string
}

/**
 * A feature tile. Reveals as part of a staggered grid (parent supplies the
 * variants), and lifts 2px on hover — the smallest amount of motion that still
 * reads as "this is interactive".
 */
export function FeatureCard({ icon: Icon, title, body }: FeatureCardProps) {
  return (
    <motion.article
      variants={revealItem}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-content/20"
    >
      <div className="grid size-10 place-items-center rounded-xl border border-border bg-surface-raised">
        <Icon size={18} aria-hidden className="text-content" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-medium text-content">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </motion.article>
  )
}
