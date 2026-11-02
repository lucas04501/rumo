import { describe, expect, it } from 'vitest'
import {
  finish,
  focusedMinutes,
  focusToday,
  formatClock,
  hasEnded,
  isOver,
  isPaused,
  leftMs,
  pause,
  plannedMinutes,
  restMinutes,
  resume,
  startFocus,
  startRest,
  tideLevel,
} from './focus'

const START = new Date(2026, 10, 2, 9, 0).getTime()
const MINUTE = 60_000
const timer = (round = 0) => startFocus('sessao', 'tarefa', 'pomodoro', round, START)

describe('tempo do foco', () => {
  it('o restante sai do relógio, mesmo com o app suspenso', () => {
    expect(leftMs(timer(), START + 10 * MINUTE)).toBe(15 * MINUTE)
    expect(leftMs(timer(), START + 90 * MINUTE)).toBe(0)
    expect(hasEnded(timer(), START + 24 * MINUTE)).toBe(false)
    expect(hasEnded(timer(), START + 25 * MINUTE)).toBe(true)
  })

  it('pausar congela o restante, por mais tempo que passe', () => {
    const paused = pause(timer(), START + 10 * MINUTE)
    expect(isPaused(paused)).toBe(true)
    expect(leftMs(paused, START + 300 * MINUTE)).toBe(15 * MINUTE)
    expect(hasEnded(paused, START + 300 * MINUTE)).toBe(false)

    const resumed = resume(paused, START + 300 * MINUTE)
    expect(isPaused(resumed)).toBe(false)
    expect(leftMs(resumed, START + 310 * MINUTE)).toBe(5 * MINUTE)
  })

  it('terminar soma um bloco ao foco, mas não à pausa', () => {
    const over = finish(timer())
    expect(isOver(over)).toBe(true)
    expect(over.round).toBe(1)
    expect(finish(startRest(over, START)).round).toBe(1)
  })

  it('conta os minutos feitos para registrar', () => {
    expect(focusedMinutes(timer(), START + 7.5 * MINUTE)).toBe(7)
    expect(focusedMinutes(timer(), START + 30 * 1000)).toBe(0)
    expect(plannedMinutes(timer())).toBe(25)
  })

  it('a pausa longa vem a cada quatro blocos', () => {
    expect(restMinutes({ rhythmId: 'pomodoro', round: 1 })).toBe(5)
    expect(restMinutes({ rhythmId: 'longo', round: 3 })).toBe(10)
    expect(restMinutes({ rhythmId: 'pomodoro', round: 4 })).toBe(15)
  })

  it('a maré sobe no foco e desce na pausa', () => {
    expect(tideLevel(timer(), START + 12.5 * MINUTE)).toBeCloseTo(0.5)
    const rest = startRest(finish(timer()), START)
    expect(tideLevel(rest, START)).toBeCloseTo(1)
    expect(tideLevel(rest, START + 5 * MINUTE)).toBeCloseTo(0)
  })

  it('usa o dia local do início', () => {
    expect(timer().date).toBe('2026-11-02')
  })
})

describe('apresentação', () => {
  it('formata o relógio sem pular o último segundo', () => {
    expect(formatClock(25 * MINUTE)).toBe('25:00')
    expect(formatClock(61_000)).toBe('01:01')
    expect(formatClock(400)).toBe('00:01')
    expect(formatClock(0)).toBe('00:00')
  })

  it('soma só os blocos do dia', () => {
    const session = { id: '1', taskId: null, startedAt: '', plannedMinutes: 25 }
    const sessions = [
      { ...session, date: '2026-11-02', minutes: 25 },
      { ...session, date: '2026-11-02', minutes: 12 },
      { ...session, date: '2026-11-01', minutes: 50 },
    ]
    expect(focusToday(sessions, '2026-11-02')).toEqual({ blocks: 2, minutes: 37 })
  })
})
