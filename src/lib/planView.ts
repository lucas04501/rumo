import type { Snapshot } from '../data/types'
import { effectiveTier, limitsOf } from './plan'

export type PlanView = { habitRoom: boolean; treinos: boolean }

/**
 * O que o plano permite criar agora, só para a tela. Quem recusa de verdade é o servidor.
 * `habitRoom` conta os hábitos ativos: arquivar libera vaga.
 */
export function planView(snapshot: Snapshot | undefined, now = new Date()): PlanView {
  // Sem foto ainda, não há o que recusar: o servidor decide.
  if (!snapshot) return { habitRoom: true, treinos: true }

  const { maxHabits, treinos } = limitsOf(effectiveTier(snapshot.plan, now))
  const active = snapshot.habits.filter((habit) => !habit.archivedAt).length
  return { habitRoom: maxHabits === null || active < maxHabits, treinos }
}
