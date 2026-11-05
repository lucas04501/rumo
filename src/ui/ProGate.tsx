import { Link, Outlet, useLocation } from 'react-router'
import { usePlanView } from '../data/planGate'
import { useSnapshot } from '../data/store'
import { hasAreaData } from '../lib/planView'
import { Screen } from './Screen'

/** Marca discreta das áreas do Pro no plano grátis. Não é ação nem recompensa: sem teal nem âmbar. */
export function ProMark() {
  return <span className="pro-mark">Pro</span>
}

/**
 * Rotas das áreas do Pro. No Pro, nada muda. No grátis, quem já tem dados na área a vê
 * em leitura, com a razão escrita no topo; quem não tem vê o convite.
 */
export function ProArea() {
  const { pathname } = useLocation()
  const { data: snapshot } = useSnapshot()
  const { pro } = usePlanView()

  if (pro || !snapshot) return <Outlet />
  if (!hasAreaData(snapshot, pathname)) return <ProInvite />

  return (
    <>
      <div className="mx-auto max-w-xl px-5 pt-[calc(env(safe-area-inset-top,0px)+16px)] lg:max-w-7xl lg:px-10 lg:pt-8">
        <p role="note" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-sea-2 px-4 py-2 text-[15px] text-mist">
          <span className="min-w-0 flex-1">
            Só leitura: esta área é do plano Pro. O que você já criou fica aqui para ver e excluir.
          </span>
          <Link to="/assinatura" className="inline-grid min-h-11 place-items-center font-semibold text-tide">
            Ver o Pro
          </Link>
        </p>
      </div>
      <Outlet />
    </>
  )
}

function ProInvite() {
  return (
    <Screen>
      <div className="max-w-2xl">
        <h1 className="pt-3 font-display text-4xl font-semibold tracking-[-0.02em] lg:pt-8">Do plano Pro</h1>
        <p className="mt-3 text-[17px]/snug">
          Plano e tarefas, Foco, Rotina, Notas, Água, Evolução, Conquistas e Treinos fazem parte do Pro.
        </p>
        <p className="mt-2 text-[15px] text-mist">
          No grátis, você tem Hoje, Metas e até 3 hábitos ativos.
        </p>
        <Link to="/assinatura" className="action mt-5 inline-grid min-h-12 place-items-center">
          Ver o Pro
        </Link>
      </div>
    </Screen>
  )
}
