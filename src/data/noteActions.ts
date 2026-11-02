import { commit } from './store'
import type { Note } from './types'

export function saveNote(note: Note) {
  const editedAt = new Date().toISOString()
  const next = { ...note, updatedAt: editedAt }

  commit(
    (current) => ({
      ...current,
      notes: [next, ...current.notes.filter((item) => item.id !== note.id)],
    }),
    [{ method: 'PUT', path: `/notes/${note.id}`, body: { ...next, editedAt } }],
  )
}

export function deleteNote(id: string) {
  commit(
    (current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }),
    [{ method: 'DELETE', path: `/notes/${id}` }],
  )
}
