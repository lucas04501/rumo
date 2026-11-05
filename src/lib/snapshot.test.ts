import { describe, expect, it } from 'vitest'
import { complete } from './snapshot'
import { summarizeDay, xpOf } from './progress'

const base = {
  user: { name: 'Ana' },
  goals: [],
  milestones: [],
  habits: [],
  pauses: [],
  checks: [],
  days: [],
}

const oldTask = {
  id: 't',
  date: '2026-11-02',
  title: 'Antiga',
  goalId: null,
  doneAt: '2026-11-02T12:00:00Z',
  position: 0,
}

describe('complete', () => {
  it('abre uma foto de antes das notas e das tarefas novas', () => {
    const snapshot = complete({ ...base, tasks: [oldTask] })

    expect(snapshot.notes).toEqual([])
    expect(snapshot.taskRules).toEqual([])
    expect(snapshot.subtasks).toEqual([])
    expect(snapshot.focusSessions).toEqual([])
    expect(snapshot.routineSteps).toEqual([])
    expect(snapshot.routineChecks).toEqual([])
    expect(snapshot.tasks[0]).toMatchObject({ priority: 'normal', ruleId: null, skippedAt: null })
    expect(summarizeDay(snapshot, oldTask.date).done).toBe(1)
    expect(xpOf(snapshot)).toBeGreaterThan(0)
  })

  it('completa uma foto da versão com foco, mas sem rotina', () => {
    const previous = { ...base, tasks: [], notes: [], taskRules: [], subtasks: [], focusSessions: [] }
    expect(complete(previous).routineSteps).toEqual([])
  })

  it('completa uma foto da versão com conquistas, mas sem treinos', () => {
    const previous = { ...base, tasks: [], achievementsSeen: ['habitos-1'] }
    const snapshot = complete(previous)
    expect(snapshot.achievementsSeen).toEqual(['habitos-1'])
    expect(snapshot.workoutPlans).toEqual([])
    expect(snapshot.sessionSets).toEqual([])
    expect(xpOf(snapshot)).toBe(0)
  })

  it('completa uma foto da versão com treinos, mas sem água', () => {
    const exercise = { id: 'c', name: 'Remada', muscle: 'Costas', instructions: '' }
    const previous = complete({ ...base, tasks: [] })
    const { waterSettings: _settings, waterLogs: _logs, plan: _plan, ...withoutWater } = previous
    const snapshot = complete({ ...withoutWater, customExercises: [exercise] })
    expect(snapshot.customExercises).toEqual([exercise])
    expect(snapshot.waterSettings).toEqual([])
    expect(snapshot.waterLogs).toEqual([])
  })

  it('completa uma foto da versão com água, mas sem plano, sem apagar os copos', () => {
    const log = { id: 'l', date: '2026-11-03', amountMl: 250, loggedAt: '2026-11-03T12:00:00Z' }
    const previous = { ...complete({ ...base, tasks: [] }), waterLogs: [log] }
    const { plan: _plan, ...withoutPlan } = previous
    const snapshot = complete(withoutPlan)
    expect(snapshot.waterLogs).toEqual([log])
    expect(snapshot.plan.tier).toBe('pro')
  })

  it('mantém os dados de uma foto parcial', () => {
    const note = { id: 'n', goalId: null, title: '', body: 'x', pinned: false, updatedAt: '' }
    expect(complete({ ...base, tasks: [], notes: [note] }).notes).toEqual([note])
  })

  it('devolve a mesma foto quando ela já está completa', () => {
    const full = complete({ ...base, tasks: [] })
    expect(complete(full)).toBe(full)
  })
})
