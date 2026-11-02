import { Ellipsis, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useDay } from '../data/DayProvider'
import { saveSteps, setStepDone } from '../data/routineActions'
import { useSnapshot } from '../data/store'
import type { RoutineStep } from '../data/types'
import { useNow } from '../data/useNow'
import { weekdayOf } from '../lib/dates'
import { haptic, soundCheck, soundUncheck } from '../lib/feedback'
import { newId } from '../lib/ids'
import {
  clockOf,
  currentStep,
  doneOn,
  nameOfDay,
  ROUTINE_WEEK,
  stepCount,
  stepsOn,
  suggestTime,
} from '../lib/routine'
import { ItemRow } from '../ui/ItemRow'
import { CopyDaySheet, StepSheet } from '../ui/RoutineSheets'
import { Screen } from '../ui/Screen'

const CLOCK_INTERVAL_MS = 60_000

export function Rotina() {
  const { date: today } = useDay()
  const { data: snapshot } = useSnapshot()
  const todayWeekday = weekdayOf(today)
  const [weekday, setWeekday] = useState(todayWeekday)
  const [editing, setEditing] = useState<RoutineStep | null>(null)
  const [copying, setCopying] = useState(false)
  const now = useNow(CLOCK_INTERVAL_MS)

  if (!snapshot) return null

  const steps = stepsOn(snapshot.routineSteps, weekday)
  const isToday = weekday === todayWeekday
  const done = doneOn(snapshot.routineChecks, today)
  const doneCount = steps.filter((step) => done.has(step.id)).length
  const active = isToday ? currentStep(steps, clockOf(now)) : null
  const otherDays = ROUTINE_WEEK.some(
    ({ day }) => day !== weekday && stepCount(snapshot.routineSteps, day) > 0,
  )

  return (
    <Screen>
      <div className="max-w-2xl">
        <h1 className="pt-3 font-display text-4xl font-semibold tracking-[-0.02em] lg:pt-8">Rotina</h1>
        <p className="mt-1 text-[17px] text-mist">Do acordar ao dormir, um dia de cada vez.</p>

        <div className="mt-5 grid grid-cols-7 gap-1.5" role="group" aria-label="Dia da semana">
          {ROUTINE_WEEK.map(({ day, letter, name }) => (
            <button
              key={day}
              type="button"
              className="pick routine-day"
              aria-label={`${name}${day === todayWeekday ? ', hoje' : ''}`}
              aria-pressed={weekday === day}
              data-today={day === todayWeekday}
              data-filled={stepCount(snapshot.routineSteps, day) > 0}
              onClick={() => setWeekday(day)}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">
            {nameOfDay(weekday)}
            {isToday && <span className="text-mist"> · hoje</span>}
          </h2>
          {steps.length > 0 && (
            <p className="text-[15px] text-mist">
              {isToday
                ? `${doneCount} de ${steps.length}`
                : `${steps.length} ${steps.length === 1 ? 'passo' : 'passos'}`}
            </p>
          )}
        </div>

        {steps.length === 0 && (
          <p className="mt-2 max-w-[42ch] text-[17px] text-mist">
            {otherDays
              ? 'Este dia ainda está livre. Monte aqui ou copie de outro dia.'
              : 'Comece pelo horário de acordar e vá até a hora de dormir.'}
          </p>
        )}

        <ul className="mt-1 divide-y divide-line">
          {steps.map((step) => (
            <li key={step.id}>
              <StepRow
                step={step}
                today={today}
                checkable={isToday}
                done={done.has(step.id)}
                active={active?.id === step.id}
                onEdit={() => setEditing(step)}
              />
            </li>
          ))}
          <li>
            <AddStep key={`${weekday}-${steps.length}`} weekday={weekday} steps={steps} />
          </li>
        </ul>

        {otherDays && (
          <button type="button" className="ghost mt-4" onClick={() => setCopying(true)}>
            Copiar de outro dia
          </button>
        )}
      </div>

      {editing && (
        <StepSheet
          key={editing.id}
          step={editing}
          snapshot={snapshot}
          onClosed={() => setEditing(null)}
        />
      )}
      {copying && (
        <CopyDaySheet weekday={weekday} snapshot={snapshot} onClosed={() => setCopying(false)} />
      )}
    </Screen>
  )
}

type StepRowProps = {
  step: RoutineStep
  today: string
  checkable: boolean
  done: boolean
  active: boolean
  onEdit: () => void
}

function StepRow({ step, today, checkable, done, active, onEdit }: StepRowProps) {
  const time = (
    <span className={`w-12 shrink-0 text-[15px] ${active ? 'font-semibold text-tide' : 'text-mist'}`}>
      {step.time}
    </span>
  )

  return (
    <div className="flex items-center gap-1">
      <div className="min-w-0 flex-1">
        {checkable ? (
          <ItemRow
            title={step.title}
            label={`${step.time}, ${step.title}${active ? ', agora' : ''}`}
            done={done}
            leading={time}
            onToggle={() => {
              setStepDone(step.id, today, !done)
              haptic()
              if (done) soundUncheck()
              else soundCheck(0)
              return 0
            }}
          />
        ) : (
          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
            aria-label={`Editar ${step.time}, ${step.title}`}
            onClick={onEdit}
          >
            {time}
            <span className="min-w-0 flex-1 text-[17px] wrap-anywhere">{step.title}</span>
          </button>
        )}
      </div>
      <button
        type="button"
        className="icon-button -mr-2.5"
        aria-label={`Detalhes de ${step.title}`}
        onClick={onEdit}
      >
        <Ellipsis size={20} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}

function AddStep({ weekday, steps }: { weekday: number; steps: RoutineStep[] }) {
  const [time, setTime] = useState(() => suggestTime(steps))
  const [title, setTitle] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = title.trim()
    if (!clean || !time) return
    saveSteps([{ id: newId(), weekday, time, title: clean, position: steps.length }])
    setTitle('')
  }

  return (
    <form onSubmit={submit} className="flex min-h-14 items-center gap-3">
      <Plus size={22} strokeWidth={1.75} className="mx-[3px] shrink-0 text-mist" aria-hidden />
      <input
        type="time"
        value={time}
        onChange={(event) => setTime(event.target.value)}
        aria-label="Horário do novo passo"
        className="routine-time"
        required
      />
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Novo passo"
        aria-label={`Novo passo em ${nameOfDay(weekday).toLowerCase()}`}
        enterKeyHint="done"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent py-3 outline-none"
      />
    </form>
  )
}
