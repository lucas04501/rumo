// Formato da foto entregue por GET /api/snapshot.

export type Goal = {
  id: string
  title: string
  why: string | null
  targetDate: string | null
  status: 'active' | 'done' | 'archived'
  doneAt: string | null
  position: number
}

export type Milestone = {
  id: string
  goalId: string
  title: string
  position: number
  doneAt: string | null
}

export type Habit = {
  id: string
  title: string
  icon: string
  weekdays: number[]
  startDate: string
  goalId: string | null
  archivedAt: string | null
  position: number
}

export type Pause = {
  id: string
  habitId: string
  startDate: string
  endDate: string
}

export type Check = { habitId: string; date: string }

export type Priority = 'high' | 'normal' | 'low'

export type Task = {
  id: string
  date: string
  title: string
  goalId: string | null
  doneAt: string | null
  position: number
  priority: Priority
  ruleId: string | null
  skippedAt: string | null
  /** Preenchido, a tarefa está em Fazendo no quadro. Concluir continua sendo só `doneAt`. */
  startedAt: string | null
}

export type TaskRule = {
  id: string
  title: string
  weekdays: number[]
  monthDay: number | null
  startDate: string
  endDate: string | null
  priority: Priority
  goalId: string | null
  position: number
}

export type Subtask = {
  id: string
  taskId: string
  title: string
  position: number
  doneAt: string | null
}

export type FocusSession = {
  id: string
  taskId: string | null
  date: string
  startedAt: string
  minutes: number
  plannedMinutes: number
}

export type RoutineStep = {
  id: string
  /** 0 é domingo, como em `Date.getDay()`. */
  weekday: number
  /** HH:MM */
  time: string
  title: string
  position: number
}

export type RoutineCheck = {
  id: string
  stepId: string
  date: string
  doneAt: string | null
}

export type WorkoutPlan = {
  id: string
  title: string
  /** Dias planejados. Vazio é uma ficha sem dia fixo. */
  weekdays: number[]
  habitId: string | null
  goalId: string | null
  archivedAt: string | null
  position: number
}

export type PlanExercise = {
  id: string
  planId: string
  /** ID da biblioteca fixa ou de um exercício próprio. */
  exerciseRef: string
  position: number
  sets: number
  reps: number
  loadKg: number | null
  restSeconds: number
  notes: string | null
}

export type WorkoutSession = {
  id: string
  planId: string
  date: string
  startedAt: string
  /** Nulo enquanto o treino está aberto. */
  finishedAt: string | null
  notes: string | null
}

/** Só existe depois de feita: série a fazer sai da ficha. */
export type SessionSet = {
  id: string
  sessionId: string
  exerciseRef: string
  position: number
  reps: number
  loadKg: number | null
  doneAt: string
}

export type CustomExercise = {
  id: string
  name: string
  muscle: string
  instructions: string
}

export type Note = {
  id: string
  goalId: string | null
  title: string
  body: string
  pinned: boolean
  updatedAt: string
}

export type Day = {
  date: string
  completedAt: string | null
  note: string | null
}

export type Snapshot = {
  user: { name: string }
  goals: Goal[]
  milestones: Milestone[]
  habits: Habit[]
  pauses: Pause[]
  checks: Check[]
  tasks: Task[]
  taskRules: TaskRule[]
  subtasks: Subtask[]
  focusSessions: FocusSession[]
  routineSteps: RoutineStep[]
  routineChecks: RoutineCheck[]
  notes: Note[]
  days: Day[]
  /** Conquistas cuja animação já tocou, em qualquer aparelho. */
  achievementsSeen: string[]
  workoutPlans: WorkoutPlan[]
  planExercises: PlanExercise[]
  workoutSessions: WorkoutSession[]
  sessionSets: SessionSet[]
  customExercises: CustomExercise[]
  /** Vale a mais recente: dois aparelhos sem internet podem criar uma cada. */
  waterSettings: WaterSettings[]
  waterLogs: WaterLog[]
}

/** O peso da calculadora não fica aqui: só a meta que saiu dele. */
export type WaterSettings = {
  id: string
  goalMl: number
  cupMl: number
  habitId: string | null
  updatedAt: string
}

export type WaterLog = {
  id: string
  date: string
  amountMl: number
  loggedAt: string
}
