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

export type Task = {
  id: string
  date: string
  title: string
  goalId: string | null
  doneAt: string | null
  position: number
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
  days: Day[]
}
