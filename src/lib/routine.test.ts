import { describe, expect, it } from 'vitest'
import type { RoutineStep, Snapshot } from '../data/types'
import {
  clockOf,
  currentStep,
  doneOn,
  nextStep,
  routineCheckId,
  routineOn,
  stepCount,
  stepsOn,
  suggestTime,
} from './routine'

const step = (id: string, time: string, weekday = 1, position = 0): RoutineStep => ({
  id,
  weekday,
  time,
  title: id,
  position,
})

const STEPS = [step('dormir', '22:30'), step('acordar', '06:30'), step('cafe', '07:00')]

describe('rotina', () => {
  it('cada dia da semana tem a sua lista, em ordem de horário', () => {
    const steps = [...STEPS, step('terca', '09:00', 2)]
    expect(stepsOn(steps, 1).map((item) => item.id)).toEqual(['acordar', 'cafe', 'dormir'])
    expect(stepsOn(steps, 2).map((item) => item.id)).toEqual(['terca'])
    expect(stepsOn(steps, 3)).toEqual([])
    expect(stepCount(steps, 1)).toBe(3)
  })

  it('desempata pelo lugar na lista', () => {
    const steps = [step('b', '08:00', 1, 1), step('a', '08:00', 1, 0)]
    expect(stepsOn(steps, 1).map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('acha o passo de agora e o próximo', () => {
    const steps = stepsOn(STEPS, 1)
    expect(currentStep(steps, '06:00')).toBeNull()
    expect(currentStep(steps, '06:30')?.id).toBe('acordar')
    expect(currentStep(steps, '12:00')?.id).toBe('cafe')
    expect(nextStep(steps, '12:00')?.id).toBe('dormir')
    expect(nextStep(steps, '23:00')).toBeNull()
  })

  it('sugere o horário do próximo passo sem passar da meia-noite', () => {
    expect(suggestTime([])).toBe('07:00')
    expect(suggestTime([step('a', '08:45')])).toBe('09:15')
    expect(suggestTime([step('a', '23:50')])).toBe('23:59')
  })

  it('formata a hora local', () => {
    expect(clockOf(new Date(2026, 10, 2, 7, 5))).toBe('07:05')
  })

  it('o check tem o mesmo ID em qualquer aparelho, e é um por dia', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    expect(routineCheckId(id, '2026-11-02')).toBe('20261102-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    expect(routineCheckId(id, '2026-11-02')).not.toBe(routineCheckId(id, '2026-11-09'))
  })

  it('marca o passo só no dia em que foi feito', () => {
    const checks = [
      { id: '1', stepId: 'cafe', date: '2026-11-02', doneAt: '2026-11-02T10:00:00Z' },
      { id: '2', stepId: 'acordar', date: '2026-11-02', doneAt: null },
    ]
    expect([...doneOn(checks, '2026-11-02')]).toEqual(['cafe'])
    expect(doneOn(checks, '2026-11-09').size).toBe(0)

    const snapshot = { routineSteps: STEPS, routineChecks: checks } as unknown as Snapshot
    expect(routineOn(snapshot, '2026-11-02').map((line) => line.done)).toEqual([false, true, false])
    expect(routineOn(snapshot, '2026-11-09').some((line) => line.done)).toBe(false)
    expect(routineOn(snapshot, '2026-11-03')).toEqual([])
  })
})
