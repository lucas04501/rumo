import type { Snapshot, WaterLog, WaterSettings } from '../data/types'

/** Referência geral, não orientação médica: o texto da tela diz isso. */
export const ML_PER_KG = 35
export const MIN_GOAL_ML = 1_000
export const MAX_GOAL_ML = 6_000
export const GOAL_STEP_ML = 100
export const CUP_SIZES = [200, 250, 300, 500]
export const BOTTLE_ML = 500

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const roundTo = (value: number, step: number) => Math.round(value / step) * step

/** Meta sugerida pelo peso, arredondada para 100 ml e dentro dos limites da tela. */
export function suggestedGoal(weightKg: number): number {
  return clamp(roundTo(weightKg * ML_PER_KG, GOAL_STEP_ML), MIN_GOAL_ML, MAX_GOAL_ML)
}

export function adjustGoal(goalMl: number, steps: number): number {
  return clamp(goalMl + steps * GOAL_STEP_ML, MIN_GOAL_ML, MAX_GOAL_ML)
}

/** Dois aparelhos sem internet podem criar uma configuração cada: vale a editada por último. */
export function waterSettingsOf(snapshot: Snapshot): WaterSettings | null {
  return snapshot.waterSettings.reduce<WaterSettings | null>(
    (latest, item) => (!latest || item.updatedAt > latest.updatedAt ? item : latest),
    null,
  )
}

export function logsOn(snapshot: Snapshot, date: string): WaterLog[] {
  return snapshot.waterLogs
    .filter((log) => log.date === date)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
}

export function totalOn(logs: WaterLog[], date: string): number {
  return logs.reduce((sum, log) => (log.date === date ? sum + log.amountMl : sum), 0)
}

/** "1,25 L" ou "750 ml": abaixo de um litro, ml lê melhor. */
export function formatWater(ml: number): string {
  if (ml < 1_000) return `${ml} ml`
  const liters = (ml / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  return `${liters} L`
}

/** O que falta para a meta, em copos do tamanho de sempre. Zero quando já bateu. */
export function cupsLeft(totalMl: number, goalMl: number, cupMl: number): number {
  return Math.max(0, Math.ceil((goalMl - totalMl) / cupMl))
}
