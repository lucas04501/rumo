import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import type { Snapshot } from '../data/types'
import { formatShortDate } from '../lib/dates'
import {
  buckets,
  dailySeries,
  depthWeeks,
  focusMinutesOn,
  formatMinutes,
  habitTrends,
  headline,
  patterns,
  periodDates,
  periodStats,
  RANGES,
  scoreDelta,
  SMOOTHING,
  taskFocus,
  tasksDoneOn,
  type Range,
} from '../lib/evolution'
import { goalProgress, paceSentence } from '../lib/goals'
import { indexSnapshot, withMilestones } from '../lib/progress'
import { DaySheet } from '../ui/DaySheet'
import { Bars, DepthChart, Meter, TideChart } from '../ui/EvolutionCharts'
import { iconFor } from '../ui/habitIcons'
import { Screen } from '../ui/Screen'
import { Ticker } from '../ui/Ticker'
import { workoutsOn } from '../lib/workouts'

const DEPTH_WEEKS = 13
const SECTION = 'mt-9 first:mt-0'
const HEADING = 'font-display text-xl font-semibold'

export function Evolucao() {
  const { date: today } = useDay()
  const { data: snapshot } = useSnapshot()
  const [range, setRange] = useState<Range>(7)
  const [opened, setOpened] = useState<string | null>(null)

  const view = useMemo(() => {
    if (!snapshot) return null
    const index = indexSnapshot(snapshot)
    const dates = periodDates(today, range)
    const stats = periodStats(snapshot, index, dates)
    const previous = periodStats(snapshot, index, periodDates(today, range, 1))
    return {
      index,
      dates,
      stats,
      delta: scoreDelta(stats, previous),
      series: dailySeries(index, dates),
      weeks: depthWeeks(index, today, DEPTH_WEEKS),
      trends: habitTrends(snapshot, today, range),
      lines: patterns(snapshot, index, today, dates),
      focus: taskFocus(index, dates),
    }
  }, [snapshot, today, range])

  if (!snapshot || !view) return null
  const { index, dates, stats, delta, series, weeks, trends, lines, focus } = view
  const hasFocus = stats.focusBlocks > 0

  return (
    <Screen>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3 lg:pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">Evolução</h1>
        <div className="segmented" role="group" aria-label="Período">
          {RANGES.map((days) => (
            <button
              key={days}
              type="button"
              aria-pressed={range === days}
              onClick={() => setRange(days)}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-16">
        <div>
          <section aria-labelledby="resumo" className={SECTION}>
            <h2 id="resumo" className="sr-only">
              Resumo do período
            </h2>
            <p className="evolution-score">
              {stats.score === null ? (
                '—'
              ) : (
                <>
                  <Ticker value={stats.score} />%
                </>
              )}
            </p>
            <p className="mt-1 text-[15px] text-mist">
              do combinado nos últimos {range} dias, sem contar hoje
            </p>
            <p className="mt-1 text-[17px]">{headline(stats.score, delta)}</p>

            <dl className="mt-4 divide-y divide-line">
              <Figure
                label="Hábitos"
                value={stats.habitRate === null ? '—' : `${stats.habitRate}%`}
                note={`${stats.habitDone} de ${stats.habitTotal}`}
              />
              <Figure label="Tarefas" value={`${stats.taskDone} de ${stats.taskTotal}`} />
              <Figure label="Dias perfeitos" value={String(stats.perfectDays)} />
              <Figure
                label="Foco"
                value={formatMinutes(stats.focusMinutes)}
                note={hasFocus ? `${stats.focusBlocks} blocos` : undefined}
              />
              <Figure
                label="XP ganho"
                value={`+${stats.xp.toLocaleString('pt-BR')}`}
                reward={stats.xp > 0}
              />
            </dl>
          </section>

          <section aria-labelledby="mare-do-periodo" className={SECTION}>
            <h2 id="mare-do-periodo" className={HEADING}>
              Maré do período
            </h2>
            {series.some((point) => point.level !== null) ? (
              <div className="mt-2">
                <TideChart
                  key={range}
                  points={series}
                  window={SMOOTHING[range]}
                  onOpen={setOpened}
                />
              </div>
            ) : (
              <p className="mt-2 max-w-[42ch] text-[17px] text-mist">
                A maré aparece aqui assim que houver hábitos ou tarefas nos dias.
              </p>
            )}
          </section>

          <section aria-labelledby="carta-de-consistencia" className={SECTION}>
            <h2 id="carta-de-consistencia" className={HEADING}>
              Carta de consistência
            </h2>
            <p className="text-[15px] text-mist">Últimas {DEPTH_WEEKS} semanas. Toque em um dia.</p>
            <div className="mt-3">
              <DepthChart weeks={weeks} today={today} onOpen={setOpened} />
            </div>
          </section>
        </div>

        <div className="mt-9 lg:mt-0">
          {lines.length > 0 && (
            <section aria-labelledby="padroes" className={SECTION}>
              <h2 id="padroes" className={HEADING}>
                O que os dados dizem
              </h2>
              <ul className="mt-2 grid gap-2 text-[17px]/snug">
                {lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          {trends.length > 0 && (
            <section aria-labelledby="habitos-evolucao" className={SECTION}>
              <h2 id="habitos-evolucao" className={HEADING}>
                Hábitos
              </h2>
              <ul className="mt-1 divide-y divide-line">
                {trends.map((trend) => (
                  <HabitLine key={trend.id} trend={trend} />
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="tarefas-evolucao" className={SECTION}>
            <h2 id="tarefas-evolucao" className={HEADING}>
              Tarefas concluídas
            </h2>
            <div className="mt-2">
              <Bars
                key={range}
                label="Tarefas concluídas"
                color="task"
                items={buckets(dates, tasksDoneOn(index), (value) =>
                  value === 1 ? '1 tarefa' : `${value} tarefas`,
                )}
              />
            </div>
            {(focus.high.total > 0 || focus.repeating.total > 0) && (
              <dl className="mt-3 divide-y divide-line">
                {focus.high.total > 0 && (
                  <Figure
                    label="Prioridade alta"
                    value={`${focus.high.done} de ${focus.high.total}`}
                  />
                )}
                {focus.repeating.total > 0 && (
                  <Figure
                    label="Que repetem"
                    value={`${focus.repeating.done} de ${focus.repeating.total}`}
                  />
                )}
              </dl>
            )}
          </section>

          {hasFocus && (
            <section aria-labelledby="foco-evolucao" className={SECTION}>
              <h2 id="foco-evolucao" className={HEADING}>
                Tempo de foco
              </h2>
              <div className="mt-2">
                <Bars
                  key={range}
                  label="Tempo de foco"
                  color="focus"
                  items={buckets(dates, focusMinutesOn(snapshot), formatMinutes)}
                />
              </div>
            </section>
          )}

          {dates.some((date) => workoutsOn(snapshot)(date) > 0) && (
            <section aria-labelledby="treinos-evolucao" className={SECTION}>
              <h2 id="treinos-evolucao" className={HEADING}>
                Treinos
              </h2>
              <div className="mt-2">
                <Bars
                  key={range}
                  label="Treinos concluídos"
                  color="workout"
                  items={buckets(dates, workoutsOn(snapshot), (value) =>
                    value === 1 ? '1 treino' : `${value} treinos`,
                  )}
                />
              </div>
            </section>
          )}

          <Goals snapshot={snapshot} today={today} />
        </div>
      </div>

      {opened && (
        <DaySheet
          key={opened}
          date={opened}
          today={today}
          snapshot={snapshot}
          onClosed={() => setOpened(null)}
        />
      )}
    </Screen>
  )
}

type FigureProps = { label: string; value: string; note?: string; reward?: boolean }

function Figure({ label, value, note, reward }: FigureProps) {
  return (
    <div className="flex min-h-12 items-baseline justify-between gap-4 py-2.5">
      <dt className="min-w-0 text-[17px] text-mist">{label}</dt>
      <dd className="shrink-0 text-right text-[17px]">
        {note && <span className="mr-2 text-[15px] text-mist">{note}</span>}
        <span className={`font-semibold ${reward ? 'text-sun' : ''}`}>{value}</span>
      </dd>
    </div>
  )
}

function deltaLabel(delta: number | null): string | null {
  if (delta === null) return null
  if (delta === 0) return 'igual'
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`
}

function HabitLine({ trend }: { trend: ReturnType<typeof habitTrends>[number] }) {
  const Icon = iconFor(trend.icon)
  const change = deltaLabel(trend.delta)

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <Icon size={19} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
        <span className="min-w-0 flex-1 text-[17px] wrap-anywhere">{trend.title}</span>
        {change && (
          <span className="shrink-0 text-[15px] text-mist" aria-label={`Variação: ${change} pontos`}>
            {change}
          </span>
        )}
        <span className="w-11 shrink-0 text-right text-[17px] font-semibold">
          {trend.rate === null ? '—' : `${trend.rate}%`}
        </span>
      </div>
      {trend.rate !== null && (
        <div className="mt-2 pl-[31px]">
          <Meter value={trend.rate} label={`${trend.title}: ${trend.rate}% no período`} />
        </div>
      )}
    </li>
  )
}

function Goals({ snapshot, today }: { snapshot: Snapshot; today: string }) {
  const goals = snapshot.goals
    .filter((goal) => goal.status === 'active')
    .map((goal) => withMilestones(goal, snapshot))
    .filter((goal) => goal.milestones.length > 0)

  if (goals.length === 0) return null

  return (
    <section aria-labelledby="metas-evolucao" className={SECTION}>
      <h2 id="metas-evolucao" className={HEADING}>
        Metas
      </h2>
      <ul className="mt-1 divide-y divide-line">
        {goals.map((goal, position) => {
          const progress = goalProgress(goal.milestones, goal.targetDate, today)
          const pace = paceSentence(progress)
          return (
            <li key={goal.id} className="py-3">
              <Link to={`/metas/${goal.id}`} className="block">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-[17px] wrap-anywhere">
                    {goal.title}
                    {position === 0 && <span className="text-[15px] text-mist"> · principal</span>}
                  </span>
                  <span className="shrink-0 text-[17px] font-semibold">{progress.percent}%</span>
                </span>
                <span className="mt-2 block">
                  <Meter value={progress.percent} label={`${goal.title}: ${progress.percent}%`} />
                </span>
                <span className="mt-1.5 block text-[15px] text-mist">
                  {pace ??
                    `${progress.reached} de ${progress.total} marcos${
                      goal.targetDate ? `, até ${formatShortDate(goal.targetDate)}` : ''
                    }`}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
