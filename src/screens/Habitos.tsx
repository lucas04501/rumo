import { Anchor, Plus } from 'lucide-react'
import { useState } from 'react'
import { useDay } from '../data/DayProvider'
import { setCheck } from '../data/habitActions'
import { useSnapshot } from '../data/store'
import type { Habit, Snapshot } from '../data/types'
import { formatLongDate, formatShortDate, weekOf } from '../lib/dates'
import { haptic, soundCheck, soundUncheck } from '../lib/feedback'
import { describeWeekdays, isPaused, isScheduled } from '../lib/habits'
import { checksOf, planOf } from '../lib/progress'
import { currentStreak } from '../lib/streaks'
import { iconFor } from '../ui/habitIcons'
import { HabitSheet } from '../ui/HabitSheet'
import { Screen } from '../ui/Screen'

const WEEK_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type Editing = Habit | 'novo' | null

export function Habitos() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const [editing, setEditing] = useState<Editing>(null)

  if (!snapshot) return null
  const habits = snapshot.habits.filter((habit) => !habit.archivedAt)

  return (
    <Screen>
      <div className="flex items-center justify-between gap-4 pt-3 lg:pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">Hábitos</h1>
        <button type="button" className="action flex items-center gap-1.5" onClick={() => setEditing('novo')}>
          <Plus size={18} strokeWidth={2} aria-hidden />
          Novo hábito
        </button>
      </div>

      {habits.length === 0 ? (
        <p className="mt-6 max-w-[42ch] text-[17px] text-mist">
          Crie um hábito uma vez e ele aparece sozinho nos dias que você escolher.
        </p>
      ) : (
        <ul className="mt-4 max-w-2xl divide-y divide-white/8">
          {habits.map((habit) => (
            <li key={habit.id}>
              <HabitItem
                habit={habit}
                snapshot={snapshot}
                today={date}
                onEdit={() => setEditing(habit)}
              />
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <HabitSheet
          key={editing === 'novo' ? 'novo' : editing.id}
          habit={editing === 'novo' ? null : editing}
          position={snapshot.habits.length}
          today={date}
          onClosed={() => setEditing(null)}
        />
      )}
    </Screen>
  )
}

type HabitItemProps = {
  habit: Habit
  snapshot: Snapshot
  today: string
  onEdit: () => void
}

function HabitItem({ habit, snapshot, today, onEdit }: HabitItemProps) {
  const Icon = iconFor(habit.icon)
  const plan = planOf(habit, snapshot)
  const checks = checksOf(habit.id, snapshot)
  const { days, anchorUsed } = currentStreak(plan, checks, today)
  const activePause = plan.pauses?.find((pause) => today >= pause.startDate && today <= pause.endDate)

  const subtitle = activePause
    ? `Em pausa até ${formatShortDate(activePause.endDate)}`
    : describeWeekdays(habit.weekdays)

  return (
    <div className="py-3">
      <button type="button" className="habit-head" aria-label={`Editar ${habit.title}`} onClick={onEdit}>
        <Icon size={20} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-medium">{habit.title}</span>
          <span className="block text-sm text-mist">{subtitle}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[15px] text-mist">
          {anchorUsed && (
            <Anchor size={14} strokeWidth={1.75} aria-label="Âncora em uso: uma falta perdoada" />
          )}
          {days} {days === 1 ? 'dia' : 'dias'}
        </span>
      </button>

      <div className="week-strip">
        {weekOf(today).map((date, index) => (
          <DayCell
            key={date}
            habit={habit}
            date={date}
            letter={WEEK_LETTERS[index]}
            today={today}
            done={checks.has(date)}
            scheduled={isScheduled(plan, date)}
            paused={isPaused(date, plan.pauses)}
          />
        ))}
      </div>
    </div>
  )
}

type DayCellProps = {
  habit: Habit
  date: string
  letter: string
  today: string
  done: boolean
  scheduled: boolean
  paused: boolean
}

function DayCell({ habit, date, letter, today, done, scheduled, paused }: DayCellProps) {
  const isFuture = date > today

  if (!scheduled || isFuture) {
    const state = paused ? 'paused' : isFuture && scheduled ? 'ahead' : 'off'
    return (
      <span className="day-cell" data-state={state} aria-hidden>
        {letter}
      </span>
    )
  }

  const toggle = () => {
    setCheck(habit.id, date, !done)
    haptic()
    if (done) soundUncheck()
    else soundCheck(0)
  }

  const state = done ? 'done' : date === today ? 'today' : 'missed'

  return (
    <button
      type="button"
      className="day-cell"
      data-state={state}
      aria-pressed={done}
      aria-label={`${habit.title}, ${formatLongDate(date)}`}
      onClick={toggle}
    >
      {letter}
    </button>
  )
}
