import { useEffect, useRef } from 'react'
import { unseenAchievements, type ACHIEVEMENTS } from '../lib/achievements'
import { commit, localEditCount } from './store'
import type { Snapshot } from './types'

function markSeen(ids: string[]) {
  commit(
    (current) => ({ ...current, achievementsSeen: [...current.achievementsSeen, ...ids] }),
    ids.map((id) => ({ method: 'PUT', path: `/achievements/${id}` })),
  )
}

/**
 * Avisa uma vez por conquista. O visto fica no banco, para valer em todos os aparelhos.
 * O que já estava alcançado ao atualizar o app, ou chegou de outro aparelho, entra em silêncio.
 */
export function useAchievements(
  snapshot: Snapshot,
  today: string,
  onEarned: (achievement: (typeof ACHIEVEMENTS)[number]) => void,
) {
  const editsSeen = useRef(localEditCount())
  // A foto marcada só chega na próxima volta: nada pode entrar duas vezes até lá.
  const handled = useRef(new Set<string>())

  useEffect(() => {
    const edits = localEditCount()
    const editedHere = edits !== editsSeen.current
    editsSeen.current = edits

    const unseen = unseenAchievements(snapshot, today).filter(({ id }) => !handled.current.has(id))
    if (unseen.length === 0) return

    unseen.forEach(({ id }) => handled.current.add(id))
    markSeen(unseen.map(({ id }) => id))
    if (editedHere) unseen.forEach(onEarned)
    // `onEarned` só enfileira um aviso: o que muda o resultado é a foto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, today])
}
