import { describe, expect, it } from 'vitest'
import type { Snapshot, Task, TaskRule } from '../data/types'
import { boardColumns, columnOf, dueLabel, placeOn } from './board'
import { complete } from './snapshot'
import { xpOf } from './progress'
import { newTask, occurrenceId, upsertTask } from './tasks'

const TODAY = '2026-11-02'
const AT = '2026-11-02T12:00:00.000Z'

const task = (id: string, date: string, fields: Partial<Task> = {}) =>
  newTask({ id, date, title: id, position: 0, ...fields })

const snapshotWith = (tasks: Task[], taskRules: TaskRule[] = []): Snapshot =>
  complete({
    user: { name: '' },
    goals: [],
    milestones: [],
    habits: [],
    pauses: [],
    checks: [],
    tasks,
    taskRules,
    days: [],
  })

const rule: TaskRule = {
  id: '11111111-2222-3333-4444-555555555555',
  title: 'Regar',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  monthDay: null,
  startDate: '2026-10-01',
  endDate: null,
  priority: 'normal',
  goalId: null,
  position: 0,
}

describe('placeOn', () => {
  it('concluir só preenche doneAt, e voltar tira', () => {
    const done = placeOn(task('a', TODAY), 'done', AT)
    expect(done.doneAt).toBe(AT)
    expect(columnOf(done)).toBe('done')
    expect(placeOn(done, 'todo', AT)).toMatchObject({ doneAt: null, startedAt: null })
  })

  it('mover para a mesma coluna não cria escrita nem muda a data de conclusão', () => {
    const done = task('a', TODAY, { doneAt: '2026-11-01T10:00:00.000Z' })
    expect(placeOn(done, 'done', AT)).toBe(done)
    const doing = task('b', TODAY, { startedAt: '2026-11-01T10:00:00.000Z' })
    expect(placeOn(doing, 'doing', AT)).toBe(doing)
  })

  it('voltar de Feito para Fazendo mantém o começo', () => {
    const started = task('a', TODAY, { startedAt: '2026-11-01T10:00:00.000Z', doneAt: AT })
    expect(placeOn(started, 'doing', AT)).toMatchObject({
      startedAt: '2026-11-01T10:00:00.000Z',
      doneAt: null,
    })
  })

  it('o XP conta a tarefa uma vez só, por mais vezes que ela seja movida', () => {
    let row = task('a', TODAY)
    const base = xpOf(snapshotWith([row]))
    for (const column of ['done', 'done', 'doing', 'done', 'todo', 'done'] as const) {
      row = placeOn(row, column, AT)
    }
    expect(xpOf(snapshotWith([row])) - base).toBe(5)
  })

  it('ocorrência sem linha grava sempre o mesmo ID, então mover não duplica', () => {
    const { todo } = boardColumns(snapshotWith([], [rule]), TODAY)
    const moved = placeOn(todo[0], 'doing', AT)
    expect(moved.id).toBe(occurrenceId(rule.id, TODAY))

    const tasks = upsertTask(upsertTask([], moved), placeOn(moved, 'done', AT))
    expect(tasks).toHaveLength(1)
    expect(boardColumns(snapshotWith(tasks, [rule]), TODAY).done).toHaveLength(1)
    expect(boardColumns(snapshotWith(tasks, [rule]), TODAY).todo).toHaveLength(0)
  })
})

describe('boardColumns', () => {
  it('separa por coluna e traz atrasadas, a semana e o concluído recente', () => {
    const { todo, doing, done } = boardColumns(
      snapshotWith([
        task('atrasada', '2026-10-20'),
        task('hoje', TODAY),
        task('semana', '2026-11-08'),
        task('longe', '2026-11-09'),
        task('fazendo', TODAY, { startedAt: AT }),
        task('feita', '2026-10-30', { doneAt: '2026-10-30T12:00:00.000Z' }),
        task('feita-antiga', '2026-10-20', { doneAt: '2026-10-20T12:00:00.000Z' }),
      ]),
      TODAY,
    )

    expect(todo.map((item) => item.id)).toEqual(['hoje', 'atrasada', 'semana'])
    expect(doing.map((item) => item.id)).toEqual(['fazendo'])
    expect(done.map((item) => item.id)).toEqual(['feita'])
  })

  it('ocorrência de hoje aparece, e a de amanhã, sem linha, não', () => {
    const { todo } = boardColumns(snapshotWith([], [rule]), TODAY)
    expect(todo.map((item) => item.date)).toEqual([TODAY])
  })

  it('ocorrência pulada fica de fora', () => {
    const skipped = task(occurrenceId(rule.id, TODAY), TODAY, { ruleId: rule.id, skippedAt: AT })
    expect(boardColumns(snapshotWith([skipped], [rule]), TODAY).todo).toEqual([])
  })

  it('tarefa começada fica no quadro depois que o dia passa, mesmo repetindo', () => {
    const started = task(occurrenceId(rule.id, '2026-10-20'), '2026-10-20', {
      ruleId: rule.id,
      startedAt: AT,
    })
    expect(boardColumns(snapshotWith([started], [rule]), TODAY).doing).toHaveLength(1)
  })
})

describe('dueLabel', () => {
  it('fala a data do jeito curto', () => {
    expect(dueLabel(TODAY, TODAY, false)).toBe('Hoje')
    expect(dueLabel('2026-11-03', TODAY, false)).toBe('Amanhã')
    expect(dueLabel('2026-10-30', TODAY, false)).toBe('Atrasada, 30/10')
    expect(dueLabel('2026-10-30', TODAY, true)).toBe('Sex, 30 de out')
  })
})
