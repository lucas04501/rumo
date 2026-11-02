import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, type ReactNode } from 'react'
import type { Celebration } from '../data/DayProvider'
import { wavePath } from './geometry'

const HOLD_MS = 3000
const CREST_HEIGHT = 64
const TILE_WIDTH = 1000
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

const SWEEP = {
  hidden: { transform: 'translate3d(0, 112%, 0)' },
  shown: { transform: 'translate3d(0, 0%, 0)' },
  gone: { transform: 'translate3d(0, -118%, 0)' },
}

const FADE = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
  gone: { opacity: 0 },
}

const LAYERS = [
  { top: 'var(--color-sea-3)', bottom: 'var(--color-sea-3)', phase: 2.6, delay: 0 },
  { top: 'var(--color-wash-mid)', bottom: 'var(--color-wash-mid)', phase: 4.2, delay: 0.09 },
  { top: 'var(--color-wash)', bottom: 'var(--color-sea-3)', phase: 1.1, delay: 0.18 },
]

type WaveWashProps = {
  celebration: Celebration | null
  onDone: () => void
}

/** Onda que cobre a tela nos grandes momentos. Rara de propósito. */
export function WaveWash({ celebration, onDone }: WaveWashProps) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!celebration) return
    const timer = setTimeout(onDone, HOLD_MS)
    return () => clearTimeout(timer)
  }, [celebration, onDone])

  return (
    <AnimatePresence>
      {celebration && (
        <motion.button
          type="button"
          className="wash"
          aria-label={`${celebration.title}. ${celebration.detail} Toque para fechar.`}
          onClick={onDone}
          initial="hidden"
          animate="shown"
          exit="gone"
        >
          {LAYERS.map((layer) => (
            <WashLayer key={layer.phase} {...layer} variants={reduceMotion ? FADE : SWEEP}>
              {layer.delay === 0.18 && <Message celebration={celebration} />}
            </WashLayer>
          ))}
        </motion.button>
      )}
    </AnimatePresence>
  )
}

type WashLayerProps = (typeof LAYERS)[number] & {
  variants: typeof SWEEP | typeof FADE
  children: ReactNode
}

function WashLayer({ top, bottom, phase, delay, variants, children }: WashLayerProps) {
  const { body } = useMemo(() => wavePath(TILE_WIDTH, CREST_HEIGHT, phase), [phase])

  const crestProps = {
    viewBox: `0 0 ${TILE_WIDTH * 2} ${CREST_HEIGHT}`,
    preserveAspectRatio: 'none',
    height: CREST_HEIGHT,
    'aria-hidden': true,
  } as const

  return (
    <motion.span
      className="wash-layer"
      style={{ background: `linear-gradient(${top}, ${bottom})` }}
      variants={variants}
      transition={{ duration: 0.85, delay, ease: EASE_DRAWER }}
    >
      <svg className="wash-crest wash-crest-top" {...crestProps}>
        <path d={body} fill={top} />
      </svg>
      <svg className="wash-crest wash-crest-bottom" {...crestProps}>
        <path d={body} fill={bottom} />
      </svg>
      {children}
    </motion.span>
  )
}

function Message({ celebration }: { celebration: Celebration }) {
  return (
    <span className="wash-content">
      <motion.span
        className="wash-sun"
        initial={{ opacity: 0, transform: 'translateY(40px)' }}
        animate={{ opacity: 1, transform: 'translateY(0)' }}
        transition={{ delay: 0.55, duration: 1, ease: EASE_DRAWER }}
      />
      <motion.span
        className="block font-display text-5xl/none font-semibold tracking-[-0.02em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.45 }}
      >
        {celebration.title}
      </motion.span>
      <motion.span
        className="mt-3 block text-lg text-sun"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.45 }}
      >
        {celebration.detail}
      </motion.span>
    </span>
  )
}
