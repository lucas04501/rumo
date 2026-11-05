import type { Snapshot, Task } from '../data/types'
import type { PlanInfo } from './plan'

// Foto de antes dos planos: sem internet, vale o mais generoso. A trava de verdade é do servidor.
const DEFAULT_PLAN: PlanInfo = {
  tier: 'pro',
  billing: false,
  trialAvailable: false,
  trialEndsAt: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
}

type AddedLater =
  | 'notes'
  | 'taskRules'
  | 'subtasks'
  | 'focusSessions'
  | 'routineSteps'
  | 'routineChecks'
  | 'achievementsSeen'
  | 'workoutPlans'
  | 'planExercises'
  | 'workoutSessions'
  | 'sessionSets'
  | 'customExercises'
  | 'waterSettings'
  | 'waterLogs'
  | 'plan'

type OldSnapshot = Omit<Snapshot, AddedLater | 'tasks'> &
  Partial<Pick<Snapshot, AddedLater>> & {
    tasks: (Pick<Task, 'id' | 'date' | 'title' | 'goalId' | 'doneAt' | 'position'> & Partial<Task>)[]
  }

/**
 * A foto salva no aparelho pode ser de uma versão anterior. Sem internet, é ela
 * que abre o app até a próxima busca, então os campos novos precisam existir.
 */
export function complete(snapshot: OldSnapshot): Snapshot {
  // Foto de antes de a assinatura existir pode ter `plan` sem os campos de cobrança.
  if (snapshot.plan && 'billing' in snapshot.plan) return snapshot as Snapshot
  if (snapshot.plan) return { ...snapshot, plan: { ...DEFAULT_PLAN, ...(snapshot.plan as Partial<PlanInfo>) } } as Snapshot

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
    achievementsSeen: snapshot.achievementsSeen ?? [],
    workoutPlans: snapshot.workoutPlans ?? [],
    planExercises: snapshot.planExercises ?? [],
    workoutSessions: snapshot.workoutSessions ?? [],
    sessionSets: snapshot.sessionSets ?? [],
    customExercises: snapshot.customExercises ?? [],
    waterSettings: snapshot.waterSettings ?? [],
    waterLogs: snapshot.waterLogs ?? [],
    // Foto de antes dos planos: sem internet, vale o mais generoso. A trava de verdade é do servidor.
    plan: DEFAULT_PLAN,
  }
}
