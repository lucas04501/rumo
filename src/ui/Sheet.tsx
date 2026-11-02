import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

type SheetProps = {
  title: string
  onClosed: () => void
  children: (close: () => void) => ReactNode
}

/** Folha inferior. O `<dialog>` nativo cuida do foco, do Esc e do fundo. */
export function Sheet({ title, onClosed, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal()
  }, [])

  const close = () => setClosing(true)

  return (
    <dialog
      ref={dialog}
      className="sheet"
      data-closing={closing}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        // O React sobe o evento pela árvore: uma folha aberta dentro desta não a fecha.
        if (event.target === dialog.current) close()
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close()
      }}
      onAnimationEnd={(event) => {
        if (closing && event.target === dialog.current) onClosed()
      }}
    >
      <div className="sheet-body">
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-display text-2xl font-semibold">
            {title}
          </h2>
          <button type="button" className="icon-button -mr-2.5" aria-label="Fechar" onClick={close}>
            <X size={22} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {children(close)}
      </div>
    </dialog>
  )
}
