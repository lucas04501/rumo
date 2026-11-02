import type { FocusSession } from '../data/types'
import { toIsoDate } from './dates'

export type Rhythm = { id: string; label: string; focus: number; rest: number }

export const RHYTHMS: Rhythm[] = [
  { id: 'curto', label: '15 + 3', focus: 15, rest: 3 },
  { id: 'pomodoro', label: '25 + 5', focus: 25, rest: 5 },
  { id: 'longo', label: '50 + 10', focus: 50, rest: 10 },
]

export const DEFAULT_RHYTHM = 'pomodoro'

const LONG_REST_EVERY = 4
const LONG_REST_MINUTES = 15
const MINUTE_MS = 60_000

/**
 * O tempo vive em horários, não em contagem: o iPhone suspende o app, e ao voltar
 * o restante sai da diferença para o relógio.
 */
export type FocusTimer = {
  sessionId: string
  taskId: string | null
  rhythmId: string
  phase: 'focus' | 'rest'
  /** Blocos de foco concluídos nesta série. */
  round: number
  date: string
  startedAt: string
  totalMs: number
  /** Horário do fim enquanto corre. Nulo em pausa ou encerrado. */
  endsAt: number | null
  /** Quanto falta enquanto está em pausa. Zero quando o bloco terminou. */
  leftMs: number
}

const rhythmOf = (id: string) => RHYTHMS.find((rhythm) => rhythm.id === id) ?? RHYTHMS[1]

export function startFocus(
  sessionId: string,
  taskId: string | null,
  rhythmId: string,
  round: number,
  now: number,
): FocusTimer {
  const totalMs = rhythmOf(rhythmId).focus * MINUTE_MS
  return {
    sessionId,
    taskId,
    rhythmId,
    phase: 'focus',
    round,
    date: toIsoDate(new Date(now)),
    startedAt: new Date(now).toISOString(),
    totalMs,
    endsAt: now + totalMs,
    leftMs: totalMs,
  }
}

export function restMinutes(timer: Pick<FocusTimer, 'rhythmId' | 'round'>): number {
  return timer.round % LONG_REST_EVERY === 0 ? LONG_REST_MINUTES : rhythmOf(timer.rhythmId).rest
}

export function startRest(timer: FocusTimer, now: number): FocusTimer {
  const totalMs = restMinutes(timer) * MINUTE_MS
  return {
    ...timer,
    phase: 'rest',
    startedAt: new Date(now).toISOString(),
    totalMs,
    endsAt: now + totalMs,
    leftMs: totalMs,
  }
}

export const leftMs = (timer: FocusTimer, now: number) =>
  timer.endsAt === null ? timer.leftMs : Math.max(0, timer.endsAt - now)

export const isPaused = (timer: FocusTimer) => timer.endsAt === null && timer.leftMs > 0
export const isOver = (timer: FocusTimer) => timer.endsAt === null && timer.leftMs === 0
export const hasEnded = (timer: FocusTimer, now: number) =>
  timer.endsAt !== null && now >= timer.endsAt

export const pause = (timer: FocusTimer, now: number): FocusTimer => ({
  ...timer,
  endsAt: null,
  leftMs: leftMs(timer, now),
})

export const resume = (timer: FocusTimer, now: number): FocusTimer => ({
  ...timer,
  endsAt: now + timer.leftMs,
})

/** Fim do bloco. Um foco concluído soma à série, para escolher a pausa. */
export const finish = (timer: FocusTimer): FocusTimer => ({
  ...timer,
  round: timer.phase === 'focus' ? timer.round + 1 : timer.round,
  endsAt: null,
  leftMs: 0,
})

export const focusedMinutes = (timer: FocusTimer, now: number) =>
  Math.floor((timer.totalMs - leftMs(timer, now)) / MINUTE_MS)

export const plannedMinutes = (timer: FocusTimer) => Math.round(timer.totalMs / MINUTE_MS)

/** Parte do bloco já percorrida, de 0 a 1. É o nível da maré na tela de foco. */
export function tideLevel(timer: FocusTimer, now: number): number {
  const passed = 1 - leftMs(timer, now) / timer.totalMs
  return timer.phase === 'focus' ? passed : 1 - passed
}

export function formatClock(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export function focusToday(sessions: FocusSession[], date: string) {
  const today = sessions.filter((session) => session.date === date)
  return {
    blocks: today.length,
    minutes: today.reduce((sum, session) => sum + session.minutes, 0),
  }
}
