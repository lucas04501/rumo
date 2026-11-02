import { useState, type PointerEvent } from 'react'
import { formatDayShort, formatLongDate, formatShortDate } from '../lib/dates'
import { depthOf, smoothed, type Bucket, type DayPoint } from '../lib/evolution'

const WEEK_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const percentOf = (level: number) => Math.round(level * 100)

function describeDay({ date, level, done, total }: DayPoint): string {
  if (level === null) return `${formatLongDate(date)}: sem itens`
  return `${formatLongDate(date)}: ${done} de ${total}, ${percentOf(level)}%`
}

function readDay({ date, level, done, total }: DayPoint): string {
  if (level === null) return `${formatDayShort(date)}: sem itens`
  return `${formatDayShort(date)}: ${done} de ${total}, ${percentOf(level)}%`
}

type Plotted = DayPoint & { index: number; trend: number }

/** Curva suave entre os dias, com o controle na metade, para nunca passar de 0% ou 100%. */
function linePath(points: { x: number; y: number }[]): string {
  return points
    .map((point, position) => {
      if (position === 0) return `M ${point.x} ${point.y}`
      const previous = points[position - 1]
      const middle = (previous.x + point.x) / 2
      return `C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`
    })
    .join(' ')
}

type TideChartProps = {
  points: DayPoint[]
  /** Dias usados na média da curva. A leitura continua sendo a do dia tocado. */
  window: number
  onOpen: (date: string) => void
}

/** A maré ao longo do período. Tocar lê o dia, e dia sem itens fica de fora da linha. */
export function TideChart({ points, window, onOpen }: TideChartProps) {
  const [picked, setPicked] = useState<number | null>(null)

  const trend = smoothed(points, window)
  const plotted = points
    .map((point, index) => ({ ...point, index, trend: trend[index] }))
    .filter((point): point is Plotted => point.trend !== null)
  if (plotted.length === 0) return null

  const xOf = (index: number) => (points.length === 1 ? 50 : (index / (points.length - 1)) * 100)
  const yOf = (level: number) => 100 - level * 100
  const coordinates = plotted.map((point) => ({ x: xOf(point.index), y: yOf(point.trend) }))
  const line = linePath(coordinates)
  const area = `${line} L ${coordinates[coordinates.length - 1].x} 100 L ${coordinates[0].x} 100 Z`

  const selected = plotted.find((point) => point.index === picked) ?? plotted[plotted.length - 1]

  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    const nearest = plotted.reduce((best, point) =>
      Math.abs(xOf(point.index) / 100 - ratio) < Math.abs(xOf(best.index) / 100 - ratio) ? point : best,
    )
    setPicked(nearest.index)
  }

  return (
    <figure>
      <div className="chart-readout">
        <p className="min-w-0 text-[15px]">{readDay(selected)}</p>
        <button
          type="button"
          className="shrink-0 text-[15px] text-mist underline underline-offset-4"
          onClick={() => onOpen(selected.date)}
        >
          Abrir dia
        </button>
      </div>

      <div className="tide-chart" onPointerDown={pick} onPointerMove={pick} aria-hidden>
        <span className="chart-rule" style={{ top: '0%' }} data-label="100%" />
        <span className="chart-rule" style={{ top: '50%' }} data-label="50%" />
        <span className="chart-rule" style={{ top: '100%' }} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-reveal">
          <defs>
            <linearGradient id="tide-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--color-tide)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--color-tide)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {coordinates.length > 1 && (
            <>
              <path d={area} fill="url(#tide-fill)" />
              <path
                d={line}
                fill="none"
                stroke="var(--color-tide)"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </svg>
        <span className="chart-cross" style={{ left: `${xOf(selected.index)}%` }} />
        <span
          className="chart-dot"
          style={{ left: `${xOf(selected.index)}%`, top: `${yOf(selected.trend)}%` }}
        />
      </div>

      <figcaption className="mt-1.5 ml-10 flex justify-between gap-3 text-sm text-mist">
        <span aria-hidden>{formatShortDate(points[0].date)}</span>
        {window > 1 && <span>Curva: média de {window} dias</span>}
        <span aria-hidden>{formatShortDate(points[points.length - 1].date)}</span>
      </figcaption>

      <div className="sr-only">
        <table>
          <caption>Parte do dia concluída</caption>
          <tbody>
            {plotted.map((point) => (
              <tr key={point.date}>
                <td>{describeDay(point)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

type DepthChartProps = {
  weeks: (DayPoint | null)[][]
  today: string
  onOpen: (date: string) => void
}

/** Carta de profundidade: cada coluna é uma semana, e quanto mais fundo, mais foi cumprido. */
export function DepthChart({ weeks, today, onOpen }: DepthChartProps) {
  return (
    <figure>
      <div className="depth-chart">
        <div className="depth-letters" aria-hidden>
          {WEEK_LETTERS.map((letter, day) => (
            <span key={day}>{day % 2 === 1 ? letter : ''}</span>
          ))}
        </div>
        {weeks.map((week, column) => (
          <div key={column} className="depth-week">
            {week.map((day, row) =>
              day ? (
                <button
                  key={day.date}
                  type="button"
                  className="depth-cell"
                  data-depth={depthOf(day)}
                  data-today={day.date === today}
                  aria-label={describeDay(day)}
                  onClick={() => onOpen(day.date)}
                />
              ) : (
                <span key={row} className="depth-cell" data-depth="future" />
              ),
            )}
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex items-center justify-end gap-1.5 text-sm text-mist">
        Menos
        {['none', '1', '2', '3', 'full'].map((depth) => (
          <span key={depth} className="depth-cell depth-key" data-depth={depth} aria-hidden />
        ))}
        Mais
      </figcaption>
    </figure>
  )
}

type BarsProps = {
  items: Bucket[]
  label: string
}

/** Colunas simples: a última fica selecionada, e tocar lê as outras. */
export function Bars({ items, label }: BarsProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const max = Math.max(...items.map((item) => item.value), 1)
  const selected = items.find((item) => item.key === picked) ?? items[items.length - 1]
  const showEvery = items.length > 7 ? 3 : 1

  return (
    <figure>
      <p className="chart-readout text-[15px]">{selected.detail}</p>
      <div className="bars" role="group" aria-label={label}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className="bar"
            aria-label={item.detail}
            aria-pressed={item.key === selected.key}
            onClick={() => setPicked(item.key)}
          >
            <span
              className="bar-fill"
              data-empty={item.value === 0}
              style={{ height: `${Math.max(item.value / max, 0.02) * 100}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex gap-0.5 text-sm text-mist" aria-hidden>
        {items.map((item, position) => (
          <span key={item.key} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
            {(items.length - 1 - position) % showEvery === 0 ? item.label : ''}
          </span>
        ))}
      </div>
    </figure>
  )
}

/** Barra fina de proporção, para listas. Anel e medidor grande ficam de fora, de propósito. */
export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="meter"
    >
      <span className="meter-fill" style={{ transform: `scaleX(${value / 100})` }} />
    </div>
  )
}
