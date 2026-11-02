import type { RoutineCheck, RoutineStep, Snapshot } from '../data/types'
import { weekdayOf } from './dates'
import { occurrenceId } from './tasks'

/** De segunda a domingo, como a pessoa pensa a semana. */
export const ROUTINE_WEEK = [
  { day: 1, letter: 'S', name: 'Segunda' },
  { day: 2, letter: 'T', name: 'Terça' },
  { day: 3, letter: 'Q', name: 'Quarta' },
  { day: 4, letter: 'Q', name: 'Quinta' },
  { day: 5, letter: 'S', name: 'Sexta' },
  { day: 6, letter: 'S', name: 'Sábado' },
  { day: 0, letter: 'D', name: 'Domingo' },
]

const FIRST_STEP = '07:00'
const NEXT_STEP_MINUTES = 30
const LAST_MINUTE = 23 * 60 + 59

export const nameOfDay = (weekday: number) =>
  ROUTINE_WEEK.find(({ day }) => day === weekday)?.name ?? ''

export const clockOf = (now: number | Date) => {
  const date = new Date(now)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function stepsOn(steps: RoutineStep[], weekday: number): RoutineStep[] {
  return steps
    .filter((step) => step.weekday === weekday)
    .sort((a, b) => a.time.localeCompare(b.time) || a.position - b.position)
}

/** Quantos passos cada dia tem, para mostrar de onde vale copiar. */
export const stepCount = (steps: RoutineStep[], weekday: number) =>
  steps.filter((step) => step.weekday === weekday).length

/** Passo em andamento: o último que já começou. Antes do primeiro, não há nenhum. */
export function currentStep(steps: RoutineStep[], clock: string): RoutineStep | null {
  return steps.findLast((step) => step.time <= clock) ?? null
}

export function nextStep(steps: RoutineStep[], clock: string): RoutineStep | null {
  return steps.find((step) => step.time > clock) ?? null
}

/** Horário sugerido para o próximo passo: logo depois do último, sem passar da meia-noite. */
export function suggestTime(steps: RoutineStep[]): string {
  const last = steps[steps.length - 1]
  if (!last) return FIRST_STEP
  const [hours, minutes] = last.time.split(':').map(Number)
  const total = Math.min(hours * 60 + minutes + NEXT_STEP_MINUTES, LAST_MINUTE)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const routineCheckId = occurrenceId

export function doneOn(checks: RoutineCheck[], date: string): Set<string> {
  return new Set(
    checks.filter((check) => check.date === date && check.doneAt).map((check) => check.stepId),
  )
}

export type RoutineLine = RoutineStep & { done: boolean }

export function routineOn(snapshot: Snapshot, date: string): RoutineLine[] {
  const done = doneOn(snapshot.routineChecks, date)
  return stepsOn(snapshot.routineSteps, weekdayOf(date)).map((step) => ({
    ...step,
    done: done.has(step.id),
  }))
}
