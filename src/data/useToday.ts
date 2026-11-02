import { useEffect, useState } from 'react'
import { hoje } from '../lib/dates'

const CHECK_INTERVAL_MS = 60_000

/** O app instalado fica aberto por dias: a data precisa virar sozinha. */
export function useToday(): string {
  const [today, setToday] = useState(() => hoje())

  useEffect(() => {
    const sync = () => setToday(hoje())
    const timer = setInterval(sync, CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return today
}
