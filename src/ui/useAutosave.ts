import { useEffect, useRef } from 'react'

const PAUSE_MS = 700

/**
 * Salva depois de uma pausa na digitação, ao sair da tela e ao esconder o app,
 * que no iPhone pode ser encerrado sem aviso. `save` precisa ignorar o que já foi salvo.
 */
export function useAutosave(value: unknown, save: () => void) {
  const latest = useRef(save)

  useEffect(() => {
    latest.current = save
  })

  useEffect(() => {
    const timer = setTimeout(() => latest.current(), PAUSE_MS)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    const flush = () => latest.current()
    const flushIfHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    document.addEventListener('visibilitychange', flushIfHidden)
    window.addEventListener('pagehide', flush)

    return () => {
      document.removeEventListener('visibilitychange', flushIfHidden)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [])
}
