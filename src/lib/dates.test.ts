import { describe, expect, it } from 'vitest'
import { addDays, diffDays, formatLongDate, formatShortDate, hoje, weekOf, weekdayOf } from './dates'

describe('hoje', () => {
  it('continua no mesmo dia às 23h30 em São Paulo, quando em UTC já é amanhã', () => {
    const lateNight = new Date('2026-11-03T02:30:00Z')
    expect(lateNight.toISOString().slice(0, 10)).toBe('2026-11-03')
    expect(hoje(lateNight)).toBe('2026-11-02')
  })

  it('vira o dia à meia-noite local', () => {
    expect(hoje(new Date('2026-11-03T03:00:00Z'))).toBe('2026-11-03')
  })
})

describe('contas com dias', () => {
  it('atravessa fim de mês e de ano', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('conta a diferença em dias inteiros', () => {
    expect(diffDays('2026-11-09', '2026-11-02')).toBe(7)
    expect(diffDays('2026-11-02', '2026-11-02')).toBe(0)
  })

  it('identifica o dia da semana', () => {
    expect(weekdayOf('2026-11-01')).toBe(0)
    expect(weekdayOf('2026-11-02')).toBe(1)
  })

  it('monta a semana de domingo a sábado, mesmo atravessando o mês', () => {
    const week = weekOf('2026-11-04')
    expect(week[0]).toBe('2026-11-01')
    expect(week[6]).toBe('2026-11-07')
    expect(weekOf('2026-11-01')[0]).toBe('2026-11-01')
    expect(weekOf('2026-12-01')[0]).toBe('2026-11-29')
  })

  it('escreve a data curta', () => {
    expect(formatShortDate('2026-11-02')).toBe('02/11')
  })

  it('escreve a data por extenso em português', () => {
    expect(formatLongDate('2026-11-02')).toBe('Segunda-feira, 2 de novembro')
  })
})
