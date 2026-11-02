import { motion } from 'motion/react'
import {
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  Columns3,
  Compass,
  Ellipsis,
  ListChecks,
  Medal,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Sunrise,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useSyncExternalStore } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useDay } from '../data/DayProvider'
import { useFocusTimer } from '../data/focusTimer'
import { openLayer, useLayer } from '../data/layers'
import { useNow } from '../data/useNow'
import { tideLevel } from '../lib/focus'
import { Tide } from '../voyage/Tide'
import { WaveWash } from '../voyage/WaveWash'
import { Creator } from './Creator'
import { FocusWatcher } from './FocusWatcher'
import { RewardToast } from './RewardToast'
import { SearchDialog } from './SearchDialog'
import { UndoToast } from './UndoToast'

type Tab = { to: string; label: string; icon: LucideIcon; also?: string[] }

const PHONE_TABS: Tab[] = [
  { to: '/', label: 'Hoje', icon: Sunrise },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/metas', label: 'Metas', icon: Compass },
  { to: '/mes', label: 'Plano', icon: CalendarDays, also: ['/semana', '/quadro'] },
  {
    to: '/mais',
    label: 'Mais',
    icon: Ellipsis,
    also: ['/rotina', '/evolucao', '/conquistas', '/notas', '/foco'],
  },
]

const WIDE_TABS: Tab[] = [
  { to: '/', label: 'Hoje', icon: Sunrise },
  { to: '/quadro', label: 'Quadro', icon: Columns3 },
  { to: '/mes', label: 'Mês', icon: CalendarDays, also: ['/semana'] },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/metas', label: 'Metas', icon: Compass },
  { to: '/rotina', label: 'Rotina', icon: CalendarClock },
  { to: '/evolucao', label: 'Evolução', icon: ChartNoAxesCombined },
  { to: '/conquistas', label: 'Conquistas', icon: Medal },
  { to: '/notas', label: 'Notas', icon: NotebookPen },
  { to: '/foco', label: 'Foco', icon: Timer },
  { to: '/mais', label: 'Ajustes', icon: Settings },
]

const WIDE_QUERY = '(min-width: 64rem)'
const FOCUS_TIDE_INTERVAL_MS = 5000

function subscribeWide(listener: () => void) {
  const query = window.matchMedia(WIDE_QUERY)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

const isWide = () => window.matchMedia(WIDE_QUERY).matches

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('input, textarea, select') !== null

/** Só valem fora de campos e sem folha aberta, para nunca atravessar o que está na frente. */
function useShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (!document.querySelector('dialog[open]')) openLayer('buscar')
        return
      }
      if (modifier || event.altKey || isTyping(event.target)) return
      if (document.querySelector('dialog[open]')) return

      if (event.key === '/') {
        event.preventDefault()
        openLayer('buscar')
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        openLayer('criar')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

export function Shell() {
  const { pathname } = useLocation()
  const { reward, dismissReward, celebration, dismissCelebration } = useDay()
  const timer = useFocusTimer()
  // No modo foco, a navegação some no celular. No computador, ela não atrapalha.
  const immersive = pathname === '/foco' && timer !== null
  const layer = useLayer()
  useShortcuts()

  return (
    <div className="relative grid h-dvh grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[224px_minmax(0,1fr)] lg:grid-rows-1">
      {pathname === '/foco' && <Sea />}
      <main className="relative z-10 overflow-y-auto overscroll-contain lg:col-start-2">
        <div key={pathname} className="screen-in">
          <Outlet />
        </div>
      </main>
      <Navigation hidden={immersive} />
      {pathname !== '/foco' && (
        <button type="button" className="fab" aria-label="Criar" onClick={() => openLayer('criar')}>
          <Plus size={26} strokeWidth={2} aria-hidden />
        </button>
      )}
      {layer?.kind === 'criar' && <Creator key={layer.draft} draft={layer.draft} />}
      {layer?.kind === 'buscar' && <SearchDialog places={WIDE_TABS} />}
      <RewardToast reward={reward} onDone={dismissReward} />
      <UndoToast />
      <WaveWash celebration={celebration} onDone={dismissCelebration} />
      <FocusWatcher />
    </div>
  )
}

/** Na tela de foco, a maré mede o bloco: sobe com o foco e desce na pausa. */
function Sea() {
  const { level } = useDay()
  const timer = useFocusTimer()
  const now = useNow(timer?.endsAt ? FOCUS_TIDE_INTERVAL_MS : null)

  return (
    <div className="sea-full">
      <Tide level={timer ? tideLevel(timer, now) : level} />
    </div>
  )
}

function Navigation({ hidden }: { hidden: boolean }) {
  const wide = useSyncExternalStore(subscribeWide, isWide)

  return (
    <nav
      aria-label="Principal"
      className={`relative z-20 border-t border-line bg-abyss pb-[env(safe-area-inset-bottom,0px)] lg:col-start-1 lg:row-start-1 lg:border-t-0 lg:border-r lg:px-3 lg:pt-[max(env(safe-area-inset-top,0px),24px)] ${
        hidden ? 'max-lg:hidden' : ''
      } overflow-y-auto`}
    >
      <p className="hidden px-3 pb-5 font-display text-2xl font-semibold lg:block">Rumo</p>
      <div className="mb-3 hidden gap-1 lg:grid">
        <button type="button" className="nav-create" onClick={() => openLayer('criar')}>
          <Plus size={20} strokeWidth={2} aria-hidden />
          Criar
          <kbd>N</kbd>
        </button>
        <button type="button" className="nav-search" onClick={() => openLayer('buscar')}>
          <Search size={20} strokeWidth={1.75} aria-hidden />
          Buscar
          <kbd>Ctrl K</kbd>
        </button>
      </div>
      <ul className="grid grid-cols-5 lg:grid-cols-1 lg:gap-1">
        {(wide ? WIDE_TABS : PHONE_TABS).map((tab) => (
          <li key={tab.to}>
            <TabLink tab={tab} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function TabLink({ tab: { to, label, icon: Icon, also = [] } }: { tab: Tab }) {
  const { pathname } = useLocation()
  const inside = also.includes(pathname)

  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `relative flex h-15 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150 lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:text-[15px] ${
          isActive || inside ? 'text-tide lg:bg-sea-2 lg:text-foam' : 'text-mist hover:text-foam'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {(isActive || inside) && (
            <motion.span
              layoutId="tab-marker"
              className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-tide lg:hidden"
              transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
            />
          )}
          <Icon size={22} strokeWidth={1.75} aria-hidden />
          {label}
        </>
      )}
    </NavLink>
  )
}
