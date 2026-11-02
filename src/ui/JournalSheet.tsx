import { useState } from 'react'
import { saveDayNote } from '../data/dayActions'
import type { Snapshot } from '../data/types'
import { formatLongDate } from '../lib/dates'
import { Sheet } from './Sheet'
import { useAutosave } from './useAutosave'

const MAX_ENTRY = 20_000

type JournalSheetProps = {
  date: string
  snapshot: Snapshot
  onClosed: () => void
}

/** Registro do dia. É o mesmo texto da "Nota do dia" na folha do dia. */
export function JournalSheet({ date, snapshot, onClosed }: JournalSheetProps) {
  const stored = snapshot.days.find((day) => day.date === date)?.note ?? ''
  const [text, setText] = useState(stored)

  const save = () => {
    if (text !== stored) saveDayNote(date, text)
  }

  useAutosave(text, save)

  return (
    <Sheet
      title={formatLongDate(date)}
      onClosed={() => {
        save()
        onClosed()
      }}
    >
      {() => (
        <div className="mt-3 grid gap-2">
          <textarea
            className="field note-body py-3"
            rows={10}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onBlur={save}
            placeholder="Como foi o dia?"
            aria-label="Registro do dia"
            maxLength={MAX_ENTRY}
          />
          <p role="status" className="text-right text-[15px] text-mist">
            {text === stored ? (stored ? 'Salvo' : '') : 'Salvando…'}
          </p>
        </div>
      )}
    </Sheet>
  )
}
