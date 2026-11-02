import { useState, type FormEvent } from 'react'
import { copyDay, removeStep, saveSteps } from '../data/routineActions'
import type { RoutineStep, Snapshot } from '../data/types'
import { newId } from '../lib/ids'
import { nameOfDay, ROUTINE_WEEK, stepCount } from '../lib/routine'
import { Sheet } from './Sheet'

type StepSheetProps = {
  step: RoutineStep
  snapshot: Snapshot
  /** Passo que só passa a existir ao salvar: não tem o que excluir. */
  isNew?: boolean
  sheetTitle?: string
  onClosed: () => void
}

export function StepSheet({
  step,
  snapshot,
  isNew,
  sheetTitle = 'Passo da rotina',
  onClosed,
}: StepSheetProps) {
  const [title, setTitle] = useState(step.title)
  const [time, setTime] = useState(step.time)
  const [alsoOn, setAlsoOn] = useState<number[]>([])

  const toggleDay = (day: number) =>
    setAlsoOn((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )

  const canSave = title.trim().length > 0 && time !== ''

  return (
    <Sheet title={sheetTitle} onClosed={onClosed}>
      {(close) => {
        const submit = (event: FormEvent) => {
          event.preventDefault()
          if (!canSave) return

          const edited = { ...step, title: title.trim(), time }
          saveSteps([
            edited,
            ...alsoOn.map((weekday) => ({
              ...edited,
              id: newId(),
              weekday,
              position: stepCount(snapshot.routineSteps, weekday),
            })),
          ])
          close()
        }

        return (
          <>
            <form onSubmit={submit} className="mt-4 grid gap-5">
              <label className="grid gap-1.5 text-[15px] text-mist">
                Nome
                <input
                  className="field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={300}
                  enterKeyHint="done"
                  autoComplete="off"
                  required
                />
              </label>

              <label className="grid gap-1.5 text-[15px] text-mist">
                Horário
                <input
                  className="field"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </label>

              <fieldset>
                <legend className="text-[15px] text-mist">Colocar também em</legend>
                <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                  {ROUTINE_WEEK.map(({ day, letter, name }) => (
                    <button
                      key={day}
                      type="button"
                      className="pick"
                      aria-label={name}
                      aria-pressed={day === step.weekday || alsoOn.includes(day)}
                      disabled={day === step.weekday}
                      onClick={() => toggleDay(day)}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button type="submit" className="action min-h-12" disabled={!canSave}>
                Salvar
              </button>
            </form>

            {!isNew && (
              <div className="mt-6 border-t border-line pt-3">
                <button
                  type="button"
                  className="min-h-11 text-[15px] text-mist underline underline-offset-4"
                  onClick={() => {
                    removeStep(step)
                    close()
                  }}
                >
                  Excluir passo
                </button>
              </div>
            )}
          </>
        )
      }}
    </Sheet>
  )
}

type CopyDaySheetProps = {
  weekday: number
  snapshot: Snapshot
  onClosed: () => void
}

export function CopyDaySheet({ weekday, snapshot, onClosed }: CopyDaySheetProps) {
  const sources = ROUTINE_WEEK.filter(
    ({ day }) => day !== weekday && stepCount(snapshot.routineSteps, day) > 0,
  )
  const replacing = stepCount(snapshot.routineSteps, weekday)

  return (
    <Sheet title={`Copiar para ${nameOfDay(weekday).toLowerCase()}`} onClosed={onClosed}>
      {(close) => (
        <div className="mt-1">
          {replacing > 0 && (
            <p className="text-[15px] text-mist">
              {replacing === 1 ? 'O passo atual será trocado' : `Os ${replacing} passos atuais serão trocados`}
              . Dá para desfazer em seguida.
            </p>
          )}
          <ul className="mt-2 divide-y divide-line">
            {sources.map(({ day, name }) => {
              const count = stepCount(snapshot.routineSteps, day)
              return (
                <li key={day}>
                  <button
                    type="button"
                    className="flex min-h-14 w-full items-center justify-between gap-3 text-left text-[17px]"
                    onClick={() => {
                      copyDay(day, weekday, snapshot)
                      close()
                    }}
                  >
                    {name}
                    <span className="text-[15px] text-mist">
                      {count} {count === 1 ? 'passo' : 'passos'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Sheet>
  )
}
