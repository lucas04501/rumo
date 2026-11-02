import {
  Anchor,
  CheckCheck,
  Compass,
  Flag,
  ListChecks,
  Timer,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import {
  ACHIEVEMENT_GROUPS,
  achievementViews,
  type AchievementView,
  type Measure,
} from '../lib/achievements'
import { formatMinutes } from '../lib/evolution'
import { Meter } from '../ui/EvolutionCharts'
import { Screen } from '../ui/Screen'

const ICONS: Record<Measure, LucideIcon> = {
  streak: Anchor,
  perfectDays: Waves,
  habits: ListChecks,
  tasks: CheckCheck,
  focus: Timer,
  milestones: Flag,
  goals: Compass,
}

const figure = (value: number, measure: Measure) =>
  measure === 'focus' ? formatMinutes(value) : value.toLocaleString('pt-BR')

export function Conquistas() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const views = useMemo(() => (snapshot ? achievementViews(snapshot, date) : []), [snapshot, date])
  const earned = views.filter((view) => view.earned).length

  return (
    <Screen>
      <div className="flex items-baseline justify-between gap-4 pt-3 lg:pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">Conquistas</h1>
        <p className="shrink-0 text-[17px] text-mist">
          <span className="font-semibold text-sun">{earned}</span> de {views.length}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-9 lg:grid-cols-2 lg:gap-x-16">
        {ACHIEVEMENT_GROUPS.map(({ measure, label }) => (
          <section key={measure} aria-labelledby={`grupo-${measure}`}>
            <h2 id={`grupo-${measure}`} className="font-display text-xl font-semibold">
              {label}
            </h2>
            <ul className="mt-1 divide-y divide-line">
              {views
                .filter((view) => view.measure === measure)
                .map((view) => (
                  <Medal key={view.id} view={view} />
                ))}
            </ul>
          </section>
        ))}
      </div>
    </Screen>
  )
}

function Medal({ view }: { view: AchievementView }) {
  const { title, detail, measure, target, value, earned } = view
  const Icon = ICONS[measure]
  const percent = Math.min(100, Math.floor((value / target) * 100))

  return (
    <li className="flex min-h-16 items-center gap-3 py-2.5">
      <span className="medal" data-earned={earned}>
        <Icon size={20} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-3">
          <span className={`min-w-0 text-[17px] font-[450] ${earned ? '' : 'text-mist'}`}>
            {title}
            <span className="sr-only">{earned ? ', conquistada' : ', ainda não conquistada'}</span>
          </span>
          {!earned && (
            <span className="shrink-0 text-sm text-mist">
              {figure(value, measure)} de {figure(target, measure)}
            </span>
          )}
        </p>
        <p className="text-[15px] text-mist">{detail}</p>
        {!earned && value > 0 && (
          <div className="mt-1.5">
            <Meter value={percent} label={`${title}: ${percent}%`} />
          </div>
        )}
      </div>
    </li>
  )
}
