import { useEffect } from 'react'

/** Mantém a tela acesa: com ela apagada, o iPhone suspende o app e o som do fim não toca. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let lock: WakeLockSentinel | null = null
    let ended = false
    const acquire = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          if (ended) void sentinel.release()
          else lock = sentinel
        })
        .catch(() => {})
    }

    acquire()
    document.addEventListener('visibilitychange', acquire)

    return () => {
      ended = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release()
    }
  }, [active])
}
