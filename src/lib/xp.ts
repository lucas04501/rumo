export const XP = {
  habit: 10,
  task: 5,
  tailwind: 15,
  perfectDay: 30,
  milestone: 50,
  goal: 200,
} as const

const TAILWIND_ODDS = 8

// FNV-1a: o "vento a favor" sai dos dados, não de um sorteio. Assim o mesmo
// hábito no mesmo dia dá sempre o mesmo resultado, e desmarcar e remarcar não
// rende XP extra.
function hash(text: string): number {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 0x01000193)
  }
  return value >>> 0
}

export function hasTailwind(habitId: string, date: string): boolean {
  return hash(`${habitId}|${date}`) % TAILWIND_ODDS === 0
}

export type XpInput = {
  checks: { habitId: string; date: string }[]
  tasksDone: number
  perfectDays: number
  milestonesDone: number
  goalsDone: number
}

export function totalXp({ checks, tasksDone, perfectDays, milestonesDone, goalsDone }: XpInput): number {
  const fromChecks = checks.reduce(
    (sum, { habitId, date }) => sum + XP.habit + (hasTailwind(habitId, date) ? XP.tailwind : 0),
    0,
  )

  return (
    fromChecks +
    tasksDone * XP.task +
    perfectDays * XP.perfectDay +
    milestonesDone * XP.milestone +
    goalsDone * XP.goal
  )
}

// As patentes antigas mantêm o limite, para ninguém descer ao ganhar novas opções.
const RANKS = [
  { name: 'Grumete', from: 0 },
  { name: 'Marinheiro', from: 500 },
  { name: 'Timoneiro', from: 1_200 },
  { name: 'Imediato', from: 2_000 },
  { name: 'Navegador', from: 3_500 },
  { name: 'Capitão', from: 6_000 },
  { name: 'Comodoro', from: 10_000 },
  { name: 'Almirante', from: 15_000 },
  { name: 'Grande Almirante', from: 25_000 },
  { name: 'Lenda dos Mares', from: 40_000 },
]

export type Rank = {
  name: string
  /** Posição na escada de patentes, a partir de 0. */
  level: number
  next: string | null
  /** Avanço até a próxima patente, de 0 a 1. */
  progress: number
}

export function rankFor(xp: number): Rank {
  const level = RANKS.findLastIndex((rank) => xp >= rank.from)
  const current = RANKS[level]
  const next = RANKS[level + 1]
  if (!next) return { name: current.name, level, next: null, progress: 1 }
  return {
    name: current.name,
    level,
    next: next.name,
    progress: (xp - current.from) / (next.from - current.from),
  }
}
