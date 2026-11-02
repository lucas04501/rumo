import { Pin } from 'lucide-react'
import { saveNote } from '../data/noteActions'
import type { Note } from '../data/types'
import { formatShortDate, toIsoDate } from '../lib/dates'
import { notePreview, noteTitle } from '../lib/notes'

type NoteRowProps = {
  note: Note
  /** Nome da meta ligada, quando a lista mistura notas de várias metas. */
  goalName?: string
  onOpen: () => void
}

export function NoteRow({ note, goalName, onOpen }: NoteRowProps) {
  const title = noteTitle(note)
  const details = [formatShortDate(toIsoDate(new Date(note.updatedAt))), goalName, notePreview(note)]

  return (
    <div className="flex items-center gap-1">
      <button type="button" className="min-h-16 min-w-0 flex-1 py-2 text-left" onClick={onOpen}>
        <span className="block truncate text-[17px]">{title}</span>
        <span className="block truncate text-[15px] text-mist">
          {details.filter(Boolean).join(' · ')}
        </span>
      </button>
      <button
        type="button"
        className="icon-button -mr-2.5"
        aria-pressed={note.pinned}
        aria-label={`Fixar ${title}`}
        onClick={() => saveNote({ ...note, pinned: !note.pinned })}
      >
        <Pin
          size={18}
          strokeWidth={1.75}
          className={note.pinned ? 'fill-tide text-tide' : ''}
          aria-hidden
        />
      </button>
    </div>
  )
}
