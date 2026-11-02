import { Plus, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { useDay } from '../data/DayProvider'
import { closeLayer, openLayer } from '../data/layers'
import { useSnapshot } from '../data/store'
import { normalize } from '../lib/notes'
import { searchAll, type Hit } from '../lib/search'
import { HabitSheet } from './HabitSheet'
import { NoteSheet } from './NoteSheet'
import { RuleSheet } from './RuleSheet'
import { TaskSheet } from './TaskSheet'

export type Place = { to: string; label: string; icon: LucideIcon }

type Entry = { key: string; title: string; detail?: string; icon?: LucideIcon; run: () => void }

/** Busca em tudo e leva às telas. Abre sem animação: quem usa o teclado repete isso o dia inteiro. */
export function SearchDialog({ places }: { places: Place[] }) {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const [opened, setOpened] = useState<Hit | null>(null)

  if (!snapshot) return null
  if (opened?.kind === 'task') return <TaskSheet task={opened.task} onClosed={closeLayer} />
  if (opened?.kind === 'note') {
    return <NoteSheet note={opened.note} goals={snapshot.goals} onClosed={closeLayer} />
  }
  if (opened?.kind === 'habit') {
    return (
      <HabitSheet
        habit={opened.habit}
        position={opened.habit.position}
        today={date}
        onClosed={closeLayer}
      />
    )
  }
  if (opened?.kind === 'rule') {
    return (
      <RuleSheet
        rule={opened.rule}
        position={opened.rule.position}
        today={date}
        onClosed={closeLayer}
      />
    )
  }

  return <Palette places={places} onOpen={setOpened} />
}

type PaletteProps = { places: Place[]; onOpen: (hit: Hit) => void }

function Palette({ places, onOpen }: PaletteProps) {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const navigate = useNavigate()
  const dialog = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal()
  }, [])

  const entries = useMemo<Entry[]>(() => {
    if (!snapshot) return []
    const go = (to: string) => () => {
      closeLayer()
      void navigate(to)
    }
    const hits = searchAll(snapshot, query, date).map(
      (hit): Entry => ({
        key: `${hit.kind}-${hit.id}`,
        title: hit.title,
        detail: hit.detail,
        run: hit.kind === 'goal' ? go(`/metas/${hit.id}`) : () => onOpen(hit),
      }),
    )
    const wanted = normalize(query)
    const screens = places
      .filter(({ label }) => normalize(label).includes(wanted))
      .map(({ to, label, icon }): Entry => ({ key: to, title: label, icon, run: go(to) }))
    const create: Entry = {
      key: 'criar',
      title: query.trim() ? `Criar "${query.trim()}"` : 'Criar',
      icon: Plus,
      run: () => openLayer('criar', query.trim()),
    }
    return query.trim() ? [...hits, ...screens, create] : [create, ...screens]
  }, [snapshot, query, date, navigate, places, onOpen])

  const selected = Math.min(active, entries.length - 1)

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (step !== 0) {
      event.preventDefault()
      setActive((selected + step + entries.length) % entries.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      entries[selected]?.run()
    }
  }

  return (
    <dialog
      ref={dialog}
      className="palette"
      aria-label="Buscar"
      onCancel={(event) => {
        event.preventDefault()
        closeLayer()
      }}
      onClick={(event) => {
        if (event.target === dialog.current) closeLayer()
      }}
    >
      <div className="relative">
        <Search
          size={19}
          strokeWidth={1.75}
          className="absolute top-[17px] left-3.5 text-mist"
          aria-hidden
        />
        <input
          type="search"
          role="combobox"
          aria-expanded
          aria-controls="resultados"
          aria-activedescendant={entries[selected] && `opcao-${selected}`}
          className="field field-search palette-field"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Buscar tarefas, hábitos, metas e notas"
          aria-label="Buscar tarefas, hábitos, metas e notas"
          enterKeyHint="search"
          autoComplete="off"
          autoFocus
        />
      </div>
      <ul id="resultados" role="listbox" aria-label="Resultados" className="palette-list">
        {entries.map(({ key, title, detail, icon: Icon, run }, position) => (
          <li key={key} id={`opcao-${position}`} role="option" aria-selected={position === selected}>
            <button
              type="button"
              tabIndex={-1}
              className="palette-row"
              data-active={position === selected}
              onPointerMove={() => setActive(position)}
              onClick={run}
            >
              {Icon && <Icon size={19} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />}
              <span className="min-w-0 flex-1 truncate">{title}</span>
              {detail && <span className="palette-detail">{detail}</span>}
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  )
}
