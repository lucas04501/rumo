import { Anchor, Check, Flag, Moon, Waves } from 'lucide-react'
import { LayoutGroup, motion, useInView, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { XP } from '../lib/xp'
import { CheckMark, ItemRow } from '../ui/ItemRow'
import { Route } from '../voyage/Route'
import { Tide } from '../voyage/Tide'
import { TideBand } from '../voyage/TideBand'
import { WaveWash } from '../voyage/WaveWash'

// Tudo aqui é demonstração local: nada chama a API nem grava no aparelho.

const PANEL = 'rounded-2xl bg-sea-1 p-4 sm:p-5'

function useSeen<T extends Element>(amount = 0.5) {
  const ref = useRef<T>(null)
  const seen = useInView(ref, { once: true, amount })
  return [ref, seen] as const
}

function DayBand({ level, done, total }: { level: number; done: number; total: number }) {
  return (
    <TideBand level={level}>
      <div>
        <p className="font-display text-[24px]/[1.1] font-semibold tracking-[-0.02em]">Hoje</p>
        <p className="mt-1 text-[15px] text-mist">
          {done} de {total} feitos
        </p>
      </div>
    </TideBand>
  )
}

/** A Hoje parada, para o celular do topo. */
export function HeroPhone() {
  const rows = [
    { title: 'Ler 10 páginas', done: true },
    { title: 'Caminhar 30 minutos', done: true },
    { title: 'Pagar a conta de luz', done: false },
    { title: 'Planejar a semana', done: false },
  ]
  return (
    <figure
      className="relative mx-auto w-full max-w-[320px] rounded-[44px] border border-line-strong bg-abyss p-3 pb-6"
      aria-label="Tela Hoje do Rumo, com a maré pela metade, quatro itens e a rota da meta"
    >
      <div aria-hidden>
        <DayBand level={0.5} done={2} total={4} />
        <ul className="mt-2 px-2">
          {rows.map((row) => (
            <li key={row.title} className="flex min-h-12 items-center gap-3 border-b border-line last:border-0">
              <CheckMark done={row.done} />
              <span className={`text-[16px] font-[450] ${row.done ? 'text-haze line-through decoration-haze/50' : ''}`}>
                {row.title}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 px-2">
          <p className="text-[13px] text-mist">Meta · Correr 10 km</p>
          <div className="mt-3">
            <Route milestones={3} reached={1} label="" />
          </div>
        </div>
      </div>
    </figure>
  )
}

/** O painel da viagem: a rota da meta em cima e a maré do dia embaixo. */
export function VoyagePanel({ reached, tide }: { reached: number; tide: number }) {
  const done = Math.round(tide * 5)
  return (
    <div className={`${PANEL} w-full`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-[20px] font-semibold">Correr 10 km</p>
        <p className="text-[15px] text-mist">
          {reached} de 3 marcos
        </p>
      </div>
      <div className="mt-6 mb-8 px-1">
        <Route milestones={3} reached={reached} label={`Rota da meta: ${reached} de 3 marcos alcançados`} />
      </div>
      <DayBand level={tide} done={done} total={5} />
    </div>
  )
}

const DEMO_ITEMS = [
  { id: 'ler', title: 'Ler 10 páginas', kind: 'Hábito', xp: XP.habit },
  { id: 'caminhar', title: 'Caminhar 30 minutos', kind: 'Hábito', xp: XP.habit },
  { id: 'luz', title: 'Pagar a conta de luz', kind: 'Tarefa', xp: XP.task },
  { id: 'semana', title: 'Planejar a semana', kind: 'Tarefa', xp: XP.task },
]

const PERFECT_DAY = { title: 'Dia perfeito', detail: `Maré cheia. Mais ${XP.perfectDay} XP.` }

/** A Hoje de verdade, com os mesmos componentes do app, sem som e sem salvar. */
export function TodayDemo() {
  const [done, setDone] = useState<Set<string>>(() => new Set())
  const [celebrating, setCelebrating] = useState(false)
  const complete = done.size === DEMO_ITEMS.length

  useEffect(() => {
    if (!complete) return
    // A onda espera o check terminar, como no app.
    const timer = setTimeout(() => setCelebrating(true), 450)
    return () => clearTimeout(timer)
  }, [complete])

  const toggle = (id: string, xp: number) => {
    const checking = !done.has(id)
    setDone((current) => {
      const next = new Set(current)
      if (checking) next.add(id)
      else next.delete(id)
      return next
    })
    return checking ? xp : 0
  }

  const close = useCallback(() => setCelebrating(false), [])

  return (
    <div className={PANEL}>
      <DayBand level={done.size / DEMO_ITEMS.length} done={done.size} total={DEMO_ITEMS.length} />
      <div className="mt-2 px-1">
        {DEMO_ITEMS.map((item) => (
          <div key={item.id} className="border-b border-line last:border-0">
            <ItemRow
              title={item.title}
              label={`${item.title}, ${item.kind.toLowerCase()}`}
              done={done.has(item.id)}
              onToggle={() => toggle(item.id, item.xp)}
              trailing={<span className="text-[15px] text-mist">{item.kind}</span>}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex min-h-11 items-center justify-between gap-4 px-1">
        <p className="text-[15px] text-mist">Demonstração. Nada aqui é salvo.</p>
        {done.size > 0 && (
          <button
            type="button"
            className="min-h-11 text-[15px] text-mist underline underline-offset-4"
            onClick={() => setDone(new Set())}
          >
            Recomeçar
          </button>
        )}
      </div>
      {createPortal(<WaveWash celebration={celebrating ? PERFECT_DAY : null} onDone={close} />, document.body)}
    </div>
  )
}

const TYPED = 'pagar luz sexta !alta'

/** A adição rápida lendo o fim do texto. */
export function QuickAddDemo() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.7)
  const reduceMotion = useReducedMotion()
  const [count, setCount] = useState(0)
  const length = reduceMotion && seen ? TYPED.length : count
  const typed = length === TYPED.length

  useEffect(() => {
    if (!seen || reduceMotion || count >= TYPED.length) return
    const timer = setTimeout(() => setCount((value) => value + 1), count === 0 ? 400 : 70)
    return () => clearTimeout(timer)
  }, [seen, reduceMotion, count])

  return (
    <div
      ref={ref}
      className={PANEL}
      role="img"
      aria-label="Exemplo: o texto “pagar luz sexta !alta” vira a tarefa Pagar luz, na sexta-feira, com prioridade alta"
    >
      <div aria-hidden>
        <div className="field flex items-center">
          <span>{TYPED.slice(0, length)}</span>
          {!typed && <span className="landing-caret" />}
        </div>
        <motion.div
          className="mt-3 flex min-h-8 flex-wrap gap-2"
          initial={false}
          animate={{ opacity: typed ? 1 : 0 }}
          transition={{ duration: 0.25, delay: typed ? 0.2 : 0 }}
        >
          <span className="quick-chip">sexta-feira</span>
          <span className="quick-chip">Prioridade alta</span>
        </motion.div>
        <motion.div
          className="mt-3 flex min-h-14 items-center gap-3 border-t border-line pt-2"
          initial={false}
          animate={{ opacity: typed ? 1 : 0, y: typed ? 0 : 8 }}
          transition={{ duration: 0.35, delay: typed ? 0.55 : 0, ease: [0.23, 1, 0.32, 1] }}
        >
          <CheckMark done={false} />
          <Flag size={16} className="shrink-0 fill-foam text-foam" />
          <span className="flex-1 text-[17px] font-[450]">Pagar luz</span>
          <span className="text-[15px] text-mist">sex</span>
        </motion.div>
      </div>
    </div>
  )
}

type Column = 'todo' | 'doing' | 'done'
const COLUMNS: { id: Column; label: string }[] = [
  { id: 'todo', label: 'A fazer' },
  { id: 'doing', label: 'Fazendo' },
  { id: 'done', label: 'Feito' },
]
const START: Record<string, Column> = { Orçamento: 'todo', Dentista: 'todo', Relatório: 'doing' }
const MOVES: [string, Column][] = [
  ['Relatório', 'done'],
  ['Orçamento', 'doing'],
]

/** O Quadro, com dois cartões mudando de coluna quando ele aparece. */
export function BoardDemo() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.6)
  const [cards, setCards] = useState(START)

  useEffect(() => {
    if (!seen) return
    const timers = MOVES.map(([card, column], index) =>
      setTimeout(() => setCards((current) => ({ ...current, [card]: column })), 700 + index * 900),
    )
    return () => timers.forEach(clearTimeout)
  }, [seen])

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Exemplo do Quadro, com as colunas A fazer, Fazendo e Feito. O relatório vai para Feito e o orçamento para Fazendo."
    >
      <LayoutGroup>
        <div aria-hidden className="grid grid-cols-3 gap-2 sm:gap-3">
          {COLUMNS.map((column) => (
            <div key={column.id} className="min-h-52 rounded-2xl bg-sea-1 p-2 sm:p-3">
              <p className={`px-1 pb-2 text-[13px] ${column.id === 'doing' ? 'text-tide' : 'text-mist'}`}>{column.label}</p>
              <div className="grid gap-2">
                {Object.entries(cards)
                  .filter(([, place]) => place === column.id)
                  .map(([card]) => (
                    <motion.div
                      key={card}
                      layoutId={`board-${card}`}
                      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                      className="flex min-h-11 items-center gap-1.5 rounded-xl bg-sea-2 px-2 text-[14px] sm:px-3 sm:text-[15px]"
                    >
                      {/* No celular a coluna é estreita: o risco já diz que foi feito, e a palavra não quebra. */}
                      {column.id === 'done' && <Check size={14} className="hidden shrink-0 text-tide sm:block" strokeWidth={3} />}
                      <span className={`min-w-0 wrap-anywhere ${column.id === 'done' ? 'text-haze line-through' : ''}`}>{card}</span>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </LayoutGroup>
    </div>
  )
}

const FOCUS_SECONDS = 25 * 60

/** Um bloco de foco: o relógio conta e a maré mede o bloco, sempre abaixo do número. */
export function FocusDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { amount: 0.5 })
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!visible) return
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [visible])

  const left = FOCUS_SECONDS - 7 * 60 - elapsed
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
  // A água para em 45%, e o relógio fica no terço de cima: a crista nunca passa atrás do número.
  const level = Math.min(0.45, 0.2 + elapsed * 0.01)

  return (
    <div ref={ref} className="relative h-72 overflow-hidden rounded-2xl bg-sea-1">
      <Tide level={level} />
      <div className="relative px-5 pt-6 text-center">
        <p className="text-[15px] text-mist">Foco · Relatório do mês</p>
        <p className="mt-2 font-sans text-[64px]/none font-semibold tracking-[-0.02em]" aria-label="Faltam 18 minutos">
          {clock}
        </p>
      </div>
    </div>
  )
}

const RAMP = ['0', '1', '2', '3', '4'] as const

function depthFor(week: number, day: number): (typeof RAMP)[number] {
  // Padrão fixo, que fica mais cheio nas semanas recentes, como uma viagem que pegou ritmo.
  const seed = (week * 7 + day) * 2654435761
  const noise = ((seed >>> 0) % 100) / 100
  const value = Math.min(4, Math.max(0, Math.round(noise * 2 + week / 4 - 0.6)))
  return RAMP[value]
}

/** A carta de consistência de 13 semanas, preenchendo coluna a coluna. */
export function ConsistencyDemo() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.6)
  return (
    <div ref={ref} className={PANEL} role="img" aria-label="Exemplo da carta de consistência de 13 semanas, mais cheia nas semanas recentes">
      <p aria-hidden className="text-[15px] text-mist">
        Consistência · 13 semanas
      </p>
      <div aria-hidden className="mt-4 grid grid-flow-col grid-cols-13 grid-rows-7 gap-1 sm:gap-1.5">
        {Array.from({ length: 13 }, (_, week) =>
          Array.from({ length: 7 }, (_, day) => (
            <motion.span
              key={`${week}-${day}`}
              className="depth-cell"
              data-depth={depthFor(week, day)}
              initial={false}
              animate={{ opacity: seen ? 1 : 0 }}
              transition={{ duration: 0.3, delay: seen ? week * 0.06 : 0 }}
            />
          )),
        )}
      </div>
    </div>
  )
}

/** Medalhas reais do app: duas ganhas, uma chegando e uma que falta. */
export function MedalsDemo() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.6)
  const rows = [
    { icon: Waves, title: 'Maré cheia', detail: 'Feche um dia perfeito', earned: true },
    { icon: Anchor, title: 'Sete marés', detail: 'Sete dias seguidos em um hábito', earned: true, pop: true },
    { icon: Moon, title: 'Lua inteira', detail: '30 dias seguidos em um hábito', earned: false },
  ]
  return (
    <div ref={ref} className={PANEL}>
      <ul>
        {rows.map((row) => (
          <li key={row.title} className="flex min-h-16 items-center gap-4 border-b border-line py-2 last:border-0">
            <span
              className={`medal ${row.pop && seen ? 'medal-pop' : ''}`}
              data-earned={row.earned && (!row.pop || seen)}
              aria-hidden
            >
              <row.icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[17px] font-[450] ${row.earned ? 'text-sun' : ''}`}>{row.title}</span>
              <span className="block text-[15px] text-mist">{row.detail}</span>
              {!row.earned && (
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-sea-3">
                  <span className="block h-full w-2/5 rounded-full bg-tide" />
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const SETS = [
  { reps: 10, kg: '60' },
  { reps: 8, kg: '62,5' },
]

/** O modo treino: a série feita entra na lista e o recorde aparece em âmbar. */
export function WorkoutDemo() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.6)
  const reduceMotion = useReducedMotion()
  const [logged, setLogged] = useState(false)

  useEffect(() => {
    if (!seen) return
    const timer = setTimeout(() => setLogged(true), reduceMotion ? 0 : 1100)
    return () => clearTimeout(timer)
  }, [seen, reduceMotion])

  return (
    <div
      ref={ref}
      className={PANEL}
      role="img"
      aria-label="Exemplo do modo treino no supino reto: a terceira série, com 8 repetições e 65 kg, vira recorde"
    >
      <div aria-hidden>
        <p className="font-display text-[20px] font-semibold">Supino reto</p>
        <p className="text-[15px] text-mist">Peito</p>
        <ol className="mt-4">
          {[...SETS, ...(logged ? [{ reps: 8, kg: '65' }] : [])].map((set, index) => (
            <motion.li
              key={index}
              className="flex min-h-12 items-center gap-3 border-b border-line text-[16px]"
              initial={index === 2 ? { opacity: 0, y: -6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="w-5 text-mist">{index + 1}</span>
              <span className="flex-1">
                {set.reps} × {set.kg} kg
              </span>
              {index === 2 && <span className="font-medium text-sun">Recorde</span>}
              <Check size={18} className="text-tide" strokeWidth={2.5} />
            </motion.li>
          ))}
        </ol>
        <p className="mt-4 min-h-6 text-[15px] text-mist">{logged ? 'Descanso · 1:30' : ''}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stepper value="8" unit="repetições" />
          <Stepper value="65" unit="kg" />
        </div>
        <div className="action landing-demo-button mt-3 w-full">Série feita</div>
      </div>
    </div>
  )
}

function Stepper({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="grid min-h-14 place-items-center rounded-xl bg-sea-2 py-2 text-center">
      <span className="text-[22px] font-semibold">{value}</span>
      <span className="text-[13px] text-mist">{unit}</span>
    </div>
  )
}
