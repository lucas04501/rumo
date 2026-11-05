import { planView, type PlanView } from '../lib/planView'
import { currentSnapshot, useSnapshot } from './store'
import { offerUndo } from './undo'

/**
 * Limites do plano, só para a tela. Quem recusa de verdade é o servidor (402), e uma
 * escrita recusada some da tela na próxima foto sem explicar nada. Por isso o app
 * avisa antes de a pessoa preencher um formulário que não vai ser aceito.
 */

const MESSAGES = {
  habits: 'No plano grátis, são até 3 hábitos ativos.',
  treinos: 'Treinos é do plano Pro. Seu histórico continua aqui.',
}

export function usePlanView(): PlanView {
  const { data } = useSnapshot()
  return planView(data)
}

export const currentPlanView = (): PlanView => planView(currentSnapshot())

export const refuseHabits = () => offerUndo({ message: MESSAGES.habits })
export const refuseTreinos = () => offerUndo({ message: MESSAGES.treinos })
