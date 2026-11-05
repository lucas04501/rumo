import { ArrowLeft, Check, Info, Minus, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useDay } from '../data/DayProvider'
import { setRestTimer, useRestTimer } from '../data/restTimer'
import { usePlanView } from '../data/planGate'
import { useSnapshot } from '../data/store'
import { markSet, removeSession, saveSession, unmarkSet } from '../data/workoutActions'
import type { Snapshot, WorkoutSession } from '../data/types'
import { useNow } from '../data/useNow'
import { formatMinutes } from '../lib/evolution'
import { haptic, soundCheck, soundFocusEnd } from '../lib/feedback'
import { formatClock } from '../lib/focus'
import {
  bestBefore,
  DEFAULT_REST_SECONDS,
  exerciseOf,
  formatLoad,
  LOAD_STEP_KG,
  nextDraft,
  runningSession,
  sessionExercises,
  setsOf,
  summarize,
  type Exercise,
  type SessionExercise,
  type SetDraft,
} from '../lib/workouts'
import { Screen } from '../ui/Screen'
import { useWakeLock } from '../ui/useWakeLock'
import { ExerciseSheet } from '../ui/WorkoutSheets'

const EXTRA_REST_MS = 30_000
const FRESH_END_MS = 5000
const ELAPSED_INTERVAL_MS = 30_000
const MAX_REPS = 1000
const MAX_LOAD_KG = 2000

/** Modo treino: uma mão, com sinal ruim. A série da vez ocupa a tela, e o resto fica em uma linha. */
export function Treino() {
  const { data: snapshot } = useSnapshot()
  const { treinos } = usePlanView()
  const session = snapshot ? runningSession(snapshot) : null

  useWakeLock(session !== null && treinos)

  if (!snapshot) return null
  // Sem o Pro, não dá para registrar séries: elas seriam recusadas pelo servidor.
  if (!session || !treinos) return <Navigate to="/treinos" replace />
  return <Running key={session.id} session={session} snapshot={snapshot} />
}

function Running({ session, snapshot }: { session: WorkoutSession; snapshot: Snapshot }) {
  const { finishWorkout } = useDay()
  const now = useNow(ELAPSED_INTERVAL_MS)
  const [chosen, setChosen] = useState<string | null>(null)
  const [info, setInfo] = useState<Exercise | null>(null)
  const [notes, setNotes] = useState(session.notes ?? '')

  const title = snapshot.workoutPlans.find((plan) => plan.id === session.planId)?.title ?? 'Treino'
  const items = sessionExercises(snapshot, session)
  const sets = setsOf(snapshot, session.id)
  const next = items.find(({ done, target }) => done.length < target)?.ref ?? items.at(-1)?.ref
  const current = chosen ?? next
  const { minutes } = summarize(session, sets, new Date(now).toISOString())

  const saveNotes = () => {
    if (notes !== (session.notes ?? '')) saveSession({ ...session, notes: notes.trim() || null })
  }

  return (
    <Screen>
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/treinos"
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 text-[15px] text-mist"
        >
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
          Treinos
        </Link>
        <p className="text-[15px] text-mist">{formatMinutes(minutes)}</p>
      </div>
      <h1 className="font-display text-[28px]/[1.15] font-semibold tracking-[-0.02em] wrap-anywhere">
        {title}
      </h1>

      <RestBar />

      <ul className="mt-3 grid grid-cols-1 gap-2">
        {items.map((item) => (
          <li key={item.ref}>
            <ExerciseBlock
              item={item}
              session={session}
              snapshot={snapshot}
              position={sets.length}
              open={item.ref === current}
              onOpen={() => setChosen(item.ref)}
              onDone={() => setChosen(null)}
              onInfo={setInfo}
            />
          </li>
        ))}
      </ul>

      <label className="mt-6 grid gap-1.5 text-[15px] text-mist">
        Observações do treino
        <textarea
          className="field py-3"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={saveNotes}
          maxLength={5000}
        />
      </label>

      <button
        type="button"
        className="action mt-4 min-h-14 w-full"
        disabled={sets.length === 0}
        onClick={() => {
          saveNotes()
          setRestTimer(null)
          finishWorkout({ ...session, notes: notes.trim() || null })
        }}
      >
        Finalizar treino
      </button>
      <button
        type="button"
        className="mt-2 min-h-11 w-full text-[15px] text-mist underline underline-offset-4"
        onClick={() => {
          setRestTimer(null)
          removeSession(session, sets, 'Treino descartado')
        }}
      >
        Descartar treino
      </button>

      {info && <ExerciseSheet exercise={info} snapshot={snapshot} onClosed={() => setInfo(null)} />}
    </Screen>
  )
}

/** Conta pelo horário do fim, então segue certo mesmo com o app suspenso. */
function RestBar() {
  const endsAt = useRestTimer()
  const now = useNow(endsAt ? 1000 : null)
  const left = endsAt ? endsAt - now : 0

  useEffect(() => {
    if (!endsAt || left > 0) return
    // Quem volta ao app minutos depois não precisa de um alarme atrasado.
    if (-left < FRESH_END_MS) {
      soundFocusEnd()
      haptic()
    }
    setRestTimer(null)
  }, [endsAt, left])

  if (!endsAt || left <= 0) return null
  const clock = formatClock(left)

  return (
    <div className="rest-bar">
      <p className="min-w-0 flex-1 text-[15px] text-mist">Descanso</p>
      <p className="rest-clock" role="timer" aria-label={`Faltam ${clock} de descanso`}>
        {clock}
      </p>
      <button type="button" className="ghost" onClick={() => setRestTimer(endsAt + EXTRA_REST_MS)}>
        +30 s
      </button>
      <button type="button" className="ghost" onClick={() => setRestTimer(null)}>
        Pular
      </button>
    </div>
  )
}

type ExerciseBlockProps = {
  item: SessionExercise
  session: WorkoutSession
  snapshot: Snapshot
  /** Próxima posição livre entre as séries do treino. */
  position: number
  open: boolean
  onOpen: () => void
  onDone: () => void
  onInfo: (exercise: Exercise) => void
}

function ExerciseBlock({
  item,
  session,
  snapshot,
  position,
  open,
  onOpen,
  onDone,
  onInfo,
}: ExerciseBlockProps) {
  const { ref, planned, target, done } = item
  const exercise = exerciseOf(ref, snapshot.customExercises)
  const best = bestBefore(snapshot, ref, session)
  const complete = done.length >= target
  const [extra, setExtra] = useState(false)

  const finishSet = (draft: SetDraft) => {
    markSet({ sessionId: session.id, exerciseRef: ref, position, ...draft })
    soundCheck(done.length)
    haptic()
    setExtra(false)
    onDone()
    setRestTimer(Date.now() + (planned?.restSeconds ?? DEFAULT_REST_SECONDS) * 1000)
  }

  return (
    <section className="exercise-block" aria-label={exercise.name}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
          onClick={onOpen}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-semibold wrap-anywhere">{exercise.name}</span>
            {planned?.notes && <span className="block text-sm text-mist">{planned.notes}</span>}
          </span>
          {complete && (
            <Check size={20} strokeWidth={2.25} className="shrink-0 text-tide" aria-label="Feito" />
          )}
          <span className="shrink-0 text-[15px] text-mist">
            {done.length} de {target}
          </span>
        </button>
        {open && (
          <button
            type="button"
            className="icon-button -mr-1.5"
            aria-label={`Como fazer ${exercise.name}`}
            onClick={() => onInfo(exercise)}
          >
            <Info size={20} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <div className="pb-3">
          {done.length > 0 && (
            <ol className="mb-3 divide-y divide-line">
              {done.map((set, index) => (
                <li key={set.id} className="flex min-h-11 items-center gap-3 text-[15px]">
                  <span className="w-5 shrink-0 text-mist">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    {set.reps} × {formatLoad(set.loadKg)}
                  </span>
                  {best !== null && (set.loadKg ?? 0) > best && (
                    <span className="font-semibold text-sun">Recorde</span>
                  )}
                  <button
                    type="button"
                    className="icon-button -mr-2.5"
                    aria-label={`Desfazer série ${index + 1}`}
                    onClick={() => unmarkSet(set)}
                  >
                    <X size={18} strokeWidth={1.75} aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
          )}

          {complete && !extra ? (
            <button type="button" className="ghost w-full" onClick={() => setExtra(true)}>
              Mais uma série
            </button>
          ) : (
            <SetControls
              key={done.length}
              label={`Série ${done.length + 1}${complete ? '' : ` de ${target}`}`}
              draft={nextDraft(snapshot, session, item)}
              onDone={finishSet}
            />
          )}
        </div>
      )}
    </section>
  )
}

type SetControlsProps = { label: string; draft: SetDraft; onDone: (draft: SetDraft) => void }

function SetControls({ label, draft, onDone }: SetControlsProps) {
  const [reps, setReps] = useState(draft.reps)
  const [load, setLoad] = useState(draft.loadKg ?? 0)

  return (
    <div className="grid gap-3">
      <p className="text-[15px] text-mist">{label}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stepper label="Repetições" value={reps} step={1} max={MAX_REPS} whole onChange={setReps} />
        <Stepper label="Carga, em kg" value={load} step={LOAD_STEP_KG} max={MAX_LOAD_KG} onChange={setLoad} />
      </div>
      <button
        type="button"
        className="action min-h-14 w-full text-[17px]"
        onClick={() => onDone({ reps, loadKg: load > 0 ? load : null })}
      >
        Série feita
      </button>
    </div>
  )
}

type StepperProps = {
  label: string
  value: number
  step: number
  max: number
  whole?: boolean
  onChange: (value: number) => void
}

const written = (value: number) => String(value).replace('.', ',')

/** Botões grandes para a mão ocupada. O campo aceita digitar, com vírgula, como se escreve aqui. */
function Stepper({ label, value, step, max, whole, onChange }: StepperProps) {
  const [text, setText] = useState(written(value))
  const clamp = (next: number) => Math.min(max, Math.max(0, whole ? Math.round(next) : next))

  const shift = (amount: number) => {
    const next = clamp(value + amount)
    onChange(next)
    setText(written(next))
  }

  return (
    <div className="stepper">
      <span className="text-sm text-mist">{label}</span>
      <div className="stepper-row">
        <button
          type="button"
          className="stepper-button"
          aria-label={`Diminuir ${label}`}
          onClick={() => shift(-step)}
        >
          <Minus size={22} strokeWidth={2} aria-hidden />
        </button>
        <input
          className="stepper-value"
          inputMode="decimal"
          aria-label={label}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            const typed = Number(event.target.value.replace(',', '.'))
            if (Number.isFinite(typed)) onChange(clamp(typed))
          }}
          onBlur={() => setText(written(value))}
          autoComplete="off"
        />
        <button
          type="button"
          className="stepper-button"
          aria-label={`Aumentar ${label}`}
          onClick={() => shift(step)}
        >
          <Plus size={22} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  )
}
