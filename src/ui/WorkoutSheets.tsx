import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { MUSCLES } from '../content/exercicios'
import { offerUndo } from '../data/undo'
import {
  removePlanExercise,
  removeSession,
  saveCustomExercise,
  savePlan,
  savePlanExercise,
} from '../data/workoutActions'
import type {
  CustomExercise,
  PlanExercise,
  Snapshot,
  WorkoutPlan,
  WorkoutSession,
} from '../data/types'
import { formatDayShort, formatLongDate } from '../lib/dates'
import { formatMinutes } from '../lib/evolution'
import { newId } from '../lib/ids'
import {
  DEFAULT_REPS,
  DEFAULT_REST_SECONDS,
  DEFAULT_SETS,
  exerciseOf,
  formatLoad,
  loadHistory,
  sessionExercises,
  setsOf,
  summarize,
  type Exercise,
} from '../lib/workouts'
import { LoadChart } from './EvolutionCharts'
import { ExerciseList } from './ExerciseList'
import { WEEK } from './HabitSheet'
import { Sheet } from './Sheet'

const LINK = 'min-h-11 text-[15px] text-mist underline underline-offset-4'
const LABEL = 'grid gap-1.5 text-[15px] text-mist'

type PlanSheetProps = {
  plan: WorkoutPlan | null
  initialTitle?: string
  snapshot: Snapshot
  onClosed: () => void
}

export function PlanSheet({ plan, initialTitle = '', snapshot, onClosed }: PlanSheetProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(plan?.title ?? initialTitle)
  const [weekdays, setWeekdays] = useState(plan?.weekdays ?? [])
  const [habitId, setHabitId] = useState(plan?.habitId ?? '')
  const [goalId, setGoalId] = useState(plan?.goalId ?? '')
  // Sair da tela espera a folha fechar, para ela não sumir de uma vez.
  const afterClose = useRef<(() => void) | null>(null)

  const toggleDay = (day: number) =>
    setWeekdays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )

  const habits = snapshot.habits.filter((habit) => !habit.archivedAt)
  const goals = snapshot.goals.filter((goal) => goal.status === 'active')

  return (
    <Sheet
      title={plan ? 'Editar ficha' : 'Nova ficha'}
      onClosed={() => {
        afterClose.current?.()
        onClosed()
      }}
    >
      {(close) => {
        const submit = (event: FormEvent) => {
          event.preventDefault()
          if (!title.trim()) return

          const saved: WorkoutPlan = {
            ...(plan ?? {
              id: newId(),
              archivedAt: null,
              position: snapshot.workoutPlans.length,
            }),
            title: title.trim(),
            weekdays: [...weekdays].sort((a, b) => a - b),
            habitId: habitId || null,
            goalId: goalId || null,
          }
          savePlan(saved)
          if (!plan) afterClose.current = () => void navigate(`/treinos/${saved.id}`)
          close()
        }

        const archive = (current: WorkoutPlan) => {
          afterClose.current = () => {
            savePlan({ ...current, archivedAt: new Date().toISOString() })
            offerUndo({ message: 'Ficha arquivada', undo: () => savePlan(current) })
            void navigate('/treinos')
          }
          close()
        }

        return (
          <>
            <form onSubmit={submit} className="mt-4 grid gap-5">
              <label className={LABEL}>
                Nome
                <input
                  className="field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Treino A"
                  maxLength={120}
                  enterKeyHint="done"
                  autoComplete="off"
                  required
                />
              </label>

              <fieldset>
                <legend className="text-[15px] text-mist">Dias planejados</legend>
                <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                  {WEEK.map(([letter, name], day) => (
                    <button
                      key={name}
                      type="button"
                      className="pick"
                      aria-label={name}
                      aria-pressed={weekdays.includes(day)}
                      onClick={() => toggleDay(day)}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className={LABEL}>
                Hábito ligado
                <select
                  className="field"
                  value={habitId}
                  onChange={(event) => setHabitId(event.target.value)}
                >
                  <option value="">Nenhum</option>
                  {habits.map((habit) => (
                    <option key={habit.id} value={habit.id}>
                      {habit.title}
                    </option>
                  ))}
                </select>
                <span>Terminar o treino marca este hábito no dia.</span>
              </label>

              <label className={LABEL}>
                Meta ligada
                <select
                  className="field"
                  value={goalId}
                  onChange={(event) => setGoalId(event.target.value)}
                >
                  <option value="">Nenhuma</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="action min-h-12" disabled={!title.trim()}>
                Salvar
              </button>
            </form>

            {plan && (
              <div className="mt-6 border-t border-line pt-3">
                <button type="button" className={LINK} onClick={() => archive(plan)}>
                  Arquivar ficha
                </button>
              </div>
            )}
          </>
        )
      }}
    </Sheet>
  )
}

type NumberFieldProps = { label: string; value: string; onChange: (value: string) => void }

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className={LABEL}>
      {label}
      <input
        className="field"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
    </label>
  )
}

const toNumber = (text: string) => Number(text.replace(',', '.'))

function wholeNumber(text: string, fallback: number, max: number) {
  const value = Math.round(toNumber(text))
  return Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : fallback
}

type PlanExerciseSheetProps = { exercise: PlanExercise; snapshot: Snapshot; onClosed: () => void }

export function PlanExerciseSheet({ exercise, snapshot, onClosed }: PlanExerciseSheetProps) {
  const [sets, setSets] = useState(String(exercise.sets))
  const [reps, setReps] = useState(String(exercise.reps))
  const [load, setLoad] = useState(exercise.loadKg === null ? '' : String(exercise.loadKg).replace('.', ','))
  const [rest, setRest] = useState(String(exercise.restSeconds))
  const [notes, setNotes] = useState(exercise.notes ?? '')
  const { name } = exerciseOf(exercise.exerciseRef, snapshot.customExercises)

  return (
    <Sheet title={name} onClosed={onClosed}>
      {(close) => {
        const submit = (event: FormEvent) => {
          event.preventDefault()
          const loadKg = toNumber(load)
          savePlanExercise({
            ...exercise,
            sets: Math.max(1, wholeNumber(sets, DEFAULT_SETS, 50)),
            reps: wholeNumber(reps, DEFAULT_REPS, 1000),
            loadKg: load.trim() && Number.isFinite(loadKg) ? Math.min(2000, Math.max(0, loadKg)) : null,
            restSeconds: wholeNumber(rest, DEFAULT_REST_SECONDS, 3600),
            notes: notes.trim() || null,
          })
          close()
        }

        return (
          <>
            <form onSubmit={submit} className="mt-4 grid gap-5">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Séries" value={sets} onChange={setSets} />
                <NumberField label="Repetições" value={reps} onChange={setReps} />
                <NumberField label="Carga (kg)" value={load} onChange={setLoad} />
                <NumberField label="Descanso (s)" value={rest} onChange={setRest} />
              </div>
              <label className={LABEL}>
                Observações
                <textarea
                  className="field py-3"
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={2000}
                />
              </label>
              <button type="submit" className="action min-h-12">
                Salvar
              </button>
            </form>
            <div className="mt-6 border-t border-line pt-3">
              <button
                type="button"
                className={LINK}
                onClick={() => {
                  removePlanExercise(exercise)
                  close()
                }}
              >
                Tirar da ficha
              </button>
            </div>
          </>
        )
      }}
    </Sheet>
  )
}

type ExercisePickerProps = {
  snapshot: Snapshot
  onPick: (ref: string) => void
  onClosed: () => void
}

export function ExercisePicker({ snapshot, onPick, onClosed }: ExercisePickerProps) {
  const [creating, setCreating] = useState(false)

  return (
    <Sheet title="Adicionar exercício" onClosed={onClosed}>
      {(close) => (
        <div className="mt-3">
          <ExerciseList
            custom={snapshot.customExercises}
            onPick={({ id }) => {
              onPick(id)
              close()
            }}
          />
          <button type="button" className="ghost mt-4 w-full" onClick={() => setCreating(true)}>
            Criar exercício
          </button>
          {creating && (
            <CustomExerciseSheet
              exercise={null}
              onSaved={(id) => {
                onPick(id)
                close()
              }}
              onClosed={() => setCreating(false)}
            />
          )}
        </div>
      )}
    </Sheet>
  )
}

type CustomExerciseSheetProps = {
  exercise: CustomExercise | null
  onSaved?: (id: string) => void
  onClosed: () => void
}

export function CustomExerciseSheet({ exercise, onSaved, onClosed }: CustomExerciseSheetProps) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [muscle, setMuscle] = useState(exercise?.muscle ?? MUSCLES[0])
  const [instructions, setInstructions] = useState(exercise?.instructions ?? '')

  return (
    <Sheet title={exercise ? 'Editar exercício' : 'Novo exercício'} onClosed={onClosed}>
      {(close) => {
        const submit = (event: FormEvent) => {
          event.preventDefault()
          if (!name.trim()) return
          const id = exercise?.id ?? newId()
          saveCustomExercise({ id, name: name.trim(), muscle, instructions: instructions.trim() })
          onSaved?.(id)
          close()
        }

        return (
          <form onSubmit={submit} className="mt-4 grid gap-5">
            <label className={LABEL}>
              Nome
              <input
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                enterKeyHint="done"
                autoComplete="off"
                required
              />
            </label>
            <label className={LABEL}>
              Grupo muscular
              <select
                className="field"
                value={muscle}
                onChange={(event) => setMuscle(event.target.value)}
              >
                {MUSCLES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className={LABEL}>
              Como fazer
              <textarea
                className="field py-3"
                rows={3}
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                maxLength={2000}
              />
            </label>
            <button type="submit" className="action min-h-12" disabled={!name.trim()}>
              Salvar
            </button>
          </form>
        )
      }}
    </Sheet>
  )
}

type ExerciseSheetProps = { exercise: Exercise; snapshot: Snapshot; onClosed: () => void }

/** Instrução, maior carga e a evolução de um exercício. */
export function ExerciseSheet({ exercise, snapshot, onClosed }: ExerciseSheetProps) {
  const [editing, setEditing] = useState(false)
  const history = loadHistory(snapshot, exercise.id)
  const custom = snapshot.customExercises.find((item) => item.id === exercise.id)
  const best = history.length > 0 ? Math.max(...history.map((point) => point.value)) : null

  return (
    <Sheet title={exercise.name} onClosed={onClosed}>
      {() => (
        <div className="mt-1 grid gap-4">
          {exercise.muscle && <p className="text-[15px] text-mist">{exercise.muscle}</p>}
          {exercise.how && <p className="text-[17px]/snug">{exercise.how}</p>}
          {best !== null && (
            <p className="flex items-baseline justify-between gap-3 text-[15px]">
              <span className="text-mist">Maior carga</span>
              <span className="font-semibold">{formatLoad(best)}</span>
            </p>
          )}
          {history.length > 1 && <LoadChart points={history} label={`Carga em ${exercise.name}`} />}
          {custom && (
            <button type="button" className="ghost w-full" onClick={() => setEditing(true)}>
              Editar exercício
            </button>
          )}
          {editing && custom && (
            <CustomExerciseSheet exercise={custom} onClosed={() => setEditing(false)} />
          )}
        </div>
      )}
    </Sheet>
  )
}

type SessionSheetProps = { session: WorkoutSession; snapshot: Snapshot; onClosed: () => void }

/** Um treino do histórico, exercício por exercício. */
export function SessionSheet({ session, snapshot, onClosed }: SessionSheetProps) {
  const afterClose = useRef<(() => void) | null>(null)
  const sets = setsOf(snapshot, session.id)
  const { minutes, volume } = summarize(session, sets, '')
  const title = snapshot.workoutPlans.find((plan) => plan.id === session.planId)?.title ?? 'Treino'
  const done = sessionExercises(snapshot, session).filter((item) => item.done.length > 0)

  return (
    <Sheet
      title={title}
      onClosed={() => {
        afterClose.current?.()
        onClosed()
      }}
    >
      {(close) => (
        <div className="mt-1 grid gap-4">
          <p className="text-[15px] text-mist">
            {formatLongDate(session.date)}, {formatMinutes(minutes)}
            {volume > 0 && `, ${volume.toLocaleString('pt-BR')} kg no total`}
          </p>

          <ul className="divide-y divide-line">
            {done.map((item) => (
              <li key={item.ref} className="py-2.5">
                <p className="text-[17px] font-[450]">
                  {exerciseOf(item.ref, snapshot.customExercises).name}
                </p>
                <p className="text-[15px] text-mist">
                  {item.done
                    .map(({ reps, loadKg }) => (loadKg ? `${reps} × ${formatLoad(loadKg)}` : `${reps}`))
                    .join(', ')}
                </p>
              </li>
            ))}
          </ul>

          {session.notes && <p className="text-[15px]/snug whitespace-pre-wrap">{session.notes}</p>}

          <div className="border-t border-line pt-3">
            <button
              type="button"
              className={LINK}
              onClick={() => {
                afterClose.current = () =>
                  removeSession(session, sets, `Treino de ${formatDayShort(session.date)} excluído`)
                close()
              }}
            >
              Excluir treino
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
