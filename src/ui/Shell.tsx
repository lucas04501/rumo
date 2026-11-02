import { motion } from 'motion/react'
import {
  CalendarDays,
  ChartNoAxesCombined,
  Compass,
  Ellipsis,
  ListChecks,
  NotebookPen,
  Settings,
  Sunrise,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useDay } from '../data/DayProvider'
import { useFocusTimer } from '../data/focusTimer'
import { useNow } from '../data/useNow'
import { tideLevel } from '../lib/focus'
import { SunGlow } from '../voyage/SunGlow'
import { Tide } from '../voyage/Tide'
import { WaveWash } from '../voyage/WaveWash'
import { FocusWatcher } from './FocusWatcher'
import { RewardToast } from './RewardToast'
import { UndoToast } from './UndoToast'

type Tab = { to: string; label: string; icon: LucideIcon; also?: string[] }

const MAIN_TABS: Tab[] = [
  { to: '/', label: 'Hoje', icon: Sunrise },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/metas', label: 'Metas', icon: Compass },
  { to: '/mes', label: 'Mês', icon: CalendarDays },
]

const PHONE_TABS: Tab[] = [
  ...MAIN_TABS,
  { to: '/mais', label: 'Mais', icon: Ellipsis, also: ['/evolucao', '/notas', '/foco'] },
]

const WIDE_TABS: Tab[] = [
  ...MAIN_TABS,
  { to: '/evolucao', label: 'Evolução', icon: ChartNoAxesCombined },
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

export function Shell() {
  const { pathname } = useLocation()
  const { level, reward, dismissReward, celebration, dismissCelebration } = useDay()
  const timer = useFocusTimer()
  // No modo foco, a navegação some no celular. No computador, ela não atrapalha.
  const immersive = pathname === '/foco' && timer !== null

  return (
    <div className="relative grid h-dvh grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[224px_minmax(0,1fr)] lg:grid-rows-1">
      <Sea level={level} focusing={pathname === '/foco'} />
      <SunGlow level={level} />
      <main className="relative z-10 overflow-y-auto overscroll-contain lg:col-start-2">
        <div key={pathname} className="screen-in">
          <Outlet />
        </div>
      </main>
      <Navigation hidden={immersive} />
      <RewardToast reward={reward} onDone={dismissReward} />
      <UndoToast />
      <WaveWash celebration={celebration} onDone={dismissCelebration} />
      <FocusWatcher />
    </div>
  )
}

/** Na tela de foco, a maré mede o bloco: sobe com o foco e desce na pausa. */
function Sea({ level, focusing }: { level: number; focusing: boolean }) {
  const timer = useFocusTimer()
  const measuring = focusing && timer !== null && timer.endsAt !== null
  const now = useNow(measuring ? FOCUS_TIDE_INTERVAL_MS : null)

  return <Tide level={focusing && timer ? tideLevel(timer, now) : level} />
}

function Navigation({ hidden }: { hidden: boolean }) {
  const wide = useSyncExternalStore(subscribeWide, isWide)

  return (
    <nav
      aria-label="Principal"
      className={`relative z-20 border-t border-white/8 bg-abyss pb-[env(safe-area-inset-bottom,0px)] lg:col-start-1 lg:row-start-1 lg:border-t-0 lg:border-r lg:px-3 lg:pt-[max(env(safe-area-inset-top,0px),24px)] ${
        hidden ? 'max-lg:hidden' : ''
      }`}
    >
      <p className="hidden px-3 pb-6 font-display text-2xl font-semibold lg:block">Rumo</p>
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
          isActive || inside ? 'text-tide' : 'text-mist hover:text-foam'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {(isActive || inside) && (
            <motion.span
              layoutId="tab-marker"
              className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-tide lg:inset-x-auto lg:top-2.5 lg:bottom-2.5 lg:left-0 lg:h-auto lg:w-0.5"
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
