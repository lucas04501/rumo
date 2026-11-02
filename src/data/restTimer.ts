import { useSyncExternalStore } from 'react'

const REST_KEY = 'rumo:descanso'

function read(): number | null {
  try {
    const saved = localStorage.getItem(REST_KEY)
    return saved ? Number(saved) : null
  } catch {
    return null
  }
}

// Como o relógio do foco: guarda o horário do fim, porque o iPhone suspende o app.
let endsAt = read()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setRestTimer(next: number | null) {
  endsAt = next
  try {
    if (next) localStorage.setItem(REST_KEY, String(next))
    else localStorage.removeItem(REST_KEY)
  } catch {
    // Sem armazenamento, o descanso vale até fechar o app.
  }
  listeners.forEach((listener) => listener())
}

export const forgetRestTimer = () => setRestTimer(null)

export const useRestTimer = () => useSyncExternalStore(subscribe, () => endsAt)
