import type { Day, Note } from '../data/types'

/** Compara sem diferenciar maiúsculas nem acentos: "mare" encontra "Maré". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

const includes = (text: string, query: string) => normalize(text).includes(normalize(query))

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

export function isBlankNote({ title, body }: Pick<Note, 'title' | 'body'>): boolean {
  return !title.trim() && !body.trim()
}

/** Sem título, a primeira linha do texto faz esse papel. */
export function noteTitle({ title, body }: Pick<Note, 'title' | 'body'>): string {
  return title.trim() || lines(body)[0] || 'Sem título'
}

export function notePreview({ title, body }: Pick<Note, 'title' | 'body'>): string {
  return lines(body)
    .slice(title.trim() ? 0 : 1)
    .join(' ')
}

/** Fixadas primeiro; dentro de cada grupo, a edição mais recente vem antes. */
export function visibleNotes(notes: Note[], query: string): Note[] {
  return notes
    .filter((note) => !query.trim() || includes(`${note.title}\n${note.body}`, query))
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
}

export type JournalEntry = { date: string; note: string }

/** Dias com texto, do mais novo ao mais antigo. Hoje aparece mesmo vazio, para convidar a escrever. */
export function journalEntries(days: Day[], today: string, query: string): JournalEntry[] {
  const searching = Boolean(query.trim())
  const written = days.flatMap(({ date, note }) => (note?.trim() ? [{ date, note }] : []))
  const found = searching ? written.filter(({ note }) => includes(note, query)) : written
  const entries =
    searching || found.some(({ date }) => date === today)
      ? found
      : [...found, { date: today, note: '' }]

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
