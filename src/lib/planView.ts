import type { Snapshot } from '../data/types'
import { effectiveTier, limitsOf } from './plan'

/** `pro`: as áreas do Pro estão abertas para criar e editar. */
export type PlanView = { habitRoom: boolean; pro: boolean }

export const PLAN_MESSAGES = {
  habits: 'No plano grátis, são até 3 hábitos ativos. Veja o Pro em Mais, Assinatura.',
  pro: 'Isto é do plano Pro. O que você já criou continua aqui. Veja em Mais, Assinatura.',
}

/**
 * O que o plano permite criar agora, só para a tela. Quem recusa de verdade é o servidor.
 * `habitRoom` conta os hábitos ativos: arquivar libera vaga.
 */
export function planView(snapshot: Snapshot | undefined, now = new Date()): PlanView {
  // Sem foto ainda, não há o que recusar: o servidor decide.
  if (!snapshot) return { habitRoom: true, pro: true }

  const { maxHabits, proAreas } = limitsOf(effectiveTier(snapshot.plan, now))
  const active = snapshot.habits.filter((habit) => !habit.archivedAt).length
  return { habitRoom: maxHabits === null || active < maxHabits, pro: proAreas }
}

/** Telas das áreas do Pro. Ficam visíveis no grátis, com a marca "Pro". */
export const PRO_SCREENS = [
  '/mes',
  '/semana',
  '/quadro',
  '/notas',
  '/rotina',
  '/evolucao',
  '/conquistas',
  '/foco',
  '/treinos',
  '/treino',
  '/agua',
]

export const isProScreen = (path: string) =>
  PRO_SCREENS.some((screen) => path === screen || path.startsWith(`${screen}/`))

/**
 * Se a pessoa tem algo seu na área, para abrir em leitura em vez do convite.
 * Evolução e Conquistas são calculadas dos outros dados, não guardam nada próprio:
 * no grátis, mostram só o convite.
 */
export function hasAreaData(snapshot: Snapshot, path: string): boolean {
  const area = path.split('/')[1]
  switch (area) {
    case 'mes':
    case 'semana':
    case 'quadro':
      return snapshot.tasks.length > 0 || snapshot.taskRules.length > 0
    case 'notas':
      return snapshot.notes.length > 0 || snapshot.days.some((day) => day.note)
    case 'rotina':
      return snapshot.routineSteps.length > 0
    case 'foco':
      return snapshot.focusSessions.length > 0
    case 'agua':
      return snapshot.waterLogs.length > 0 || snapshot.waterSettings.length > 0
    case 'treinos':
    case 'treino':
      return (
        snapshot.workoutPlans.length > 0 ||
        snapshot.workoutSessions.length > 0 ||
        snapshot.customExercises.length > 0
      )
    default:
      return false
  }
}
