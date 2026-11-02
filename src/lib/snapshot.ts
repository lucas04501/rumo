import type { Snapshot, Task } from '../data/types'

type AddedLater =
  | 'notes'
  | 'taskRules'
  | 'subtasks'
  | 'focusSessions'
  | 'routineSteps'
  | 'routineChecks'
  | 'achievementsSeen'

type OldSnapshot = Omit<Snapshot, AddedLater | 'tasks'> &
  Partial<Pick<Snapshot, AddedLater>> & {
    tasks: (Pick<Task, 'id' | 'date' | 'title' | 'goalId' | 'doneAt' | 'position'> & Partial<Task>)[]
  }

/**
 * A foto salva no aparelho pode ser de uma versão anterior. Sem internet, é ela
 * que abre o app até a próxima busca, então os campos novos precisam existir.
 */
export function complete(snapshot: OldSnapshot): Snapshot {
  if (snapshot.achievementsSeen) return snapshot as Snapshot

  return {
    ...snapshot,
    notes: snapshot.notes ?? [],
    tasks: snapshot.tasks.map((task) => ({
      priority: 'normal',
      ruleId: null,
      skippedAt: null,
      startedAt: null,
      ...task,
    })),
    taskRules: snapshot.taskRules ?? [],
    subtasks: snapshot.subtasks ?? [],
    focusSessions: snapshot.focusSessions ?? [],
    routineSteps: snapshot.routineSteps ?? [],
    routineChecks: snapshot.routineChecks ?? [],
    achievementsSeen: [],
  }
}
