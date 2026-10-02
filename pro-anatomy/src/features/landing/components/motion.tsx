import { motion, useInView, useMotionValue, useScroll, useSpring, type Variants } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export const EASE = [0.22, 1, 0.36, 1] as const

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}
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
export function useSectionScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const scroll = useScroll({ target: ref, offset: ['start end', 'end start'] })
  return { ref, progress: scroll.scrollYProgress }
}
