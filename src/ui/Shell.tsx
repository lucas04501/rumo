import { motion } from 'motion/react'
import { CalendarDays, Compass, ListChecks, NotebookPen, Sunrise, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useDay } from '../data/DayProvider'
import { SunGlow } from '../voyage/SunGlow'
import { Tide } from '../voyage/Tide'
import { WaveWash } from '../voyage/WaveWash'
import { WindToast } from './WindToast'

type Tab = { to: string; label: string; icon: LucideIcon }

const TABS: Tab[] = [
  { to: '/', label: 'Hoje', icon: Sunrise },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/metas', label: 'Metas', icon: Compass },
  { to: '/mes', label: 'Mês', icon: CalendarDays },
  { to: '/notas', label: 'Notas', icon: NotebookPen },
]

export function Shell() {
  const { pathname } = useLocation()
  const { level, wind, dismissWind, celebration, dismissCelebration } = useDay()

  return (
    <div className="relative grid h-dvh grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[224px_minmax(0,1fr)] lg:grid-rows-1">
      <Tide level={level} />
      <SunGlow level={level} />
      <main className="relative z-10 overflow-y-auto overscroll-contain lg:col-start-2">
        <div key={pathname} className="screen-in">
          <Outlet />
        </div>
      </main>
      <Navigation />
      <WindToast message={wind} onDone={dismissWind} />
      <WaveWash celebration={celebration} onDone={dismissCelebration} />
    </div>
  )
}

function Navigation() {
  return (
    <nav
      aria-label="Principal"
      className="relative z-20 border-t border-white/8 bg-abyss pb-[env(safe-area-inset-bottom,0px)] lg:col-start-1 lg:row-start-1 lg:border-t-0 lg:border-r lg:px-3 lg:pt-[max(env(safe-area-inset-top,0px),24px)]"
    >
      <p className="hidden px-3 pb-6 font-display text-2xl font-semibold lg:block">Rumo</p>
      <ul className="grid grid-cols-5 lg:grid-cols-1 lg:gap-1">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <TabLink tab={tab} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function TabLink({ tab: { to, label, icon: Icon } }: { tab: Tab }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `relative flex h-15 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150 lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:text-[15px] ${
          isActive ? 'text-tide' : 'text-mist hover:text-foam'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
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
