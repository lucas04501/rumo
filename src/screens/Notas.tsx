import { Search } from 'lucide-react'
import { useState } from 'react'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import type { Note, Snapshot } from '../data/types'
import { formatLongDate } from '../lib/dates'
import { journalEntries, visibleNotes } from '../lib/notes'
import { JournalSheet } from '../ui/JournalSheet'
import { NoteRow } from '../ui/NoteRow'
import { NoteSheet } from '../ui/NoteSheet'
import { Screen } from '../ui/Screen'

type View = 'notas' | 'registro'

const SECTION_HEAD = 'flex min-h-11 items-center justify-between gap-4'
const SECTION_TITLE = 'sr-only font-display text-xl font-semibold lg:not-sr-only'

export function Notas() {
  const { date: today } = useDay()
  const { data: snapshot } = useSnapshot()
  const [view, setView] = useState<View>('notas')
  const [query, setQuery] = useState('')

  if (!snapshot) return null

  return (
    <Screen>
      <div className="flex items-center justify-between gap-4 pt-3 lg:pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">Notas</h1>
        <div className="lg:hidden">
          <div className="segmented" role="group" aria-label="Visualização">
            <button type="button" aria-pressed={view === 'notas'} onClick={() => setView('notas')}>
              Notas
            </button>
            <button
              type="button"
              aria-pressed={view === 'registro'}
              onClick={() => setView('registro')}
            >
              Registro
            </button>
          </div>
        </div>
      </div>

      <label className="relative mt-4 block">
        <Search
          size={19}
          strokeWidth={1.75}
          className="absolute top-[17px] left-3.5 text-mist"
          aria-hidden
        />
        <input
          type="search"
          className="field field-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar"
          aria-label="Buscar nas notas e no registro"
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>

      <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-16">
        <div className={view === 'notas' ? '' : 'hidden lg:block'}>
          <NoteList snapshot={snapshot} query={query} />
        </div>
        <div className={view === 'registro' ? '' : 'hidden lg:block'}>
          <Journal snapshot={snapshot} today={today} query={query} />
        </div>
      </div>
    </Screen>
  )
}

type Opened = { note: Note | null }

function NoteList({ snapshot, query }: { snapshot: Snapshot; query: string }) {
  const [opened, setOpened] = useState<Opened | null>(null)
  const notes = visibleNotes(snapshot.notes, query)
  const goalName = (id: string | null) => snapshot.goals.find((goal) => goal.id === id)?.title

  return (
    <section aria-labelledby="lista-de-notas">
      <div className={SECTION_HEAD}>
        <h2 id="lista-de-notas" className={SECTION_TITLE}>
          Notas
        </h2>
        <button type="button" className="action ml-auto" onClick={() => setOpened({ note: null })}>
          Nova nota
        </button>
      </div>

      {notes.length > 0 ? (
        <ul className="mt-1 divide-y divide-line">
          {notes.map((note) => (
            <li key={note.id}>
              <NoteRow
                note={note}
                goalName={goalName(note.goalId)}
                onOpen={() => setOpened({ note })}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[17px] text-mist">
          {query.trim()
            ? 'Nenhuma nota com essa busca.'
            : 'Anote o que for. Salva sozinho, mesmo sem internet.'}
        </p>
      )}

      {opened && (
        <NoteSheet note={opened.note} goals={snapshot.goals} onClosed={() => setOpened(null)} />
      )}
    </section>
  )
}

type JournalProps = {
  snapshot: Snapshot
  today: string
  query: string
}

function Journal({ snapshot, today, query }: JournalProps) {
  const [opened, setOpened] = useState<string | null>(null)
  const entries = journalEntries(snapshot.days, today, query)

  return (
    <section aria-labelledby="registro-diario">
      <div className={SECTION_HEAD}>
        <h2 id="registro-diario" className={SECTION_TITLE}>
          Registro diário
        </h2>
      </div>

      {entries.length > 0 ? (
        <ul className="divide-y divide-line">
          {entries.map(({ date, note }) => (
            <li key={date}>
              <button
                type="button"
                className="min-h-16 w-full py-2 text-left"
                onClick={() => setOpened(date)}
              >
                <span className="block text-[17px]">
                  {date === today ? 'Hoje' : formatLongDate(date)}
                </span>
                <span className="block truncate text-[15px] text-mist">
                  {note.replace(/\s+/g, ' ').trim() || 'Como foi o dia?'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[17px] text-mist">Nenhum registro com essa busca.</p>
      )}

      {opened && (
        <JournalSheet
          key={opened}
          date={opened}
          snapshot={snapshot}
          onClosed={() => setOpened(null)}
        />
      )}
    </section>
  )
}
