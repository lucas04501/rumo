import { Check, Plus, Repeat } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { addTaskOn, saveDayNote, setDayCompleted } from '../data/dayActions'
import { setCheck } from '../data/habitActions'
import type { Snapshot } from '../data/types'
import { formatLongDate } from '../lib/dates'
import { dayReport, type DayReport } from '../lib/dayReport'
import { formatMinutes } from '../lib/evolution'
import { isScheduled } from '../lib/habits'
import { checksOf, indexSnapshot, planOf } from '../lib/progress'
import { isPlanned, tasksOn } from '../lib/tasks'
import { Meter } from './EvolutionCharts'
import { iconFor } from './habitIcons'
import { ItemRow } from './ItemRow'
import { Sheet } from './Sheet'
import { TaskRow } from './TaskRow'

const HEADING = 'font-display text-lg font-semibold'

type DaySheetProps = {
  date: string
  today: string
  snapshot: Snapshot
  onClosed: () => void
}

/** O dia inteiro em um lugar: o que foi feito, o que foi anotado e o que os dados dizem. */
export function DaySheet({ date, today, snapshot, onClosed }: DaySheetProps) {
  const day = snapshot.days.find((item) => item.date === date)
  const [note, setNote] = useState(day?.note ?? '')
  const [title, setTitle] = useState('')

  const habits = snapshot.habits.filter((habit) => isScheduled(planOf(habit, snapshot), date))
  const habitsDone = habits.filter((habit) => checksOf(habit.id, snapshot).has(date)).length
  const tasks = tasksOn(snapshot, date)
  const tasksDone = tasks.filter((task) => task.doneAt).length
  const isFuture = date > today

  const report = useMemo(
    () => dayReport(snapshot, indexSnapshot(snapshot), date, today),
    [snapshot, date, today],
  )
  const perfect = report.total > 0 && report.done === report.total

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
        <div className="mt-2 grid gap-5">
          {!isFuture && <Summary report={report} />}

          {report.insights.length > 0 && (
            <ul className="grid gap-1 text-[15px]/snug">
              {report.insights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}

          {habits.length > 0 && !isFuture && (
            <section aria-labelledby="habitos-do-dia">
              <div className="flex items-baseline justify-between gap-3">
                <h3 id="habitos-do-dia" className={HEADING}>
                  Hábitos
                </h3>
                <p className="text-[15px] text-mist">
                  {habitsDone} de {habits.length}
                </p>
              </div>
              <ul className="mt-1 divide-y divide-line">
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

          <section aria-labelledby="tarefas-do-dia">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="tarefas-do-dia" className={HEADING}>
                Tarefas
              </h3>
              {tasks.length > 0 && (
                <p className="text-[15px] text-mist">
                  {tasksDone} de {tasks.length}
                </p>
              )}
            </div>
            <ul className="mt-1 divide-y divide-line">
              {tasks.map((task) => (
                <li key={task.id}>
                  {isPlanned(task, today, snapshot.tasks) ? (
                    <p className="flex min-h-14 items-center gap-3 text-[17px] text-mist">
                      <Repeat size={18} strokeWidth={1.75} className="mx-[5px] shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 wrap-anywhere">{task.title}</span>
                    </p>
                  ) : (
                    <TaskRow task={task} />
                  )}
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

          {report.routine.length > 0 && (
            <Detail title="Rotina">
              <ul className="grid gap-1">
                {report.routine.map((step) => (
                  <li key={step.id} className="flex items-baseline gap-3 text-[15px]">
                    <span className="w-11 shrink-0 text-mist">{step.time}</span>
                    <span className={`min-w-0 flex-1 wrap-anywhere ${step.done ? 'text-foam/70' : ''}`}>
                      {step.title}
                    </span>
                    {step.done && (
                      <Check
                        size={16}
                        strokeWidth={2.25}
                        className="shrink-0 self-center text-tide"
                        aria-label="Feito"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </Detail>
          )}

          {report.focus.blocks > 0 && (
            <Detail title="Foco">
              <p className="text-[15px]">
                {report.focus.blocks} {report.focus.blocks === 1 ? 'bloco' : 'blocos'},{' '}
                {formatMinutes(report.focus.minutes)}
                {report.focus.titles.length > 0 && (
                  <span className="text-mist"> em {report.focus.titles.join(', ')}</span>
                )}
              </p>
            </Detail>
          )}

          {report.milestones.length + report.goals.length > 0 && (
            <Detail title="Metas">
              <ul className="grid gap-1 text-[15px]">
                {report.milestones.map((milestone) => (
                  <li key={milestone}>Marco alcançado: {milestone}</li>
                ))}
                {report.goals.map((goal) => (
                  <li key={goal}>Meta concluída: {goal}</li>
                ))}
              </ul>
            </Detail>
          )}

          {report.notes.length > 0 && (
            <Detail title="Notas editadas neste dia">
              <ul className="grid gap-1 text-[15px]">
                {report.notes.map((line) => (
                  <li key={line} className="wrap-anywhere">
                    {line}
                  </li>
                ))}
              </ul>
            </Detail>
          )}

          <label className="grid gap-1.5 text-[15px] text-mist">
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
              className="ghost w-full"
              aria-pressed={Boolean(day?.completedAt)}
              onClick={() =>
                setDayCompleted(date, day?.completedAt ? null : new Date().toISOString())
              }
            >
              {day?.completedAt ? 'Desmarcar dia concluído' : 'Marcar dia como concluído'}
            </button>
          )}
          {perfect && !isFuture && <p className="text-[15px] text-sun">Dia perfeito.</p>}
        </div>
      )}
    </Sheet>
  )
}

function Summary({ report }: { report: DayReport }) {
  if (report.percent === null && report.xp === 0) {
    return <p className="text-[15px] text-mist">Nada programado neste dia.</p>
  }

  return (
    <div>
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] text-mist">
          {report.total > 0 ? `${report.done} de ${report.total} concluídos` : 'Sem itens programados'}
        </span>
        <span className="flex items-baseline gap-3">
          {report.xp > 0 && <span className="text-[15px] font-semibold text-sun">+{report.xp} XP</span>}
          {report.percent !== null && <span className="text-[17px] font-semibold">{report.percent}%</span>}
        </span>
      </p>
      {report.percent !== null && (
        <div className="mt-2">
          <Meter value={report.percent} label={`${report.percent}% do dia concluído`} />
        </div>
      )}
    </div>
  )
}

function Detail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className={HEADING}>{title}</h3>
      <div className="mt-1.5">{children}</div>
    </section>
  )
}
