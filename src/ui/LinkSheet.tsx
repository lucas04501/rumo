import { linkHabit, linkTask } from '../data/goalActions'
import type { Goal, Snapshot } from '../data/types'
import { tasksOn } from '../lib/tasks'
import { iconFor } from './habitIcons'
import { Sheet } from './Sheet'

type LinkSheetProps = {
  goal: Goal
  snapshot: Snapshot
  today: string
  onClosed: () => void
}

export function LinkSheet({ goal, snapshot, today, onClosed }: LinkSheetProps) {
  const habits = snapshot.habits.filter((habit) => !habit.archivedAt)
  const tasks = tasksOn(snapshot, today).filter(
    (task) => !task.doneAt && (!task.goalId || task.goalId === goal.id),
  )

  const goalName = (id: string | null) =>
    snapshot.goals.find((item) => item.id === id && item.id !== goal.id)?.title

  return (
    <Sheet title="Vincular à meta" onClosed={onClosed}>
      {() => (
        <div className="mt-3">
          <h3 className="font-display text-lg font-semibold">Hábitos</h3>
          {habits.length === 0 ? (
            <p className="mt-1 text-[15px] text-mist">Você ainda não criou hábitos.</p>
          ) : (
            <ul className="mt-1 divide-y divide-white/8">
              {habits.map((habit) => {
                const Icon = iconFor(habit.icon)
                const other = goalName(habit.goalId)
                return (
                  <li key={habit.id}>
                    <label className="link-row">
                      <input
                        type="checkbox"
                        className="link-check"
                        checked={habit.goalId === goal.id}
                        onChange={(event) => linkHabit(habit, event.target.checked ? goal.id : null)}
                      />
                      <Icon size={19} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px]">{habit.title}</span>
                        {other && (
                          <span className="block text-sm text-mist">Hoje ligado a {other}</span>
                        )}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}

          <h3 className="mt-5 font-display text-lg font-semibold">Tarefas de hoje</h3>
          {tasks.length === 0 ? (
            <p className="mt-1 text-[15px] text-mist">Nenhuma tarefa aberta para hoje.</p>
          ) : (
            <ul className="mt-1 divide-y divide-white/8">
              {tasks.map((task) => (
                <li key={task.id}>
                  <label className="link-row">
                    <input
                      type="checkbox"
                      className="link-check"
                      checked={task.goalId === goal.id}
                      onChange={(event) => linkTask(task, event.target.checked ? goal.id : null)}
                    />
                    <span className="min-w-0 flex-1 text-[17px]">{task.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  )
}
