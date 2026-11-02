import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import type { Snapshot } from '../data/types'
import { addDays, formatLongDate, weekOf } from '../lib/dates'
import { calendarMarks } from '../lib/dayReport'
import { monthGrid, monthInsights, monthName, monthOf, shiftMonth } from '../lib/month'
import { dayProgress, indexedTasks, indexSnapshot, type SnapshotIndex } from '../lib/progress'
import { DaySheet } from '../ui/DaySheet'
import { Screen } from '../ui/Screen'

const WEEK_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type View = 'mes' | 'semana'

export function Mes() {
  const { date: today } = useDay()
  const { data: snapshot } = useSnapshot()
  const [view, setView] = useState<View>('mes')
  const [month, setMonth] = useState(() => monthOf(today))
  const [weekStart, setWeekStart] = useState(() => weekOf(today)[0])
  const [opened, setOpened] = useState<string | null>(null)

  const index = useMemo(() => (snapshot ? indexSnapshot(snapshot) : null), [snapshot])
  if (!snapshot || !index) return null

  return (
    <Screen>
      <div className="flex items-center justify-between gap-4 pt-3 lg:pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">
          {view === 'mes' ? 'Mês' : 'Semana'}
        </h1>
        <div className="segmented" role="group" aria-label="Visualização">
          <button type="button" aria-pressed={view === 'mes'} onClick={() => setView('mes')}>
            Mês
          </button>
          <button type="button" aria-pressed={view === 'semana'} onClick={() => setView('semana')}>
            Semana
          </button>
        </div>
      </div>

      {view === 'mes' ? (
        <MonthView
          month={month}
          today={today}
          snapshot={snapshot}
          index={index}
          onMonth={setMonth}
          onOpen={setOpened}
        />
      ) : (
        <WeekView
          weekStart={weekStart}
          today={today}
          snapshot={snapshot}
          index={index}
          onWeek={setWeekStart}
          onOpen={setOpened}
        />
      )}

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

type Stepper = { label: string; previous: string; next: string; onPrevious: () => void; onNext: () => void }

function Step({ label, previous, next, onPrevious, onNext }: Stepper) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <button type="button" className="icon-button -ml-2.5" aria-label={previous} onClick={onPrevious}>
        <ChevronLeft size={22} strokeWidth={1.75} aria-hidden />
      </button>
      <p className="font-display text-xl font-semibold">{label}</p>
      <button type="button" className="icon-button -mr-2.5" aria-label={next} onClick={onNext}>
        <ChevronRight size={22} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}

type MonthViewProps = {
  month: string
  today: string
  snapshot: Snapshot
  index: SnapshotIndex
  onMonth: (month: string) => void
  onOpen: (date: string) => void
}

function MonthView({ month, today, snapshot, index, onMonth, onOpen }: MonthViewProps) {
  const name = monthName(month)
  const label = `${name[0].toUpperCase()}${name.slice(1)} de ${month.slice(0, 4)}`
  const insights = monthInsights(snapshot, month, today)
  const completed = new Set(snapshot.days.filter((day) => day.completedAt).map((day) => day.date))
  const { noted, focused } = calendarMarks(snapshot)

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-16">
      <div>
        <Step
          label={label}
          previous="Mês anterior"
          next="Próximo mês"
          onPrevious={() => onMonth(shiftMonth(month, -1))}
          onNext={() => onMonth(shiftMonth(month, 1))}
        />

        <div className="cal-grid mt-2" aria-hidden>
          {WEEK_LETTERS.map((letter, day) => (
            <span key={day} className="text-center text-sm text-mist">
              {letter}
            </span>
          ))}
        </div>

        <div className="cal-grid mt-1.5">
          {monthGrid(month).map((date, position) => {
            if (!date) return <span key={`vazio-${position}`} />

            const progress = dayProgress(index, date)
            const done = completed.has(date)
            const description = done
              ? 'dia concluído'
              : progress.total > 0
                ? `${progress.done} de ${progress.total} concluídos`
                : 'sem itens'

            return (
              <button
                key={date}
                type="button"
                className="cal-day"
                data-done={done}
                data-today={date === today}
                data-future={date > today}
                aria-label={`${formatLongDate(date)}, ${description}${
                  noted.has(date) ? ', com anotação' : ''
                }${focused.has(date) ? ', com foco' : ''}`}
                onClick={() => onOpen(date)}
              >
                {!done && progress.level > 0 && (
                  <span className="cal-fill" style={{ transform: `scaleY(${progress.level})` }} />
                )}
                <span className="cal-number">{Number(date.slice(8))}</span>
                {(noted.has(date) || focused.has(date)) && (
                  <span className="cal-marks" aria-hidden>
                    {noted.has(date) && <i data-kind="note" />}
                    {focused.has(date) && <i data-kind="focus" />}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 self-start lg:mt-[76px]">
        {insights.length > 0 && (
          <ul className="grid gap-1 text-[17px]">
            {insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <p className="mt-4 flex items-center gap-4 text-sm text-mist">
          <span className="flex items-center gap-1.5">
            <span className="cal-key" data-kind="note" aria-hidden /> Anotação
          </span>
          <span className="flex items-center gap-1.5">
            <span className="cal-key" data-kind="focus" aria-hidden /> Foco
          </span>
        </p>
      </div>
    </div>
  )
}

type WeekViewProps = {
  weekStart: string
  today: string
  snapshot: Snapshot
  index: SnapshotIndex
  onWeek: (date: string) => void
  onOpen: (date: string) => void
}

function WeekView({ weekStart, today, snapshot, index, onWeek, onOpen }: WeekViewProps) {
  const days = weekOf(weekStart)
  const completed = new Set(snapshot.days.filter((day) => day.completedAt).map((day) => day.date))
  const { noted, focused } = calendarMarks(snapshot)
  const label = `${days[0].slice(8)}/${days[0].slice(5, 7)} a ${days[6].slice(8)}/${days[6].slice(5, 7)}`

  return (
    <div>
      <Step
        label={label}
        previous="Semana anterior"
        next="Próxima semana"
        onPrevious={() => onWeek(addDays(weekStart, -7))}
        onNext={() => onWeek(addDays(weekStart, 7))}
      />

      <ul className="mt-2 divide-y divide-white/8">
        {days.map((date) => {
          const tasks = indexedTasks(index, date)
          const progress = dayProgress(index, date)
          const summary = [
            ...(progress.habitTotal > 0 && date <= today
              ? [`${progress.habitDone} de ${progress.habitTotal} hábitos`]
              : []),
            ...(noted.has(date) ? ['nota'] : []),
            ...(focused.has(date) ? ['foco'] : []),
            ...tasks.map((task) => task.title),
          ]

          return (
            <li key={date}>
              <button
                type="button"
                className="flex min-h-16 w-full items-center gap-4 py-2 text-left"
                onClick={() => onOpen(date)}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block text-[17px] ${date === today ? 'font-semibold' : ''}`}>
                    {formatLongDate(date)}
                  </span>
                  <span className="block truncate text-[15px] text-mist">
                    {summary.length > 0 ? summary.join(', ') : 'Toque para planejar'}
                  </span>
                </span>
                <span className="shrink-0 text-[15px] text-mist">
                  {completed.has(date)
                    ? 'Concluído'
                    : progress.total > 0
                      ? `${progress.done} de ${progress.total}`
                      : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
