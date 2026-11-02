import { useSyncExternalStore } from 'react'

const UNDO_WINDOW_MS = 5000

export type UndoOffer = {
  message: string
  /** Sem `undo`, é só um aviso: some sozinho e não tem botão. */
  undo?: () => void
  /** Roda ao fim do prazo. Excluir só vai para a fila aqui, porque depois não dá para voltar. */
  expire?: () => void
}

let current: UndoOffer | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function replace(next: UndoOffer | null) {
  clearTimeout(timer)
  current = next
  if (next) timer = setTimeout(settleUndo, UNDO_WINDOW_MS)
  listeners.forEach((listener) => listener())
}

/** Encerra o prazo agora. O iPhone pode fechar o app escondido, então escondido também encerra. */
export function settleUndo() {
  const offer = current
  replace(null)
  offer?.expire?.()
}

export function offerUndo(offer: UndoOffer) {
  settleUndo()
  replace(offer)
}

export function takeUndo() {
  const offer = current
  replace(null)
  offer?.undo?.()
}

export function useUndoOffer() {
  return useSyncExternalStore(subscribe, () => current)
}
