import type { Snapshot } from '../data/types'
import { addDays, diffDays } from './dates'
import { periodStats } from './evolution'
import { checksOf, indexSnapshot, planOf } from './progress'
import { bestStreak } from './streaks'
import { finishedSessions, recordsOf } from './workouts'

export type Measure =
  | 'habits'
  | 'tasks'
  | 'streak'
  | 'perfectDays'
  | 'focus'
  | 'milestones'
  | 'goals'
  | 'workouts'
  | 'records'

type Achievement = { id: string; title: string; detail: string; measure: Measure; target: number }

export const ACHIEVEMENT_GROUPS: { measure: Measure; label: string }[] = [
  { measure: 'streak', label: 'Sequência' },
  { measure: 'perfectDays', label: 'Dias perfeitos' },
  { measure: 'habits', label: 'Hábitos' },
  { measure: 'tasks', label: 'Tarefas' },
  { measure: 'focus', label: 'Foco' },
  { measure: 'milestones', label: 'Marcos' },
  { measure: 'goals', label: 'Metas' },
  { measure: 'workouts', label: 'Treinos' },
  { measure: 'records', label: 'Recordes' },
]

// O ID vai para o banco: mudar o título é livre, mudar o ID faria a animação tocar de novo.
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'sequencia-7', title: 'Sete marés', detail: 'Sete dias seguidos em um hábito', measure: 'streak', target: 7 },
  { id: 'sequencia-30', title: 'Lua inteira', detail: '30 dias seguidos em um hábito', measure: 'streak', target: 30 },
  { id: 'sequencia-100', title: 'Cem marés', detail: '100 dias seguidos em um hábito', measure: 'streak', target: 100 },
  { id: 'perfeito-1', title: 'Maré cheia', detail: 'Feche um dia perfeito', measure: 'perfectDays', target: 1 },
  { id: 'perfeito-10', title: 'Dez cheias', detail: 'Feche 10 dias perfeitos', measure: 'perfectDays', target: 10 },
  { id: 'perfeito-50', title: 'Mar de almirante', detail: 'Feche 50 dias perfeitos', measure: 'perfectDays', target: 50 },
  { id: 'habitos-1', title: 'Primeiro nó', detail: 'Marque um hábito', measure: 'habits', target: 1 },
  { id: 'habitos-100', title: 'Mão calejada', detail: 'Marque 100 hábitos', measure: 'habits', target: 100 },
  { id: 'habitos-500', title: 'Lobo do mar', detail: 'Marque 500 hábitos', measure: 'habits', target: 500 },
  { id: 'tarefas-1', title: 'Zarpou', detail: 'Conclua uma tarefa', measure: 'tasks', target: 1 },
  { id: 'tarefas-50', title: 'Convés limpo', detail: 'Conclua 50 tarefas', measure: 'tasks', target: 50 },
  { id: 'tarefas-250', title: 'Porão em ordem', detail: 'Conclua 250 tarefas', measure: 'tasks', target: 250 },
  { id: 'foco-60', title: 'Mar calmo', detail: 'Some 1 hora de foco', measure: 'focus', target: 60 },
  { id: 'foco-600', title: 'Águas profundas', detail: 'Some 10 horas de foco', measure: 'focus', target: 600 },
  { id: 'foco-3000', title: 'Fundo do mar', detail: 'Some 50 horas de foco', measure: 'focus', target: 3000 },
  { id: 'marco-1', title: 'Porto à vista', detail: 'Alcance um marco', measure: 'milestones', target: 1 },
  { id: 'marco-10', title: 'Rota traçada', detail: 'Alcance 10 marcos', measure: 'milestones', target: 10 },
  { id: 'meta-1', title: 'Terra firme', detail: 'Conclua uma meta', measure: 'goals', target: 1 },
  { id: 'meta-3', title: 'Cartógrafo', detail: 'Conclua 3 metas', measure: 'goals', target: 3 },
  { id: 'treino-1', title: 'Primeira remada', detail: 'Conclua um treino', measure: 'workouts', target: 1 },
  { id: 'treino-10', title: 'Remador', detail: 'Conclua 10 treinos', measure: 'workouts', target: 10 },
  { id: 'treino-50', title: 'Mestre de convés', detail: 'Conclua 50 treinos', measure: 'workouts', target: 50 },
  { id: 'treino-100', title: 'Casco de aço', detail: 'Conclua 100 treinos', measure: 'workouts', target: 100 },
  { id: 'recorde-1', title: 'Âncora erguida', detail: 'Bata um recorde de carga', measure: 'records', target: 1 },
  { id: 'recorde-10', title: 'Mais fundo', detail: 'Bata 10 recordes de carga', measure: 'records', target: 10 },
]

/** Do primeiro registro até hoje. Aqui hoje conta: a conquista é do momento em que acontece. */
function activeDates(snapshot: Snapshot, today: string): string[] {
  const first = [
    ...snapshot.habits.map((habit) => habit.startDate),
    ...snapshot.tasks.map((task) => task.date),
    ...snapshot.focusSessions.map((session) => session.date),
    today,
  ].reduce((earliest, date) => (date < earliest ? date : earliest))

  return Array.from({ length: diffDays(today, first) + 1 }, (_, day) => addDays(first, day))
}

/** Os mesmos agregados da Evolução, sobre a vida inteira. */
export function totals(snapshot: Snapshot, today: string): Record<Measure, number> {
  const index = indexSnapshot(snapshot)
  const stats = periodStats(snapshot, index, activeDates(snapshot, today))
  const streaks = snapshot.habits.map((habit) =>
    bestStreak(planOf(habit, snapshot), checksOf(habit.id, snapshot), today),
  )

  return {
    habits: stats.habitDone,
    tasks: stats.taskDone,
    streak: Math.max(0, ...streaks),
    perfectDays: stats.perfectDays,
    focus: stats.focusMinutes,
    milestones: snapshot.milestones.filter((milestone) => milestone.doneAt).length,
    goals: snapshot.goals.filter((goal) => goal.status === 'done').length,
    workouts: finishedSessions(snapshot).length,
    records: recordsOf(snapshot).length,
  }
}

/** Alcançadas agora e ainda sem animação. A animação toca uma vez, então isto esvazia ao marcar. */
export function unseenAchievements(snapshot: Snapshot, today: string): Achievement[] {
  const reached = totals(snapshot, today)
  const seen = new Set(snapshot.achievementsSeen)
  return ACHIEVEMENTS.filter(
    ({ id, measure, target }) => reached[measure] >= target && !seen.has(id),
  )
}

export type AchievementView = Achievement & { value: number; earned: boolean }

/** Medalha ganha fica: desmarcar algo depois não a tira, porque um deslize não apaga a viagem. */
export function achievementViews(snapshot: Snapshot, today: string): AchievementView[] {
  const reached = totals(snapshot, today)
  const seen = new Set(snapshot.achievementsSeen)
  return ACHIEVEMENTS.map((achievement) => {
    const value = reached[achievement.measure]
    return { ...achievement, value, earned: seen.has(achievement.id) || value >= achievement.target }
  })
}
