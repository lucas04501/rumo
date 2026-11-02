import { useMemo, useState } from 'react'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import { addQuick } from '../data/taskActions'
import { parseQuickAdd } from '../lib/quickAdd'

/** O texto da adição rápida e o que foi entendido dele. A tela decide quando salvar. */
export function useQuickAdd(initial = '') {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const [title, setTitle] = useState(initial)
  // "Ignorar" guarda o texto ignorado: ao digitar algo novo, a leitura volta.
  const [literal, setLiteral] = useState<string | null>(null)

  const intent = useMemo(() => parseQuickAdd(title, date), [title, date])
  const understood = literal !== title && intent.labels.length > 0

  const save = () => {
    const clean = title.trim()
    if (!clean || !snapshot) return
    addQuick(
      understood ? intent : { ...intent, title: clean, date, priority: 'normal', repeat: null },
      date,
      snapshot,
    )
    setTitle('')
    setLiteral(null)
  }

  return { title, setTitle, labels: understood ? intent.labels : [], ignore: () => setLiteral(title), save }
}

type QuickChipsProps = { labels: string[]; onIgnore: () => void; className?: string }

export function QuickChips({ labels, onIgnore, className = '' }: QuickChipsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {labels.map((label) => (
        <span key={label} className="quick-chip">
          {label}
        </span>
      ))}
      <button
        type="button"
        className="min-h-8 px-1 text-sm text-mist underline underline-offset-4"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onIgnore}
      >
        Ignorar
      </button>
    </div>
  )
}
