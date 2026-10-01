// src/features/landing/components/motion.tsx
import { motion, useInView, useMotionValue, useScroll, useSpring, type Variants } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Central easing. Fikri's reveals all share one curve — a soft ease-out that
 * settles rather than bounces. Keeping it in one place means every section
 * feels like it belongs to the same page.
 */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Parent variants for staggered children. Pair with `revealItem`. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

/** Child variant. Fades up 24px — enough to read as motion, small enough to feel calm. */
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * One-shot scroll reveal. `once: true` means it plays the first time the element
 * enters the viewport and never again — re-playing on every scroll past is the
 * single biggest tell of an amateur landing page.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Counter that animates 0 → `to` when scrolled into view.
 *
 * Uses a motion value + spring rather than `setInterval`, so the number eases
 * out instead of ticking linearly, and React only re-renders when the displayed
 * integer changes — not every frame.
 */
export function Counter({
  to,
  suffix = '',
  prefix = '',
  decimals = 0,
}: {
  to: number
  suffix?: string
  prefix?: string
  decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const value = useMotionValue(0)
  const spring = useSpring(value, { stiffness: 60, damping: 20 })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (inView) value.set(to)
  }, [inView, to, value])

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(v.toFixed(decimals)))
  }, [spring, decimals])

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

/**
 * Scroll-linked progress for a section. Returns a ref to attach and a 0→1
 * motion value tracking how far the section has scrolled through the viewport.
 */
export function useSectionScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const scroll = useScroll({ target: ref, offset: ['start end', 'end start'] })
  return { ref, progress: scroll.scrollYProgress }
}
