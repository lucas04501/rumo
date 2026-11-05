import { useMemo, useSyncExternalStore } from 'react'
import { parseAvatar, rawAvatar, subscribeAvatar, type Avatar } from '../lib/avatar'

/** A escolha de avatar deste aparelho para esta pessoa. Sem sessão ainda, vale o padrão. */
export function useAvatar(userId: string | undefined): Avatar {
  const raw = useSyncExternalStore(subscribeAvatar, () => (userId ? rawAvatar(userId) : null))
  return useMemo(() => parseAvatar(raw), [raw])
}
