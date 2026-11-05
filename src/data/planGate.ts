import { PLAN_MESSAGES, planView, type PlanView } from '../lib/planView'
import { currentSnapshot, useSnapshot } from './store'
import { offerUndo } from './undo'

/**
 * Limites do plano, só para a tela. Quem recusa de verdade é o servidor (402), e uma
 * escrita recusada some da tela na próxima foto sem explicar nada. Por isso o app
 * avisa antes de a pessoa preencher um formulário que não vai ser aceito. Toda escrita
 * de área do Pro também é barrada em `commit()`, com o mesmo aviso.
 */

export function usePlanView(): PlanView {
  const { data } = useSnapshot()
  return planView(data)
}

export const currentPlanView = (): PlanView => planView(currentSnapshot())

export const refuseHabits = () => offerUndo({ message: PLAN_MESSAGES.habits })
export const refusePro = () => offerUndo({ message: PLAN_MESSAGES.pro })
