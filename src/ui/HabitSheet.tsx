import { useState, type FormEvent } from 'react'
import { addPause, deleteHabit, removePause, saveHabit } from '../data/habitActions'
import { useSnapshot } from '../data/store'
import type { Habit } from '../data/types'
import { addDays, formatShortDate } from '../lib/dates'
import { newId } from '../lib/ids'
import { DEFAULT_HABIT_ICON, HABIT_ICONS, type HabitIconName } from './habitIcons'
import { Sheet } from './Sheet'

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const WEEK = [
  ['D', 'Domingo'],
  ['S', 'Segunda'],
  ['T', 'Terça'],
  ['Q', 'Quarta'],
  ['Q', 'Quinta'],
  ['S', 'Sexta'],
  ['S', 'Sábado'],
]
const DEFAULT_PAUSE_DAYS = 6

type HabitSheetProps = {
  habit: Habit | null
  position: number
  today: string
  onClosed: () => void
}

export function HabitSheet({ habit, position, today, onClosed }: HabitSheetProps) {
  const [title, setTitle] = useState(habit?.title ?? '')
  const [icon, setIcon] = useState(habit?.icon ?? DEFAULT_HABIT_ICON)
  const [weekdays, setWeekdays] = useState(habit?.weekdays ?? EVERY_DAY)

  const toggleDay = (day: number) =>
    setWeekdays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )

  const canSave = title.trim().length > 0 && weekdays.length > 0

  return (
    <Sheet title={habit ? 'Editar hábito' : 'Novo hábito'} onClosed={onClosed}>
      {(close) => {
        const submit = (event: FormEvent) => {
          event.preventDefault()
          if (!canSave) return
          saveHabit({
            ...(habit ?? {
              id: newId(),
              startDate: today,
              goalId: null,
              archivedAt: null,
              position,
            }),
            title: title.trim(),
            icon,
            weekdays: [...weekdays].sort((a, b) => a - b),
          })
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
                  placeholder="Ex.: Ler 20 minutos"
                  maxLength={120}
                  enterKeyHint="done"
                  autoComplete="off"
                  required
                />
              </label>

              <fieldset>
                <legend className="text-[15px] text-mist">Ícone</legend>
                <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                  {Object.entries(HABIT_ICONS).map(([name, Icon]) => (
                    <button
                      key={name}
                      type="button"
                      className="pick"
                      aria-label={`Ícone ${name}`}
                      aria-pressed={icon === name}
                      onClick={() => setIcon(name as HabitIconName)}
                    >
                      <Icon size={20} strokeWidth={1.75} aria-hidden />
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-[15px] text-mist">Dias da semana</legend>
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

              <button type="submit" className="action min-h-12" disabled={!canSave}>
                {habit ? 'Salvar' : 'Criar hábito'}
              </button>
            </form>

            {habit && <Pauses habitId={habit.id} today={today} />}
            {habit && <RemoveHabit habit={habit} onRemoved={close} />}
          </>
        )
      }}
    </Sheet>
  )
}

function Pauses({ habitId, today }: { habitId: string; today: string }) {
  const { data: snapshot } = useSnapshot()
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(addDays(today, DEFAULT_PAUSE_DAYS))

  const pauses = (snapshot?.pauses ?? []).filter(
    (pause) => pause.habitId === habitId && pause.endDate >= today,
  )
  const valid = startDate !== '' && endDate !== '' && endDate >= startDate

  return (
    <section aria-labelledby="pausas" className="mt-7 border-t border-white/8 pt-5">
      <h3 id="pausas" className="font-display text-lg font-semibold">
        Pausar
      </h3>
      <p className="mt-0.5 text-[15px] text-mist">
        Viagem, lesão ou descanso: o hábito some do dia e a sequência não quebra.
      </p>

      {pauses.length > 0 && (
        <ul className="mt-3 grid gap-1">
          {pauses.map((pause) => (
            <li key={pause.id} className="flex min-h-11 items-center justify-between gap-3">
              <span className="text-[15px]">
                De {formatShortDate(pause.startDate)} a {formatShortDate(pause.endDate)}
              </span>
              <button
                type="button"
                className="min-h-11 px-1 text-[15px] text-mist underline underline-offset-4"
                onClick={() => removePause(pause.id)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-[15px] text-mist">
          Início
          <input
            className="field"
            type="date"
            value={startDate}
            min={today}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-[15px] text-mist">
          Fim
          <input
            className="field"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
      </div>

      <button
        type="button"
        className="ghost mt-3 w-full"
        disabled={!valid}
        onClick={() => addPause(habitId, startDate, endDate)}
      >
        Pausar hábito
      </button>
    </section>
  )
}

function RemoveHabit({ habit, onRemoved }: { habit: Habit; onRemoved: () => void }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="mt-6 border-t border-white/8 pt-3">
      {confirming ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px]">Excluir este hábito? O XP já ganho continua.</p>
          <button
            type="button"
            className="ghost shrink-0"
            onClick={() => {
              deleteHabit(habit.id)
              onRemoved()
            }}
          >
            Excluir
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 text-[15px] text-mist underline underline-offset-4"
          onClick={() => setConfirming(true)}
        >
          Excluir hábito
        </button>
      )}
    </div>
  )
}
