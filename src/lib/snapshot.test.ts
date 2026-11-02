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

  it('mantém os dados de uma foto parcial', () => {
    const note = { id: 'n', goalId: null, title: '', body: 'x', pinned: false, updatedAt: '' }
    expect(complete({ ...base, tasks: [], notes: [note] }).notes).toEqual([note])
  })

  it('devolve a mesma foto quando ela já está completa', () => {
    const full = complete({ ...base, tasks: [] })
    expect(complete(full)).toBe(full)
  })
})
