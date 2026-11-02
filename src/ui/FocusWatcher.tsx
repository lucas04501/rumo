import { useEffect } from 'react'
import { getFocusTimer, setFocusTimer, useFocusTimer } from '../data/focusTimer'
import { useSnapshot } from '../data/store'
import { recordFocus } from '../data/taskActions'
import { haptic, soundFocusEnd } from '../lib/feedback'
import { finish, hasEnded, plannedMinutes } from '../lib/focus'

const CHECK_INTERVAL_MS = 1000
const FRESH_END_MS = 5000

/** Fecha o bloco em qualquer tela, inclusive ao reabrir o app depois do fim. */
export function FocusWatcher() {
  const { data: snapshot } = useSnapshot()
  const timer = useFocusTimer()
  const running = timer !== null && timer.endsAt !== null

  useEffect(() => {
    if (!running || !snapshot) return

    const check = () => {
      const current = getFocusTimer()
      const now = Date.now()
      if (!current || !hasEnded(current, now)) return

      if (current.phase === 'focus') recordFocus(current, plannedMinutes(current), snapshot)
      setFocusTimer(finish(current))
      // Quem reabre o app horas depois não precisa de um alarme atrasado.
      if (now - (current.endsAt ?? now) < FRESH_END_MS) {
        soundFocusEnd()
        haptic()
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', check)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [running, snapshot])

  return null
}
