import type { Snapshot } from '../data/types'
import { toIsoDate } from './dates'
import { FREE_MAX_HABITS, TRIAL_DAYS, type PlanInfo } from './plan'
import { finishedSessions } from './workouts'

export type Activity = {
  activeDays: number
  habitsDone: number
  workouts: number
  focusMinutes: number
}

/** Tudo vem da foto: nada disto é salvo. Dia ativo é um dia em que algo foi concluído de verdade. */
export function activityOf(snapshot: Snapshot): Activity {
  const workouts = finishedSessions(snapshot)
  const days = new Set<string>([
    ...snapshot.checks.map(({ date }) => date),
    ...snapshot.focusSessions.map(({ date }) => date),
    ...workouts.map(({ date }) => date),
    ...[...snapshot.tasks.map((task) => task.doneAt), ...snapshot.milestones.map((m) => m.doneAt)]
      .flatMap((moment) => (moment ? [toIsoDate(new Date(moment))] : [])),
    ...snapshot.goals.flatMap(({ doneAt }) => (doneAt ? [toIsoDate(new Date(doneAt))] : [])),
  ])

  return {
    activeDays: days.size,
    habitsDone: snapshot.checks.length,
    workouts: workouts.length,
    focusMinutes: snapshot.focusSessions.reduce((sum, { minutes }) => sum + minutes, 0),
  }
}

/** Primeira letra do primeiro e do último nome. Nome vazio fica sem iniciais, e a tela usa um ícone. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const letter = (word: string) => [...word][0].toLocaleUpperCase('pt-BR')
  return words.length === 1 ? letter(words[0]) : letter(words[0]) + letter(words[words.length - 1])
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

export type PlanSummary = { title: string; line: string; action: string }

/** O cartão do plano no Perfil. O detalhe e a compra ficam em Assinatura. */
export function planSummary(plan: PlanInfo): PlanSummary {
  if (!plan.billing) {
    return { title: 'Rumo Pro', line: 'Liberado para todos por enquanto.', action: 'Ver assinatura' }
  }
  if (plan.tier === 'free') {
    return {
      title: 'Plano grátis',
      line: `Até ${FREE_MAX_HABITS} hábitos ativos.`,
      action: plan.trialAvailable ? `Teste ${TRIAL_DAYS} dias grátis` : 'Ver o Pro',
    }
  }
  if (plan.cancelAtPeriodEnd && plan.periodEnd) {
    return { title: 'Rumo Pro', line: `Cancelada. Segue até ${day(plan.periodEnd)}.`, action: 'Ver assinatura' }
  }
  if (plan.trialEndsAt) {
    return { title: 'Rumo Pro', line: `Teste grátis até ${day(plan.trialEndsAt)}.`, action: 'Ver assinatura' }
  }
  return {
    title: 'Rumo Pro',
    line: plan.periodEnd ? `Próxima cobrança em ${day(plan.periodEnd)}.` : 'Assinatura ativa.',
    action: 'Ver assinatura',
  }
}

/** O portal da Stripe só existe para quem já assinou alguma vez, e `trialAvailable` cai na primeira. */
export const hasInvoices = (plan: PlanInfo) => plan.billing && !plan.trialAvailable
