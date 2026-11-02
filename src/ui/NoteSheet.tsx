import { Pin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { deleteNote, saveNote } from '../data/noteActions'
import type { Goal, Note } from '../data/types'
import { newId } from '../lib/ids'
import { isBlankNote } from '../lib/notes'
import { Sheet } from './Sheet'
import { useAutosave } from './useAutosave'

const MAX_TITLE = 300
const MAX_BODY = 100_000

const blankNote = (goalId: string | null): Note => ({
  id: newId(),
  goalId,
  title: '',
  body: '',
  pinned: false,
  updatedAt: '',
})

const sameContent = (a: Note, b: Note) =>
  a.title === b.title && a.body === b.body && a.pinned === b.pinned && a.goalId === b.goalId

type NoteSheetProps = {
  /** Sem nota, abre uma nova. Ela só passa a existir quando tiver conteúdo. */
  note: Note | null
  goalId?: string | null
  goals: Goal[]
  onClosed: () => void
}

export function NoteSheet({ note, goalId = null, goals, onClosed }: NoteSheetProps) {
  const [draft, setDraft] = useState(() => note ?? blankNote(goalId))
  const [saved, setSaved] = useState(draft)
  const [exists, setExists] = useState(note !== null)
  const stopped = useRef(false)
  const bodyField = useRef<HTMLTextAreaElement>(null)

  // Roda depois de a folha abrir, que move o foco para o botão de fechar.
  useEffect(() => {
    if (!note) bodyField.current?.focus()
  }, [note])

  const change = (fields: Partial<Note>) => setDraft((current) => ({ ...current, ...fields }))

  const unwritten = !exists && isBlankNote(draft)
  const pending = !unwritten && !sameContent(saved, draft)

  const save = () => {
    if (stopped.current || !pending) return
    saveNote(draft)
    setSaved(draft)
    setExists(true)
  }

  useAutosave(draft, save)

  // Nota esvaziada não fica ocupando a lista como "Sem título".
  const finish = () => {
    if (exists && isBlankNote(draft)) {
      if (!stopped.current) deleteNote(draft.id)
    } else {
      save()
    }
    stopped.current = true
    onClosed()
  }

  const remove = (close: () => void) => {
    stopped.current = true
    if (exists) deleteNote(draft.id)
    close()
  }

  // Metas arquivadas ou concluídas não aparecem, salvo a que já está ligada.
  const choices = goals.filter((goal) => goal.status === 'active' || goal.id === draft.goalId)

  return (
    <Sheet title={note ? 'Nota' : 'Nova nota'} onClosed={finish}>
      {(close) => (
        <div className="mt-3 grid gap-3">
          <input
            className="field"
            value={draft.title}
            onChange={(event) => change({ title: event.target.value })}
            placeholder="Título"
            aria-label="Título da nota"
            maxLength={MAX_TITLE}
            autoComplete="off"
          />
          <textarea
            ref={bodyField}
            className="field note-body py-3"
            rows={9}
            value={draft.body}
            onChange={(event) => change({ body: event.target.value })}
            onBlur={save}
            placeholder="Escreva o que for"
            aria-label="Texto da nota"
            maxLength={MAX_BODY}
          />

          {choices.length > 0 && (
            <label className="grid gap-1.5 text-[15px] text-mist">
              Meta ligada
              <select
                className="field text-foam"
                value={draft.goalId ?? ''}
                onChange={(event) => change({ goalId: event.target.value || null })}
              >
                <option value="">Nenhuma</option>
                {choices.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="ghost inline-flex items-center gap-2"
              aria-pressed={draft.pinned}
              onClick={() => change({ pinned: !draft.pinned })}
            >
              <Pin
                size={17}
                strokeWidth={1.75}
                className={draft.pinned ? 'fill-tide text-tide' : ''}
                aria-hidden
              />
              {draft.pinned ? 'Fixada' : 'Fixar'}
            </button>
            <p role="status" className="text-[15px] text-mist">
              {pending ? 'Salvando…' : exists ? 'Salvo' : ''}
            </p>
          </div>

          <DeleteNote onDelete={() => remove(close)} />
        </div>
      )}
    </Sheet>
  )
}

function DeleteNote({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="border-t border-white/8 pt-3">
      {confirming ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px]">Excluir esta nota?</p>
          <button type="button" className="ghost shrink-0" onClick={onDelete}>
            Excluir
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 text-[15px] text-mist underline underline-offset-4"
          onClick={() => setConfirming(true)}
        >
          Excluir nota
        </button>
      )}
    </div>
  )
}
