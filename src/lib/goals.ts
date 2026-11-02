import type { Milestone } from '../data/types'
import { addDays, diffDays } from './dates'
import { isScheduled, type HabitPlan } from './habits'

export type GoalProgress = {
  total: number
  reached: number
  remaining: number
  /** De 0 a 100. */
  percent: number
  daysLeft: number | null
  /** Dias disponíveis por marco restante. Nulo se não há prazo, marco restante ou tempo. */
  daysPerMilestone: number | null
}

export function goalProgress(
  milestones: Pick<Milestone, 'doneAt'>[],
  targetDate: string | null,
  today: string,
): GoalProgress {
  const total = milestones.length
  const reached = milestones.filter((milestone) => milestone.doneAt).length
  const remaining = total - reached
  const daysLeft = targetDate ? diffDays(targetDate, today) : null

  return {
    total,
    reached,
    remaining,
    percent: total === 0 ? 0 : Math.round((reached / total) * 100),
    daysLeft,
    daysPerMilestone:
      daysLeft !== null && daysLeft > 0 && remaining > 0
        ? Math.max(1, Math.floor(daysLeft / remaining))
        : null,
  }
}

export function deadlineLabel(daysLeft: number | null, finished: boolean): string {
  if (finished) return 'Concluída'
  if (daysLeft === null) return 'Sem prazo'
  if (daysLeft > 1) return `Faltam ${daysLeft} dias`
  if (daysLeft === 1) return 'Falta 1 dia'
  return daysLeft === 0 ? 'Termina hoje' : 'Prazo encerrado'
}

export function paceSentence({ remaining, daysPerMilestone }: GoalProgress): string | null {
  if (remaining === 0 || daysPerMilestone === null) return null
  if (remaining === 1) return `Falta 1 marco para chegar.`
  if (daysPerMilestone === 1) return `Faltam ${remaining} marcos: 1 por dia para chegar no prazo.`
  return `Faltam ${remaining} marcos: 1 a cada ${daysPerMilestone} dias para chegar no prazo.`
}

const CONSISTENCY_WINDOW_DAYS = 30

export type Consistency = { done: number; scheduled: number; percent: number | null }

/** Dias cumpridos entre os programados nos últimos 30 dias, sem contar hoje, que ainda está em aberto. */
export function consistency(
  plan: HabitPlan,
  checks: Set<string>,
  today: string,
  windowDays = CONSISTENCY_WINDOW_DAYS,
): Consistency {
  let done = 0
  let scheduled = 0

  for (let back = 1; back <= windowDays; back += 1) {
    const date = addDays(today, -back)
    if (!isScheduled(plan, date)) continue
    scheduled += 1
    if (checks.has(date)) done += 1
  }

  return { done, scheduled, percent: scheduled === 0 ? null : Math.round((done / scheduled) * 100) }
}

/** O que mudou entre a lista salva e a editada: só isso vai para a fila. */
export function milestoneChanges(before: Milestone[], after: Milestone[]) {
  const previous = new Map(before.map((milestone) => [milestone.id, milestone]))
  const kept = new Set(after.map((milestone) => milestone.id))

  return {
    changed: after.filter((milestone) => {
      const old = previous.get(milestone.id)
      return !old || old.title !== milestone.title || old.position !== milestone.position
    }),
    removed: before.filter((milestone) => !kept.has(milestone.id)),
  }
}
