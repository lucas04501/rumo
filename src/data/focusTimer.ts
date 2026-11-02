import { useSyncExternalStore } from 'react'
import type { FocusTimer } from '../lib/focus'

const TIMER_KEY = 'rumo:foco'

function read(): FocusTimer | null {
  try {
    const saved = localStorage.getItem(TIMER_KEY)
    return saved ? (JSON.parse(saved) as FocusTimer) : null
  } catch {
    return null
  }
}

// O relógio em andamento é deste aparelho, como a preferência de som. Só a sessão
// terminada vai para o banco.
let timer = read()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getFocusTimer = () => timer

export function setFocusTimer(next: FocusTimer | null) {
  timer = next
  try {
    if (next) localStorage.setItem(TIMER_KEY, JSON.stringify(next))
    else localStorage.removeItem(TIMER_KEY)
  } catch {
    // Sem armazenamento, o foco vale até fechar o app.
  }
  listeners.forEach((listener) => listener())
}

export const forgetFocusTimer = () => setFocusTimer(null)

export function useFocusTimer() {
  return useSyncExternalStore(subscribe, getFocusTimer)
}
