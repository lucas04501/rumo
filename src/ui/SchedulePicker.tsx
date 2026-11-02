import type { Priority } from '../data/types'
import { PRIORITIES, type Schedule } from '../lib/tasks'
import { WEEK } from './HabitSheet'

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

export const isValidSchedule = ({ weekdays, monthDay }: Schedule) =>
  monthDay === null ? weekdays.length > 0 : monthDay >= 1 && monthDay <= 31

type SchedulePickerProps = {
  value: Schedule
  /** Dia sugerido ao trocar para "dia do mês". */
  fallbackDay: number
  onChange: (value: Schedule) => void
}

export function SchedulePicker({ value, fallbackDay, onChange }: SchedulePickerProps) {
  const monthly = value.monthDay !== null

  const toggleDay = (day: number) =>
    onChange({
      ...value,
      weekdays: value.weekdays.includes(day)
        ? value.weekdays.filter((item) => item !== day)
        : [...value.weekdays, day].sort((a, b) => a - b),
    })

  return (
    <div className="grid gap-3">
      <div className="segmented segmented-wide" role="group" aria-label="Como repete">
        <button
          type="button"
          aria-pressed={!monthly}
          onClick={() => onChange({ ...value, monthDay: null })}
        >
          Semana
        </button>
        <button
          type="button"
          aria-pressed={monthly}
          onClick={() => onChange({ ...value, monthDay: value.monthDay ?? fallbackDay })}
        >
          Mês
        </button>
      </div>

      {monthly ? (
        <label className="grid gap-1.5 text-[15px] text-mist">
          Todo dia
          <input
            className="field"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={value.monthDay ?? ''}
            onChange={(event) => onChange({ ...value, monthDay: Number(event.target.value) })}
          />
        </label>
      ) : (
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Dias da semana">
          {WEEK.map(([letter, name], day) => (
            <button
              key={name}
              type="button"
              className="pick"
              aria-label={name}
              aria-pressed={value.weekdays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {letter}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type PriorityPickerProps = { value: Priority; onChange: (value: Priority) => void }

export function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  return (
    <div className="segmented segmented-wide" role="group" aria-label="Prioridade">
      {PRIORITIES.map((priority) => (
        <button
          key={priority.value}
          type="button"
          aria-pressed={value === priority.value}
          onClick={() => onChange(priority.value)}
        >
          {priority.label}
        </button>
      ))}
    </div>
  )
}
