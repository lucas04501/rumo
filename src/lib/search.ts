import type { Goal, Habit, Note, Snapshot, Task, TaskRule } from '../data/types'
import { formatShortDate } from './dates'
import { describeWeekdays } from './habits'
import { normalize, noteTitle, notePreview } from './notes'
import { describeRule, tasksOn } from './tasks'

export type Hit =
  | { kind: 'task'; id: string; title: string; detail: string; task: Task }
  | { kind: 'rule'; id: string; title: string; detail: string; rule: TaskRule }
  | { kind: 'habit'; id: string; title: string; detail: string; habit: Habit }
  | { kind: 'goal'; id: string; title: string; detail: string; goal: Goal }
  | { kind: 'note'; id: string; title: string; detail: string; note: Note }

const PER_KIND = 5

const taskDetail = ({ date, doneAt }: Task) =>
  `Tarefa, ${formatShortDate(date)}${doneAt ? ', concluída' : ''}`

/** As que faltam primeiro, e entre elas a de data mais recente. */
const byRelevance = (a: Task, b: Task) =>
  Number(Boolean(a.doneAt)) - Number(Boolean(b.doneAt)) || b.date.localeCompare(a.date)

/** Procura em tudo o que tem nome. Sem acento e sem maiúscula, como a busca de notas. */
export function searchAll(snapshot: Snapshot, query: string, today: string): Hit[] {
  const wanted = normalize(query)
  if (!wanted) return []
  const matches = (text: string) => normalize(text).includes(wanted)

  const rows = [...snapshot.tasks.filter((task) => !task.skippedAt), ...tasksOn(snapshot, today)]
  const tasks = [...new Map(rows.map((task) => [task.id, task])).values()]
    .filter((task) => matches(task.title))
    .sort(byRelevance)
    .slice(0, PER_KIND)

  const hits: Hit[] = [
    ...snapshot.goals
      .filter((goal) => goal.status !== 'archived' && matches(goal.title))
      .slice(0, PER_KIND)
      .map((goal): Hit => ({ kind: 'goal', id: goal.id, title: goal.title, detail: 'Meta', goal })),
    ...snapshot.habits
      .filter((habit) => !habit.archivedAt && matches(habit.title))
      .slice(0, PER_KIND)
      .map(
        (habit): Hit => ({
          kind: 'habit',
          id: habit.id,
          title: habit.title,
          detail: `Hábito, ${describeWeekdays(habit.weekdays).toLowerCase()}`,
          habit,
        }),
      ),
    ...tasks.map(
      (task): Hit => ({ kind: 'task', id: task.id, title: task.title, detail: taskDetail(task), task }),
    ),
    ...snapshot.taskRules
      .filter((rule) => !rule.endDate && matches(rule.title))
      .slice(0, PER_KIND)
      .map(
        (rule): Hit => ({
          kind: 'rule',
          id: rule.id,
          title: rule.title,
          detail: `Repete: ${describeRule(rule).toLowerCase()}`,
          rule,
        }),
      ),
    ...snapshot.notes
      .filter((note) => matches(`${note.title}\n${note.body}`))
      .slice(0, PER_KIND)
      .map(
        (note): Hit => ({
          kind: 'note',
          id: note.id,
          title: noteTitle(note),
          detail: `Nota${notePreview(note) ? `: ${notePreview(note)}` : ''}`,
          note,
        }),
      ),
  ]

  return hits
}
