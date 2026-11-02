import { Plus, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import {
  addSubtask,
  deleteSubtask,
  ensureTask,
  moveTask,
  postponeTask,
  removeTask,
  saveTask,
  skipOccurrence,
  startRepeating,
  toggleSubtask,
} from '../data/taskActions'
import type { Snapshot, Task } from '../data/types'
import { BOARD_COLUMNS, columnOf } from '../lib/board'
import { formatShortDate } from '../lib/dates'
import { describeRule, isPlanned, type Schedule } from '../lib/tasks'
import { ItemRow } from './ItemRow'
import { RuleSheet } from './RuleSheet'
import { EVERY_DAY, isValidSchedule, PriorityPicker, SchedulePicker } from './SchedulePicker'
import { Sheet } from './Sheet'

type TaskSheetProps = { task: Task; onClosed: () => void }

export function TaskSheet({ task, onClosed }: TaskSheetProps) {
  const { date: today, moveCard } = useDay()
  const { data: snapshot } = useSnapshot()
  const navigate = useNavigate()
  const [title, setTitle] = useState(task.title)
  // Excluir ou sair da tela espera a folha fechar, para ela não sumir de uma vez.
  const afterClose = useRef<(() => void) | null>(null)

  if (!snapshot) return null

  const edited = { ...task, title: title.trim() || task.title }

  return (
    <Sheet
      title="Tarefa"
      onClosed={() => {
        if (edited.title !== task.title) saveTask(edited)
        afterClose.current?.()
        onClosed()
      }}
    >
      {(close) => {
        const leave = (action: () => void) => {
          afterClose.current = action
          close()
        }

        return (
          <div className="mt-3 grid gap-5">
            <label className="grid gap-1.5 text-[15px] text-mist">
              Nome
              <input
                className="field"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={300}
                enterKeyHint="done"
                autoComplete="off"
              />
            </label>

            <div className="grid gap-1.5 text-[15px] text-mist">
              Prioridade
              <PriorityPicker
                value={task.priority}
                onChange={(priority) => saveTask({ ...edited, priority })}
              />
            </div>

            {!isPlanned(task, today, snapshot.tasks) && (
              <div className="grid gap-1.5 text-[15px] text-mist">
                Andamento
                <div className="segmented segmented-wide" role="group" aria-label="Andamento">
                  {BOARD_COLUMNS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={columnOf(task) === id}
                      onClick={() => moveCard(edited, id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!task.ruleId && (
              <label className="grid gap-1.5 text-[15px] text-mist">
                Data
                <input
                  type="date"
                  className="field"
                  value={task.date}
                  onChange={(event) => {
                    if (event.target.value) moveTask(edited, event.target.value)
                  }}
                />
              </label>
            )}

            <Subtasks task={task} snapshot={snapshot} />
            <Repetition
              task={edited}
              snapshot={snapshot}
              today={today}
              onRepeat={(schedule) =>
                leave(() => startRepeating(edited, schedule, snapshot.taskRules.length, today))
              }
            />

            {task.date === today && !task.doneAt && (
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  leave(() => void navigate('/foco', { state: { taskId: task.id } }))
                }
              >
                Focar nesta tarefa
              </button>
            )}

            <div className="flex flex-wrap gap-x-6 border-t border-line pt-3">
              {!task.ruleId && !task.doneAt && (
                <button
                  type="button"
                  className="min-h-11 text-[15px] text-mist underline underline-offset-4"
                  onClick={() => leave(() => postponeTask(edited, today))}
                >
                  Adiar para amanhã
                </button>
              )}
              <button
                type="button"
                className="min-h-11 text-[15px] text-mist underline underline-offset-4"
                onClick={() =>
                  leave(() => (task.ruleId ? skipOccurrence(edited) : removeTask(edited)))
                }
              >
                {task.ruleId ? 'Pular esta vez' : 'Excluir tarefa'}
              </button>
            </div>
          </div>
        )
      }}
    </Sheet>
  )
}

function Subtasks({ task, snapshot }: { task: Task; snapshot: Snapshot }) {
  const [title, setTitle] = useState('')
  const subtasks = snapshot.subtasks
    .filter((subtask) => subtask.taskId === task.id)
    .sort((a, b) => a.position - b.position)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = title.trim()
    if (!clean) return
    ensureTask(task, snapshot)
    addSubtask(task.id, clean, subtasks.length)
    setTitle('')
  }

  return (
    <section aria-labelledby="subtarefas">
      <h3 id="subtarefas" className="font-display text-lg font-semibold">
        Subtarefas
      </h3>
      <ul className="mt-1 divide-y divide-line">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <ItemRow
                title={subtask.title}
                done={Boolean(subtask.doneAt)}
                onToggle={() => {
                  toggleSubtask(subtask)
                  return 0
                }}
              />
            </div>
            <button
              type="button"
              className="icon-button -mr-2.5"
              aria-label={`Excluir ${subtask.title}`}
              onClick={() => deleteSubtask(subtask.id)}
            >
              <X size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </li>
        ))}
        <li>
          <form onSubmit={submit} className="flex min-h-14 items-center gap-3">
            <Plus size={22} strokeWidth={1.75} className="mx-[3px] shrink-0 text-mist" aria-hidden />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nova subtarefa"
              aria-label="Nova subtarefa"
              enterKeyHint="done"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-3 outline-none"
            />
          </form>
        </li>
      </ul>
    </section>
  )
}

type RepetitionProps = {
  task: Task
  snapshot: Snapshot
  today: string
  onRepeat: (schedule: Schedule) => void
}

function Repetition({ task, snapshot, today, onRepeat }: RepetitionProps) {
  const [choosing, setChoosing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [schedule, setSchedule] = useState<Schedule>({ weekdays: EVERY_DAY, monthDay: null })
  const rule = snapshot.taskRules.find((item) => item.id === task.ruleId)

  if (rule) {
    return (
      <section aria-labelledby="repeticao">
        <h3 id="repeticao" className="font-display text-lg font-semibold">
          Repete
        </h3>
        <div className="mt-1 flex min-h-11 items-center justify-between gap-3">
          <p className="min-w-0 text-[15px] text-mist">
            {describeRule(rule)}
            {rule.endDate && `, até ${formatShortDate(rule.endDate)}`}
          </p>
          {!rule.endDate && (
            <button type="button" className="ghost shrink-0" onClick={() => setEditing(true)}>
              Editar
            </button>
          )}
        </div>
        {editing && (
          <RuleSheet
            rule={rule}
            position={rule.position}
            today={today}
            onClosed={() => setEditing(false)}
          />
        )}
      </section>
    )
  }

  if (!choosing) {
    return (
      <button type="button" className="ghost" onClick={() => setChoosing(true)}>
        Repetir esta tarefa
      </button>
    )
  }

  return (
    <section aria-labelledby="repeticao">
      <h3 id="repeticao" className="font-display text-lg font-semibold">
        Repetir
      </h3>
      <div className="mt-2 grid gap-3">
        <SchedulePicker
          value={schedule}
          fallbackDay={Number(task.date.slice(8))}
          onChange={setSchedule}
        />
        <button
          type="button"
          className="action"
          disabled={!isValidSchedule(schedule)}
          onClick={() => onRepeat(schedule)}
        >
          Repetir
        </button>
      </div>
    </section>
  )
}
