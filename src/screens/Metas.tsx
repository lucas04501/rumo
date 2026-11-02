import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import type { Goal, Snapshot } from '../data/types'
import { formatShortDate, toIsoDate } from '../lib/dates'
import { deadlineLabel, goalProgress } from '../lib/goals'
import { withMilestones } from '../lib/progress'
import { GoalSheet } from '../ui/GoalSheet'
import { Screen } from '../ui/Screen'
import { Route } from '../voyage/Route'

export function Metas() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const [creating, setCreating] = useState(false)

  if (!snapshot) return null
  const active = snapshot.goals.filter((goal) => goal.status === 'active')
  const arrived = snapshot.goals.filter((goal) => goal.status === 'done')

  return (
    <Screen>
      <div className="flex max-w-2xl items-center justify-between gap-4 pt-3 lg:pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">Metas</h1>
        <button type="button" className="action flex items-center gap-1.5" onClick={() => setCreating(true)}>
          <Plus size={18} strokeWidth={2} aria-hidden />
          Nova meta
        </button>
      </div>

      {active.length === 0 && arrived.length === 0 && (
        <p className="mt-6 max-w-[42ch] text-[17px] text-mist">
          Escolha um destino, um prazo e as estações até lá. O barco anda a cada marco concluído.
        </p>
      )}

      {active.length > 0 && (
        <ul className="mt-4 max-w-2xl divide-y divide-line">
          {active.map((goal, index) => (
            <li key={goal.id}>
              <GoalItem goal={goal} snapshot={snapshot} today={date} main={index === 0} />
            </li>
          ))}
        </ul>
      )}

      {arrived.length > 0 && (
        <section aria-labelledby="portos" className="mt-9 max-w-2xl">
          <h2 id="portos" className="font-display text-xl font-semibold">
            Portos alcançados
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {arrived.map((goal) => (
              <li key={goal.id}>
                <Link
                  to={`/metas/${goal.id}`}
                  className="flex min-h-13 items-center justify-between gap-4 text-[17px]"
                >
                  <span className="min-w-0">{goal.title}</span>
                  {goal.doneAt && (
                    <span className="shrink-0 text-[15px] text-mist">
                      {formatShortDate(toIsoDate(new Date(goal.doneAt)))}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {creating && (
        <GoalSheet
          goal={null}
          milestones={[]}
          position={snapshot.goals.length}
          today={date}
          onClosed={() => setCreating(false)}
        />
      )}
    </Screen>
  )
}

type GoalItemProps = {
  goal: Goal
  snapshot: Snapshot
  today: string
  main: boolean
}

function GoalItem({ goal, snapshot, today, main }: GoalItemProps) {
  const voyage = withMilestones(goal, snapshot)
  const progress = goalProgress(voyage.milestones, goal.targetDate, today)

  return (
    <Link to={`/metas/${goal.id}`} className="block py-4">
      <span className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 font-display text-xl font-semibold">{goal.title}</span>
        <span className="shrink-0 text-[15px] text-mist">{deadlineLabel(progress.daysLeft, false)}</span>
      </span>

      {progress.total > 0 && (
        <span className="mt-3 block">
          <Route
            milestones={progress.total}
            reached={progress.reached}
            label={`${progress.reached} de ${progress.total} marcos concluídos`}
          />
        </span>
      )}

      <span className="mt-2 block text-[15px] text-mist">
        {progress.reached} de {progress.total} {progress.total === 1 ? 'marco' : 'marcos'}
        {main && ' · Meta principal'}
      </span>
    </Link>
  )
}
