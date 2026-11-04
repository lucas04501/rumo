import { describe, expect, it } from 'vitest'
import { complete } from './snapshot'
import {
  adjustGoal,
  cupsLeft,
  formatWater,
  logsOn,
  suggestedGoal,
  totalOn,
  waterSettingsOf,
} from './water'

const empty = complete({
  user: { name: 'Ana' },
  goals: [],
  milestones: [],
  habits: [],
  pauses: [],
  checks: [],
  days: [],
  tasks: [],
})

const log = (id: string, date: string, amountMl: number, loggedAt: string) => ({
  id,
  date,
  amountMl,
  loggedAt,
})

describe('água', () => {
  it('sugere 35 ml por kg, arredondado e dentro dos limites', () => {
    expect(suggestedGoal(70)).toBe(2_500)
    expect(suggestedGoal(63)).toBe(2_200)
    expect(suggestedGoal(10)).toBe(1_000)
    expect(suggestedGoal(300)).toBe(6_000)
  })

  it('ajusta a meta de 100 em 100 sem sair dos limites', () => {
    expect(adjustGoal(2_500, 2)).toBe(2_700)
    expect(adjustGoal(1_000, -1)).toBe(1_000)
    expect(adjustGoal(6_000, 1)).toBe(6_000)
  })

  it('usa a configuração editada por último', () => {
    const settings = [
      { id: 'a', goalMl: 2_000, cupMl: 250, habitId: null, updatedAt: '2026-11-04T10:00:00Z' },
      { id: 'b', goalMl: 3_000, cupMl: 300, habitId: null, updatedAt: '2026-11-04T11:00:00Z' },
    ]
    expect(waterSettingsOf({ ...empty, waterSettings: settings })?.id).toBe('b')
    expect(waterSettingsOf(empty)).toBeNull()
  })

  it('soma só o dia pedido, em ordem de horário', () => {
    const logs = [
      log('2', '2026-11-04', 500, '2026-11-04T15:00:00Z'),
      log('1', '2026-11-04', 250, '2026-11-04T09:00:00Z'),
      log('3', '2026-11-03', 1_000, '2026-11-03T09:00:00Z'),
    ]
    const today = logsOn({ ...empty, waterLogs: logs }, '2026-11-04')
    expect(today.map((item) => item.id)).toEqual(['1', '2'])
    expect(totalOn(logs, '2026-11-04')).toBe(750)
  })

  it('escreve em ml abaixo de um litro e em litros acima', () => {
    expect(formatWater(750)).toBe('750 ml')
    expect(formatWater(1_250)).toBe('1,25 L')
    expect(formatWater(2_000)).toBe('2 L')
  })

  it('conta os copos que faltam, arredondando para cima', () => {
    expect(cupsLeft(1_000, 2_500, 250)).toBe(6)
    expect(cupsLeft(2_400, 2_500, 250)).toBe(1)
    expect(cupsLeft(2_600, 2_500, 250)).toBe(0)
  })
})
