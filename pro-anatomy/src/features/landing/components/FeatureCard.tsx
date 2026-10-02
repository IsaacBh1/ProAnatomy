import { motion } from 'framer-motion'
import type { Icon } from '@phosphor-icons/react'
import { revealItem } from './motion'

interface FeatureCardProps {
  icon: Icon
  title: string
  body: string
}
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
