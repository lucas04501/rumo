import { useEffect, useRef } from 'react'
import type { Rank } from '../lib/xp'
import { readRankSeen, writeRankSeen } from './rankSeen'
import { localEditCount } from './store'
import type { Snapshot } from './types'

/**
 * Avisa uma vez quando este aparelho sobe de patente. Primeira abertura, patente
 * que chegou de outro aparelho e remarcar um item depois de desmarcar ficam em silêncio.
 */
export function useRankUp(snapshot: Snapshot, rank: Rank, onRankUp: (rank: Rank) => void) {
  const editsSeen = useRef(localEditCount())

  useEffect(() => {
    const edits = localEditCount()
    const editedHere = edits !== editsSeen.current
    editsSeen.current = edits

    const seen = readRankSeen()
    if (seen !== null && rank.level <= seen) return

    writeRankSeen(rank.level)
    if (seen !== null && editedHere) onRankUp(rank)
    // `rank` sai da foto: só a chegada de uma foto nova pode mudá-lo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot])
}
