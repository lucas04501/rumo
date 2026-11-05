import { describe, expect, it } from 'vitest'
import type { Snapshot, TaskRule } from '../data/types'
import { searchAll } from './search'
import { complete } from './snapshot'
import { newTask, occurrenceId } from './tasks'

const TODAY = '2026-11-02'

const rule: TaskRule = {
  id: '11111111-2222-3333-4444-555555555555',
  title: 'Regar a horta',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  monthDay: null,
  startDate: '2026-10-01',
  endDate: null,
  priority: 'normal',
  goalId: null,
  position: 0,
}

const snapshot: Snapshot = complete({
  user: { name: '' },
  goals: [
    { id: 'g', title: 'Maratona', why: null, targetDate: null, status: 'active', doneAt: null, position: 0 },
    { id: 'x', title: 'Maratona antiga', why: null, targetDate: null, status: 'archived', doneAt: null, position: 1 },
  ],
  milestones: [],
  habits: [
    { id: 'h', title: 'Correr na maré', icon: 'run', weekdays: [1], startDate: TODAY, goalId: null, archivedAt: null, position: 0 },
  ],
  pauses: [],
  checks: [],
  tasks: [
    newTask({ id: 'feita', date: TODAY, title: 'Comprar tênis', position: 0, doneAt: `${TODAY}T10:00:00Z` }),
    newTask({ id: 'aberta', date: '2026-10-01', title: 'Comprar meias', position: 1 }),
    newTask({ id: 'pulada', date: TODAY, title: 'Comprar nada', position: 2, skippedAt: `${TODAY}T10:00:00Z` }),
  ],
  taskRules: [rule],
  notes: [
    { id: 'n', goalId: null, title: 'Treino', body: 'Rodagem na orla', pinned: false, updatedAt: '' },
  ],
  days: [],
  workoutPlans: [
    { id: 'p', title: 'Peito e tríceps', weekdays: [1], habitId: null, goalId: null, archivedAt: null, position: 0 },
    { id: 'a', title: 'Peito antigo', weekdays: [], habitId: null, goalId: null, archivedAt: `${TODAY}T10:00:00Z`, position: 1 },
  ],
  planExercises: [],
  workoutSessions: [],
  sessionSets: [],
  customExercises: [],
  waterSettings: [],
  waterLogs: [],
  plan: { tier: 'pro', trialEndsAt: null, periodEnd: null, cancelAtPeriodEnd: false },
})

describe('searchAll', () => {
  const ids = (query: string) => searchAll(snapshot, query, TODAY).map(({ id }) => id)

  it('não procura sem texto', () => {
    expect(searchAll(snapshot, '  ', TODAY)).toEqual([])
  })

  it('ignora acento e maiúscula', () => {
    expect(ids('MARE')).toEqual(['h'])
  })

  it('tira meta arquivada e ocorrência pulada', () => {
    expect(ids('maratona')).toEqual(['g'])
    expect(ids('comprar')).toEqual(['aberta', 'feita'])
  })

  it('acha a regra e a ocorrência de hoje, que não tem linha', () => {
    expect(ids('regar')).toEqual([occurrenceId(rule.id, TODAY), rule.id])
  })

  it('acha ficha de treino e tira a arquivada', () => {
    expect(ids('peito')).toEqual(['p'])
  })

  it('procura também no texto da nota', () => {
    expect(searchAll(snapshot, 'orla', TODAY)[0]).toMatchObject({ kind: 'note', title: 'Treino' })
  })
})
