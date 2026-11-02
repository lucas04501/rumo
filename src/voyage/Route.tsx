import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { buildRoute, buildVerticalRoute } from './geometry'

const WIDTH = 340
const HEIGHT = 58
const VERTICAL_WIDTH = 56
const SAIL_SECONDS = 1.6
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const
// O barco acompanha só parte da inclinação da linha, para nunca parecer virando.
const TILT = 0.55

type RouteProps = {
  /** Número de marcos. A rota tem uma estação a mais: a partida. */
  milestones: number
  reached: number
  label: string
  /** Só é chamado quando o barco avança, não ao desfazer um marco. */
  onArrive?: (station: number) => void
  /** Com altura de linha, a rota desce pela página, uma estação por linha. */
  rowHeight?: number
}

export function Route({ milestones, reached, label, onArrive, rowHeight }: RouteProps) {
  const route = useMemo(
    () =>
      rowHeight
        ? buildVerticalRoute(milestones + 1, rowHeight, VERTICAL_WIDTH)
        : buildRoute(WIDTH, HEIGHT),
    [milestones, rowHeight],
  )
  const width = rowHeight ? VERTICAL_WIDTH : WIDTH
  const height = rowHeight ? rowHeight * (milestones + 1) : HEIGHT
  const previous = useRef(reached)
  const reduceMotion = useReducedMotion()
  const boat = useRef<SVGGElement>(null)
  const wake = useRef<SVGPathElement>(null)
  const progress = useMotionValue(reached / milestones)
  const [docked, setDocked] = useState<number | null>(reached)
  const [hasSailed, setHasSailed] = useState(false)

  const arrive = useRef(onArrive)
  useEffect(() => {
    arrive.current = onArrive
  })

  const place = (t: number) => {
    const { x, y, angle } = route.pointAt(t)
    boat.current?.setAttribute('transform', `translate(${x} ${y}) rotate(${angle * TILT})`)
    wake.current?.setAttribute('stroke-dashoffset', String(route.total * (1 - t)))
  }

  useLayoutEffect(() => place(progress.get()))
  useMotionValueEvent(progress, 'change', place)

  useEffect(() => {
    const target = reached / milestones
    if (progress.get() === target) return

    const forward = reached > previous.current
    previous.current = reached

    setDocked(null)
    setHasSailed(forward)
    const controls = animate(progress, target, {
      duration: reduceMotion ? 0 : SAIL_SECONDS,
      ease: EASE_IN_OUT,
      onComplete: () => {
        setDocked(reached)
        if (forward) arrive.current?.(reached)
      },
    })
    return () => controls.stop()
  }, [reached, milestones, progress, reduceMotion])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={rowHeight ? 'absolute top-0 left-0 overflow-visible' : 'block h-auto w-full overflow-visible'}
      width={rowHeight ? width : undefined}
      height={rowHeight ? height : undefined}
      role="img"
      aria-label={label}
    >
      <path
        d={route.d}
        fill="none"
        stroke="rgb(233 243 241 / 0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <path
        ref={wake}
        d={route.d}
        fill="none"
        stroke="var(--color-tide)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={route.total}
      />
      {Array.from({ length: milestones + 1 }, (_, station) => {
        if (station === docked) return null
        const { x, y } = route.pointAt(station / milestones)
        return (
          <g key={station} transform={`translate(${x} ${y})`}>
            <Station
              kind={stationKind(station, reached, milestones)}
              pop={hasSailed && station === reached - 1}
            />
          </g>
        )
      })}
      <g ref={boat}>
        <g className="boat-bob">
          <path d="M-12 -3H12L8 5H-8Z" fill="var(--color-foam)" />
          <path d="M1 -5V-26L13 -5Z" fill="var(--color-foam)" />
          <path d="M-2 -5V-20L-11 -5Z" fill="var(--color-mist)" />
        </g>
      </g>
    </svg>
  )
}

type StationKind = 'port' | 'passed' | 'ahead' | 'destination'

function stationKind(station: number, reached: number, milestones: number): StationKind {
  if (station === 0) return 'port'
  if (station < reached) return 'passed'
  return station === milestones ? 'destination' : 'ahead'
}

function Station({ kind, pop }: { kind: StationKind; pop: boolean }) {
  if (kind === 'port') return <circle r="3.5" fill="var(--color-tide)" />

  if (kind === 'passed') {
    return (
      <g className={pop ? 'station-pop' : undefined}>
        <circle r="8" fill="var(--color-tide)" />
        <path
          d="M-3.5 0.2L-1 2.8L3.6 -2.4"
          fill="none"
          stroke="var(--color-tide-ink)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    )
  }

  return (
    <>
      <circle r="7" fill="var(--color-abyss)" stroke="rgb(233 243 241 / 0.55)" strokeWidth="1.5" />
      {kind === 'destination' && <circle r="3" fill="var(--color-sun)" />}
    </>
  )
}
