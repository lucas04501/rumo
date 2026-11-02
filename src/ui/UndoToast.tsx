import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { settleUndo, takeUndo, useUndoOffer } from '../data/undo'

/** Uma folha modal deixa o resto da página sem resposta ao toque, então o aviso entra nela. */
const topLayer = () => [...document.querySelectorAll('dialog[open]')].at(-1) ?? document.body

/** Aviso com Desfazer, neutro porque âmbar é só recompensa. */
export function UndoToast() {
  const offer = useUndoOffer()

  useEffect(() => {
    const settleWhenHidden = () => {
      if (document.visibilityState === 'hidden') settleUndo()
    }
    document.addEventListener('visibilitychange', settleWhenHidden)
    return () => document.removeEventListener('visibilitychange', settleWhenHidden)
  }, [])

  if (!offer) return null

  return createPortal(
    <div role="status" className="undo-toast">
      <p className="min-w-0 flex-1 text-[15px]">{offer.message}</p>
      {offer.undo && (
        <button type="button" className="undo-button" onClick={takeUndo}>
          Desfazer
        </button>
      )}
    </div>,
    topLayer(),
  )
}
