import { useSyncExternalStore } from 'react'

export type Layer = { kind: 'criar' | 'buscar'; draft?: string }

let current: Layer | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function replace(next: Layer | null) {
  current = next
  listeners.forEach((listener) => listener())
}

/** Criar e buscar abrem de qualquer tela, pelo botão, pelo teclado ou de dentro da busca. */
export const openLayer = (kind: Layer['kind'], draft?: string) => replace({ kind, draft })

export const closeLayer = () => replace(null)

export const useLayer = () => useSyncExternalStore(subscribe, () => current)
