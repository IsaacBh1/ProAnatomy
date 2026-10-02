import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookmarkSimple,
  Crosshair,
  Heartbeat,
  MagnifyingGlass,
  PaintBrush,
  Tag,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { BrandLogo } from '@/components/layout'
import { useAuthStore } from '@/features/auth'
import heroImg from '@/assets/images/hero-img.png'
import { Counter, EASE, Reveal, revealItem, staggerContainer } from './components/motion'
import { FeatureCard } from './components/FeatureCard'

const FEATURES = [
  {
    icon: Heartbeat,
    title: 'Peel layer by layer',
    body: 'Sixteen body systems, each toggleable on its own. Explode the model apart, or fade a single system back in — the camera stays where you put it.',
  },
  {
    icon: MagnifyingGlass,
    title: 'Search any structure',
    body: 'Ctrl+K opens search. Pick a hit and the viewer un-hides it, turns its system back on, isolates it, and frames the camera in a single step.',
  },
  {
    icon: Crosshair,
    title: 'Isolate, compare, undo',
    body: 'Double-click to isolate, band-drag to grab a group, Ctrl+click to add to a selection. Every step lands on the Back stack — no dead ends.',
  },
  {
    icon: Tag,
    title: 'Callouts that stick',
    body: 'Pin a label to any structure. Callouts survive rotation, isolation, and system changes, and each one gets a chip so you can jump back to it.',
  },
  {
    icon: PaintBrush,
    title: 'Draw on screen or on the model',
    body: 'Flat marks that stay flat, or strokes that stick to the surface as you rotate. Lines, arrows, boxes, ellipses, text — all composited into the snapshot.',
  },
  {
    icon: BookmarkSimple,
    title: 'Presets and notes that travel',
    body: 'Group the structures you actually study, name the collection, and attach notes to any of them. Everything syncs to your account, not the model.',
  },
]

const HERO_MASK = 'linear-gradient(to top, transparent 0%, black 30%, black 100%)'

export function LandingPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-dvh bg-canvas text-content">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="sticky top-0 z-50 border-b border-border/60 bg-canvas/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link to="/" aria-label="ProAnatomy home">
            <BrandLogo className="w-[150px]" />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {['Features', 'How it works', 'Pricing'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-muted transition-colors hover:text-content"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button
                asChild
                className="h-9 rounded-full bg-content px-4 text-sm font-medium text-canvas hover:bg-content/85"
              >
                <Link to="/anatomy">Open viewer</Link>
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-content sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-content px-4 text-sm font-medium text-canvas transition-colors hover:bg-content/85"
                >
                  Get started
                  <ArrowRight size={14} weight="bold" aria-hidden />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      <section className="relative mx-auto w-full max-w-6xl px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-7">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
              className="max-w-[14ch] font-display text-display-lg font-medium tracking-tight text-balance"
            >
              See inside the body, layer by layer.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.18 }}
              className="max-w-lg text-display-body text-muted"
            >
              Peel sixteen body systems apart, isolate the structures you are studying, annotate on
              screen or on the surface, and keep every callout, note, and preset in your account.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.26 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                to={user ? '/anatomy' : '/signup'}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-content px-5 text-sm font-medium text-canvas transition-colors hover:bg-content/85"
              >
                {user ? 'Open the viewer' : 'Start exploring free'}
                <ArrowRight size={15} weight="bold" aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm text-content transition-colors hover:bg-surface"
              >
                See how it works
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
            className="relative mx-auto w-full max-w-[560px]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#863bff]/10 blur-[120px]"
            />
            <img
              src={heroImg}
              alt="Anatomical model shown in the ProAnatomy viewer"
              draggable={false}
              decoding="async"
              className="relative h-auto w-full object-contain select-none"
              style={{
                maskImage: HERO_MASK,
                WebkitMaskImage: HERO_MASK,
              }}
            />
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <motion.dl
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px px-6 md:grid-cols-4"
        >
          {[
            { to: 2000, suffix: '+', label: 'Anatomical structures' },
            { to: 16, label: 'Body systems' },
            { to: 2, label: 'Models — male & female' },
            { to: 4, suffix: '×', label: 'Screenshot resolution' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={revealItem}
              className="flex flex-col gap-1.5 py-10 md:py-14"
            >
              <dt className="font-display text-display-md font-medium tabular-nums">
                <Counter to={stat.to} suffix={stat.suffix} />
              </dt>
              <dd className="text-sm text-muted">{stat.label}</dd>
            </motion.div>
          ))}
        </motion.dl>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <Reveal className="mb-14 flex max-w-2xl flex-col gap-4">
          <h2 className="font-display text-display-lg font-medium tracking-tight text-balance">
            Everything the textbook leaves out.
          </h2>
          <p className="text-display-body text-muted">
            Built for the way anatomy is actually studied, one structure at a time, with everything
            else out of the way.
          </p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </section>

      <section id="how-it-works" className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
          <Reveal className="mb-16 flex max-w-2xl flex-col gap-4">
            <h2 className="font-display text-display-lg font-medium tracking-tight text-balance">
              Three steps, no tutorial.
            </h2>
            <p className="text-display-body text-muted">
              The viewer is built around the same verbs you already use: select, isolate, annotate.
            </p>
          </Reveal>

          <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
            {[
              {
                n: '01',
                title: 'Peel to the layer you need',
                body: 'Toggle a body system or drag the explode slider. The camera stays where you put it, so you never lose your place.',
              },
              {
                n: '02',
                title: 'Isolate what you are studying',
                body: 'Double-click a structure to isolate it, or band-drag a group. Everything else steps aside, and Back undoes it.',
              },
              {
                n: '03',
                title: 'Annotate, then keep it',
                body: 'Pin a callout, draw on the surface, write a note. Save the collection as a preset — it follows your account, not the model.',
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08}>
                <li className="flex flex-col gap-4 border-t border-border pt-6">
                  <span className="font-mono text-xs tracking-widest text-muted">{step.n}</span>
                  <h3 className="text-lg font-medium text-content">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-8 py-16 text-center md:px-16 md:py-24">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[#863bff]/10 blur-[120px]"
            />
            <div className="relative flex flex-col items-center gap-6">
              <h2 className="max-w-[18ch] font-display text-display-lg font-medium tracking-tight text-balance">
                See the whole body, Keep every note.
              </h2>
              <p className="max-w-lg text-display-body text-muted">
                A free account unlocks the viewer, both models, the drawing tools, and
                high-resolution screenshots. Your presets and notes stay in sync.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-content px-5 text-sm font-medium text-canvas transition-colors hover:bg-content/85"
                >
                  Create an account
                  <ArrowRight size={15} weight="bold" aria-hidden />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm text-content transition-colors hover:bg-surface-raised"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} ProAnatomy</p>
          <p>Built with React, Three.js, and a lot of small decisions.</p>
        </div>
      </footer>
    </div>
  )
}
