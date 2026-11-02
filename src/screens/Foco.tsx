import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useDay } from '../data/DayProvider'
import { setFocusTimer, useFocusTimer } from '../data/focusTimer'
import { useSnapshot } from '../data/store'
import { recordPartialFocus } from '../data/taskActions'
import type { Snapshot, Task } from '../data/types'
import { useNow } from '../data/useNow'
import {
  DEFAULT_RHYTHM,
  focusToday,
  formatClock,
  isOver,
  isPaused,
  leftMs,
  pause,
  restMinutes,
  resume,
  RHYTHMS,
  startFocus,
  startRest,
  type FocusTimer,
} from '../lib/focus'
import { newId } from '../lib/ids'
import { tasksOn } from '../lib/tasks'
import { Screen } from '../ui/Screen'
import { useWakeLock } from '../ui/useWakeLock'

export function Foco() {
  const { date: today } = useDay()
  const { data: snapshot } = useSnapshot()
  const timer = useFocusTimer()

  useWakeLock(timer !== null && timer.endsAt !== null)

  if (!snapshot) return null

  return (
    <Screen>
      {timer ? (
        <Session timer={timer} snapshot={snapshot} />
      ) : (
        <Setup snapshot={snapshot} today={today} />
      )}
    </Screen>
  )
}

function todayLine(blocks: number, minutes: number): string {
  if (blocks === 0) return 'Uma coisa de cada vez.'
  return `Hoje: ${blocks} ${blocks === 1 ? 'bloco' : 'blocos'}, ${minutes} min.`
}

function Setup({ snapshot, today }: { snapshot: Snapshot; today: string }) {
  const { state } = useLocation() as { state: { taskId?: string } | null }
  const open = tasksOn(snapshot, today).filter((task) => !task.doneAt)
  const [taskId, setTaskId] = useState<string | null>(state?.taskId ?? open[0]?.id ?? null)
  const [rhythmId, setRhythmId] = useState(DEFAULT_RHYTHM)
  const { blocks, minutes } = focusToday(snapshot.focusSessions, today)
  const rhythm = RHYTHMS.find((item) => item.id === rhythmId) ?? RHYTHMS[1]

  return (
    <div className="max-w-2xl">
      <h1 className="pt-3 font-display text-4xl font-semibold tracking-[-0.02em] lg:pt-8">Foco</h1>
      <p className="mt-1 text-[17px] text-mist">{todayLine(blocks, minutes)}</p>

      <fieldset className="mt-5">
        <legend className="font-display text-xl font-semibold">No que você vai focar?</legend>
        <ul className="mt-1 divide-y divide-line">
          {open.map((task) => (
            <li key={task.id}>
              <label className="link-row">
                <input
                  type="radio"
                  name="tarefa-do-foco"
                  className="link-check"
                  checked={taskId === task.id}
                  onChange={() => setTaskId(task.id)}
                />
                <span className="min-w-0 flex-1 text-[17px] wrap-anywhere">{task.title}</span>
              </label>
            </li>
          ))}
          <li>
            <label className="link-row">
              <input
                type="radio"
                name="tarefa-do-foco"
                className="link-check"
                checked={taskId === null}
                onChange={() => setTaskId(null)}
              />
              <span className="min-w-0 flex-1 text-[17px] text-mist">Sem tarefa</span>
            </label>
          </li>
        </ul>
      </fieldset>

      <div className="mt-5 grid gap-1.5 text-[15px] text-mist">
        Ritmo
        <div className="segmented segmented-wide" role="group" aria-label="Ritmo">
          {RHYTHMS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={rhythmId === item.id}
              onClick={() => setRhythmId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p>
          {rhythm.focus} min de foco e {rhythm.rest} de pausa. A cada 4 blocos, pausa de 15.
        </p>
      </div>

      <button
        type="button"
        className="action mt-6 min-h-12 w-full"
        onClick={() => setFocusTimer(startFocus(newId(), taskId, rhythmId, 0, Date.now()))}
      >
        Começar
      </button>
    </div>
  )
}

function Session({ timer, snapshot }: { timer: FocusTimer; snapshot: Snapshot }) {
  const { toggleTask } = useDay()
  const now = useNow(timer.endsAt === null ? null : 1000)

  const task: Task | undefined = tasksOn(snapshot, timer.date).find(
    (item) => item.id === timer.taskId,
  )
  const nextFocus = () =>
    setFocusTimer(startFocus(newId(), timer.taskId, timer.rhythmId, timer.round, Date.now()))
  const end = () => {
    recordPartialFocus(timer, snapshot, Date.now())
    setFocusTimer(null)
  }

  if (isOver(timer)) {
    const afterFocus = timer.phase === 'focus'
    return (
      <SessionFrame
        eyebrow={afterFocus ? `${timer.round}º bloco` : 'Pausa'}
        title={afterFocus ? 'Bloco concluído.' : 'Pausa terminada.'}
        onEnd={end}
      >
        {afterFocus ? (
          <>
            <button
              type="button"
              className="action min-h-12"
              onClick={() => setFocusTimer(startRest(timer, Date.now()))}
            >
              Pausa de {restMinutes(timer)} min
            </button>
            <button type="button" className="ghost" onClick={nextFocus}>
              Seguir sem pausa
            </button>
          </>
        ) : (
          <button type="button" className="action min-h-12" onClick={nextFocus}>
            Próximo bloco
          </button>
        )}
      </SessionFrame>
    )
  }

  const left = leftMs(timer, now)
  const clock = formatClock(left)
  const paused = isPaused(timer)

  return (
    <SessionFrame
      eyebrow={timer.phase === 'focus' ? `${timer.round + 1}º bloco` : 'Pausa'}
      title={timer.phase === 'focus' ? (task?.title ?? 'Foco') : 'Respire um pouco.'}
      onEnd={end}
      clock={clock}
    >
      {timer.phase === 'rest' ? (
        <button type="button" className="ghost" onClick={nextFocus}>
          Pular pausa
        </button>
      ) : (
        <>
          {task && !task.doneAt && (
            <button type="button" className="action min-h-12" onClick={() => toggleTask(task)}>
              Concluir tarefa
            </button>
          )}
          <button
            type="button"
            className="ghost"
            onClick={() =>
              setFocusTimer(paused ? resume(timer, Date.now()) : pause(timer, Date.now()))
            }
          >
            {paused ? 'Continuar' : 'Pausar'}
          </button>
        </>
      )}
    </SessionFrame>
  )
}

type SessionFrameProps = {
  eyebrow: string
  title: string
  clock?: string
  onEnd: () => void
  children: ReactNode
}

function SessionFrame({ eyebrow, title, clock, onEnd, children }: SessionFrameProps) {
  return (
    <section className="mx-auto flex max-w-md flex-col pt-[8dvh] pb-[env(safe-area-inset-bottom,0px)] text-center lg:pt-[14dvh]">
      <p className="text-[15px] text-mist">{eyebrow}</p>
      <h1 className="mt-1 font-display text-[28px]/[1.15] font-semibold tracking-[-0.02em] wrap-anywhere">
        {title}
      </h1>
      {clock && (
        <p className="focus-clock" role="timer" aria-label={`Faltam ${clock}`}>
          {clock}
        </p>
      )}
      <div className="mt-8 grid gap-3">{children}</div>
      <div className="mt-5 flex items-center justify-center gap-6">
        <button
          type="button"
          className="min-h-11 text-[15px] text-mist underline underline-offset-4"
          onClick={onEnd}
        >
          Encerrar
        </button>
        <Link
          to="/"
          className="grid min-h-11 place-items-center text-[15px] text-mist underline underline-offset-4"
        >
          Ver o dia
        </Link>
      </div>
    </section>
  )
}
