import type { Snapshot, Task } from '../data/types'

type OldSnapshot = Omit<Snapshot, 'notes' | 'tasks' | 'taskRules' | 'subtasks' | 'focusSessions'> &
  Partial<Pick<Snapshot, 'notes' | 'taskRules' | 'subtasks' | 'focusSessions'>> & {
    tasks: (Pick<Task, 'id' | 'date' | 'title' | 'goalId' | 'doneAt' | 'position'> & Partial<Task>)[]
  }

/**
 * A foto salva no aparelho pode ser de uma versão anterior. Sem internet, é ela
 * que abre o app até a próxima busca, então os campos novos precisam existir.
 */
export function complete(snapshot: OldSnapshot): Snapshot {
  if (snapshot.focusSessions && snapshot.notes) return snapshot as Snapshot

  return {
    ...snapshot,
    notes: snapshot.notes ?? [],
    tasks: snapshot.tasks.map((task) => ({
      priority: 'normal',
      ruleId: null,
      skippedAt: null,
      ...task,
    })),
    taskRules: snapshot.taskRules ?? [],
    subtasks: snapshot.subtasks ?? [],
    focusSessions: snapshot.focusSessions ?? [],
  }
}
