import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { request } from '../data/api'
import { refreshSnapshot, useSnapshot } from '../data/store'
import { FREE_MAX_HABITS, TRIAL_DAYS } from '../lib/plan'
import { isCortesia } from '../lib/profile'
import { Screen } from '../ui/Screen'

const PRICE = 'R$ 14,90 por mês'

const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

export function Assinatura() {
  const { data: snapshot } = useSnapshot()
  const [params] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const plan = snapshot?.plan
  const back = params.get('assinou') === '1'

  // O aviso da Stripe pode chegar depois de a pessoa voltar do pagamento: confere de novo até virar Pro.
  useEffect(() => {
    if (!back || plan?.tier === 'pro') return
    const poll = setInterval(() => void refreshSnapshot(), 2000)
    const stop = setTimeout(() => clearInterval(poll), 30_000)
    return () => {
      clearInterval(poll)
      clearTimeout(stop)
    }
  }, [back, plan?.tier])

  // Pagamento e gestão acontecem na Stripe: o app nunca vê nem guarda dado de cartão.
  const open = async (path: '/billing/checkout' | '/billing/portal') => {
    setBusy(true)
    setError(null)
    try {
      const { url } = await request<{ url: string }>('POST', path)
      window.location.assign(url)
    } catch {
      setError('Não foi possível abrir agora. Confira a internet e tente de novo.')
      setBusy(false)
    }
  }

  if (!plan) return null

  return (
    <Screen>
      <div className="max-w-2xl">
        <Link to="/perfil" className="-ml-1 inline-flex min-h-11 items-center px-1 text-[15px] text-mist underline underline-offset-4">
          Voltar
        </Link>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">Assinatura</h1>

        {!plan.billing ? (
          <p className="mt-4 text-[17px]/snug">O Rumo está liberado para todos por enquanto. Não há nada para assinar.</p>
        ) : plan.tier === 'pro' ? (
          <div className="mt-4 grid gap-3">
            <p className="font-display text-2xl font-semibold">Rumo Pro</p>
            {isCortesia(plan) ? (
              <p className="text-[17px]/snug">Cortesia do Rumo: o Pro está liberado na sua conta, sem cobrança.</p>
            ) : plan.cancelAtPeriodEnd && plan.periodEnd ? (
              <p className="text-[17px]/snug">
                Cancelada. Você segue com o Pro até {day(plan.periodEnd)} e não será cobrado de novo.
              </p>
            ) : plan.trialEndsAt ? (
              <p className="text-[17px]/snug">
                Teste grátis até {day(plan.trialEndsAt)}. Depois, {PRICE} no cartão cadastrado. Cancelando antes, você não paga nada.
              </p>
            ) : (
              <p className="text-[17px]/snug">
                Ativa, {PRICE}.{plan.periodEnd ? ` Próxima cobrança em ${day(plan.periodEnd)}.` : ''}
              </p>
            )}
            {!isCortesia(plan) && (
              <button type="button" className="ghost min-h-12 justify-self-start" disabled={busy} onClick={() => void open('/billing/portal')}>
                Gerenciar assinatura
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <p className="font-display text-2xl font-semibold">Rumo Pro</p>
            <p className="text-[17px]/snug">
              Tudo do Rumo: hábitos sem limite, Plano e tarefas, Foco, Rotina, Notas, Água, Evolução, Conquistas e Treinos. {PRICE}.
            </p>
            <p className="text-[15px] text-mist">
              No grátis, você tem Hoje, Metas e até {FREE_MAX_HABITS} hábitos ativos. O que já criou nas outras áreas continua guardado, para ver, exportar e excluir.
            </p>
            {back ? (
              <p role="status" className="text-[15px] text-mist">Confirmando sua assinatura…</p>
            ) : (
              <>
                {plan.trialAvailable && (
                  <p className="text-[15px] text-mist">
                    {TRIAL_DAYS} dias grátis. Você informa o cartão agora e só é cobrado depois dos {TRIAL_DAYS} dias. Cancele antes e não paga nada.
                  </p>
                )}
                <button type="button" className="action min-h-12 justify-self-start" disabled={busy} onClick={() => void open('/billing/checkout')}>
                  {plan.trialAvailable ? `Começar ${TRIAL_DAYS} dias grátis` : 'Assinar'}
                </button>
              </>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-[15px]">
            {error}
          </p>
        )}
      </div>
    </Screen>
  )
}
