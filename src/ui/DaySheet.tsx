import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { addTaskOn, saveDayNote, setDayCompleted } from '../data/dayActions'
import { setCheck } from '../data/habitActions'
import type { Snapshot } from '../data/types'
import { formatLongDate } from '../lib/dates'
import { isScheduled } from '../lib/habits'
import { checksOf, dayProgress, indexSnapshot, planOf } from '../lib/progress'
import { iconFor } from './habitIcons'
import { ItemRow } from './ItemRow'
import { Sheet } from './Sheet'
import { TaskRow } from './TaskRow'

type DaySheetProps = {
  date: string
  today: string
  snapshot: Snapshot
  onClosed: () => void
}

export function DaySheet({ date, today, snapshot, onClosed }: DaySheetProps) {
  const day = snapshot.days.find((item) => item.date === date)
  const [note, setNote] = useState(day?.note ?? '')
  const [title, setTitle] = useState('')

  const habits = snapshot.habits.filter((habit) => isScheduled(planOf(habit, snapshot), date))
  const tasks = snapshot.tasks.filter((task) => task.date === date)
  const isFuture = date > today
  const perfect = dayProgress(indexSnapshot(snapshot), date).perfect

  const saveNote = () => {
    if (note !== (day?.note ?? '')) saveDayNote(date, note)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = title.trim()
    if (!clean) return
    addTaskOn(date, clean, snapshot.tasks.length)
    setTitle('')
  }

  return (
    <Sheet
      title={formatLongDate(date)}
      onClosed={() => {
        saveNote()
        onClosed()
      }}
    >
      {() => (
        <div className="mt-2">
          {habits.length > 0 && !isFuture && (
            <section aria-label="Hábitos do dia">
              <ul className="divide-y divide-white/8">
                {habits.map((habit) => {
                  const Icon = iconFor(habit.icon)
                  const done = checksOf(habit.id, snapshot).has(date)
                  return (
                    <li key={habit.id}>
                      <ItemRow
                        title={habit.title}
                        done={done}
                        leading={
                          <Icon size={19} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
                        }
                        onToggle={() => {
                          setCheck(habit.id, date, !done)
                          return 0
                        }}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section aria-labelledby="tarefas-do-dia" className="mt-4">
            <h3 id="tarefas-do-dia" className="font-display text-lg font-semibold">
              Tarefas
            </h3>
            <ul className="mt-1 divide-y divide-white/8">
              {tasks.map((task) => (
                <li key={task.id}>
                  <TaskRow task={task} />
                </li>
              ))}
              <li>
                <form onSubmit={submit} className="flex min-h-14 items-center gap-3">
                  <Plus size={22} strokeWidth={1.75} className="mx-[3px] shrink-0 text-mist" aria-hidden />
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Nova tarefa"
                    aria-label="Nova tarefa neste dia"
                    enterKeyHint="done"
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                  />
                </form>
              </li>
            </ul>
          </section>

          <label className="mt-4 grid gap-1.5 text-[15px] text-mist">
            Nota do dia
            <textarea
              className="field py-3"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onBlur={saveNote}
              maxLength={20000}
            />
          </label>

          {!isFuture && !perfect && (
            <button
              type="button"
              className="ghost mt-4 w-full"
              aria-pressed={Boolean(day?.completedAt)}
              onClick={() =>
                setDayCompleted(date, day?.completedAt ? null : new Date().toISOString())
              }
            >
              {day?.completedAt ? 'Desmarcar dia concluído' : 'Marcar dia como concluído'}
            </button>
          )}
          {perfect && !isFuture && <p className="mt-4 text-[15px] text-sun">Dia perfeito.</p>}
        </div>
      )}
    </Sheet>
  )
}
