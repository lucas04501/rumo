import { newId } from '../lib/ids'
import { currentPlanView, refusePro } from './planGate'
import { commit, type Write } from './store'
import type {
  CustomExercise,
  PlanExercise,
  SessionSet,
  WorkoutPlan,
  WorkoutSession,
} from './types'
import { offerUndo } from './undo'

const now = () => new Date().toISOString()

/** Treinos fica em leitura fora do Pro. Excluir e desfazer continuam livres. */
function open(): boolean {
  if (currentPlanView().pro) return true
  refusePro()
  return false
}

const put = <T extends { id: string }>(path: string, item: T, editedAt = now()): Write => ({
  method: 'PUT',
  path: `${path}/${item.id}`,
  body: { ...item, editedAt },
})

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((current) => current.id === item.id)
    ? list.map((current) => (current.id === item.id ? item : current))
    : [...list, item]

export function savePlan(plan: WorkoutPlan) {
  if (!open()) return
  commit((current) => ({ ...current, workoutPlans: upsert(current.workoutPlans, plan) }), [
    put('/workout-plans', plan),
  ])
}

export function savePlanExercise(exercise: PlanExercise) {
  if (!open()) return
  commit((current) => ({ ...current, planExercises: upsert(current.planExercises, exercise) }), [
    put('/plan-exercises', exercise),
  ])
}

/** O histórico guarda o exercício nas séries: tirar da ficha não apaga o que foi feito. */
export function removePlanExercise(exercise: PlanExercise) {
  commit(
    (current) => ({
      ...current,
      planExercises: current.planExercises.filter((item) => item.id !== exercise.id),
    }),
    [],
  )
  offerUndo({
    message: 'Exercício tirado da ficha',
    undo: () =>
      commit(
        (current) => ({ ...current, planExercises: upsert(current.planExercises, exercise) }),
        [],
      ),
    expire: () =>
      commit((current) => current, [{ method: 'DELETE', path: `/plan-exercises/${exercise.id}` }]),
  })
}

export function swapPlanExercises(first: PlanExercise, second: PlanExercise) {
  if (!open()) return
  const editedAt = now()
  const moved = [
    { ...first, position: second.position },
    { ...second, position: first.position },
  ]
  commit(
    (current) => ({ ...current, planExercises: moved.reduce(upsert, current.planExercises) }),
    moved.map((exercise) => put('/plan-exercises', exercise, editedAt)),
  )
}

export function saveCustomExercise(exercise: CustomExercise) {
  if (!open()) return
  commit(
    (current) => ({ ...current, customExercises: upsert(current.customExercises, exercise) }),
    [put('/custom-exercises', exercise)],
  )
}

export function startSession(planId: string, date: string): WorkoutSession {
  const session: WorkoutSession = {
    id: newId(),
    planId,
    date,
    startedAt: now(),
    finishedAt: null,
    notes: null,
  }
  saveSession(session)
  return session
}

export function saveSession(session: WorkoutSession) {
  if (!open()) return
  commit(
    (current) => ({ ...current, workoutSessions: upsert(current.workoutSessions, session) }),
    [put('/workout-sessions', session)],
  )
}

export function markSet(fields: Omit<SessionSet, 'id' | 'doneAt'>) {
  if (!open()) return
  const set: SessionSet = { ...fields, id: newId(), doneAt: now() }
  commit((current) => ({ ...current, sessionSets: [...current.sessionSets, set] }), [
    put('/session-sets', set),
  ])
}

export function unmarkSet(set: SessionSet) {
  commit(
    (current) => ({
      ...current,
      sessionSets: current.sessionSets.filter((item) => item.id !== set.id),
    }),
    [{ method: 'DELETE', path: `/session-sets/${set.id}` }],
  )
}

/** Some da tela na hora, e os `DELETE` só entram na fila quando o prazo de desfazer acaba. */
export function removeSession(session: WorkoutSession, sets: SessionSet[], message: string) {
  const ids = new Set(sets.map((set) => set.id))
  commit(
    (current) => ({
      ...current,
      workoutSessions: current.workoutSessions.filter((item) => item.id !== session.id),
      sessionSets: current.sessionSets.filter((set) => !ids.has(set.id)),
    }),
    [],
  )
  offerUndo({
    message,
    undo: () =>
      commit(
        (current) => ({
          ...current,
          workoutSessions: [...current.workoutSessions, session],
          sessionSets: [...current.sessionSets, ...sets],
        }),
        [],
      ),
    expire: () =>
      commit((current) => current, [
        ...sets.map((set): Write => ({ method: 'DELETE', path: `/session-sets/${set.id}` })),
        { method: 'DELETE', path: `/workout-sessions/${session.id}` },
      ]),
  })
}
