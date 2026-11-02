import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { wavePath } from './geometry'

const CREST_HEIGHT = 44
const TILE_WIDTH = 1000

// Com o dia vazio resta um fio de água. Cheia, a maré para abaixo do topo para a crista seguir visível.
const LOWEST_PERCENT = 6
const HIGHEST_PERCENT = 90

const LAYERS = [
  { color: 'var(--color-sea-1)', phase: 0.4, seconds: 58, offset: 0, stiffness: 70, damping: 18 },
  { color: 'var(--color-sea-2)', phase: 2.3, seconds: 41, offset: 22, stiffness: 55, damping: 17 },
  { color: 'var(--color-sea-3)', phase: 4.1, seconds: 31, offset: 46, stiffness: 42, damping: 16 },
]

const percentFor = (level: number) => LOWEST_PERCENT + level * (HIGHEST_PERCENT - LOWEST_PERCENT)

export function Tide({ level }: { level: number }) {
  return (
    <div aria-hidden className="tide">
      {LAYERS.map((layer, index) => (
        <WaveLayer key={layer.phase} {...layer} level={level} reverse={index === 1} />
      ))}
    </div>
  )
}

type WaveLayerProps = (typeof LAYERS)[number] & { level: number; reverse: boolean }

function WaveLayer({ level, color, phase, seconds, offset, stiffness, damping, reverse }: WaveLayerProps) {
  const percent = useSpring(percentFor(level), { stiffness, damping })
  const transform = useTransform(
    percent,
    (value) => `translate3d(0, calc(${100 - value}% + ${offset}px), 0)`,
  )
  const { crest, body } = useMemo(() => wavePath(TILE_WIDTH, CREST_HEIGHT, phase), [phase])

  useEffect(() => percent.set(percentFor(level)), [percent, level])

  return (
    <motion.div className="tide-layer" style={{ transform, background: color }}>
      <div
        className="tide-crest"
        style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        <svg
          viewBox={`0 0 ${TILE_WIDTH * 2} ${CREST_HEIGHT}`}
          preserveAspectRatio="none"
          width="100%"
          height={CREST_HEIGHT}
        >
          <path d={body} fill={color} />
          <path
            d={crest}
            fill="none"
            stroke="var(--color-crest)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </motion.div>
  )
}
