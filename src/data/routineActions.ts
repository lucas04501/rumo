import { newId } from '../lib/ids'
import { nameOfDay, routineCheckId, stepsOn } from '../lib/routine'
import { commit, type Write } from './store'
import type { RoutineStep, Snapshot } from './types'
import { offerUndo } from './undo'

const now = () => new Date().toISOString()

const putStep = (step: RoutineStep, editedAt = now()): Write => ({
  method: 'PUT',
  path: `/routine-steps/${step.id}`,
  body: { ...step, editedAt },
})

const deleteStepWrite = (id: string): Write => ({ method: 'DELETE', path: `/routine-steps/${id}` })

/** Grava passos, novos ou editados. Cada dia guarda a sua cópia, sem ligação com os outros. */
export function saveSteps(steps: RoutineStep[]) {
  const editedAt = now()
  const ids = new Set(steps.map((step) => step.id))
  commit(
    (current) => ({
      ...current,
      routineSteps: [...current.routineSteps.filter((step) => !ids.has(step.id)), ...steps],
    }),
    steps.map((step) => putStep(step, editedAt)),
  )
}

/** Some da tela na hora, e o `DELETE` só entra na fila quando o prazo de desfazer acaba. */
export function removeStep(step: RoutineStep) {
  commit(
    (current) => ({
      ...current,
      routineSteps: current.routineSteps.filter((item) => item.id !== step.id),
    }),
    [],
  )
  offerUndo({
    message: 'Passo excluído',
    undo: () =>
      commit((current) => ({ ...current, routineSteps: [...current.routineSteps, step] }), []),
    expire: () => commit((current) => current, [deleteStepWrite(step.id)]),
  })
}

/** O check tem ID fixo e usa `doneAt`, porque uma linha excluída não aceitaria voltar. */
export function setStepDone(stepId: string, date: string, done: boolean) {
  const check = {
    id: routineCheckId(stepId, date),
    stepId,
    date,
    doneAt: done ? now() : null,
  }

  commit(
    (current) => ({
      ...current,
      routineChecks: [
        ...current.routineChecks.filter((item) => item.id !== check.id),
        ...(done ? [check] : []),
      ],
    }),
    [{ method: 'PUT', path: `/routine-checks/${check.id}`, body: { ...check, editedAt: now() } }],
  )
}

/** Troca a rotina de um dia pela de outro. Os passos antigos só saem depois do prazo. */
export function copyDay(from: number, to: number, snapshot: Snapshot) {
  const replaced = stepsOn(snapshot.routineSteps, to)
  const copies = stepsOn(snapshot.routineSteps, from).map((step) => ({
    ...step,
    id: newId(),
    weekday: to,
  }))
  const newIds = new Set(copies.map((step) => step.id))
  const oldIds = new Set(replaced.map((step) => step.id))

  commit(
    (current) => ({
      ...current,
      routineSteps: [...current.routineSteps.filter((step) => !oldIds.has(step.id)), ...copies],
    }),
    copies.map((step) => putStep(step)),
  )

  offerUndo({
    message: `${nameOfDay(to)} copiada de ${nameOfDay(from).toLowerCase()}`,
    undo: () =>
      commit(
        (current) => ({
          ...current,
          routineSteps: [
            ...current.routineSteps.filter((step) => !newIds.has(step.id)),
            ...replaced,
          ],
        }),
        copies.map((step) => deleteStepWrite(step.id)),
      ),
    expire: () =>
      commit(
        (current) => current,
        replaced.map((step) => deleteStepWrite(step.id)),
      ),
  })
}
