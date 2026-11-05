import {
  ChevronRight,
  Compass,
  Dumbbell,
  Flag,
  Medal,
  Ship,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { request } from '../data/api'
import { authClient } from '../data/authClient'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import { useAvatar } from '../data/useAvatar'
import { formatDayShort } from '../lib/dates'
import { formatMinutes } from '../lib/evolution'
import { activityOf, hasInvoices, planSummary } from '../lib/profile'
import { timelineOf, type TimelineKind } from '../lib/timeline'
import { Avatar } from '../ui/Avatar'
import { AvatarSheet } from '../ui/AvatarSheet'
import { Screen } from '../ui/Screen'

const PAGE = 20
const SECTION = 'mt-9 first:mt-0'
const HEADING = 'font-display text-xl font-semibold'
const LINK = '-ml-1 min-h-11 px-1 text-[15px] text-mist underline underline-offset-4'

// Âmbar é recompensa: tudo o que deu XP ou medalha. Treino não dá XP por existir, então fica em névoa.
const ICONS: Record<TimelineKind, { icon: LucideIcon; reward: boolean }> = {
  achievement: { icon: Medal, reward: true },
  rank: { icon: Ship, reward: true },
  record: { icon: TrendingUp, reward: true },
  milestone: { icon: Flag, reward: true },
  goal: { icon: Compass, reward: true },
  workout: { icon: Dumbbell, reward: false },
}

/** Com o ano só quando não é o atual, para caber em uma linha em 320 px. */
const whenOf = (date: string, today: string) =>
  date.slice(0, 4) === today.slice(0, 4) ? formatDayShort(date) : `${formatDayShort(date)} ${date.slice(0, 4)}`

export function Perfil() {
  const { date: today } = useDay()
  const { data: snapshot } = useSnapshot()
  const { data: session } = authClient.useSession()
  const avatar = useAvatar(session?.user.id)
  const [editing, setEditing] = useState(false)
  const [shown, setShown] = useState(PAGE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const view = useMemo(
    () => (snapshot ? { activity: activityOf(snapshot), events: timelineOf(snapshot, today) } : null),
    [snapshot, today],
  )
  if (!snapshot || !view) return null

  const { activity, events } = view
  const name = snapshot.user.name || session?.user.name || ''
  const summary = planSummary(snapshot.plan)
  const since = session?.user.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const rows = [
    ...(activity.activeDays > 0
      ? [
          ['Dias ativos', String(activity.activeDays)],
          ['Hábitos concluídos', activity.habitsDone.toLocaleString('pt-BR')],
        ]
      : []),
    // Quem nunca treinou ou focou não vê um zero cobrando: a linha só aparece quando há o que contar.
    ...(activity.workouts > 0 ? [['Treinos feitos', String(activity.workouts)]] : []),
    ...(activity.focusMinutes > 0 ? [['Foco', formatMinutes(activity.focusMinutes)]] : []),
    ...(since ? [['No Rumo desde', since]] : []),
  ]

  // Pagamento e faturas acontecem na Stripe: o app nunca vê nem guarda dado de cartão.
  const openInvoices = async () => {
    setBusy(true)
    setError(null)
    try {
      const { url } = await request<{ url: string }>('POST', '/billing/portal')
      window.location.assign(url)
    } catch {
      setError('Não foi possível abrir agora. Confira a internet e tente de novo.')
      setBusy(false)
    }
  }

  return (
    <Screen>
      <h1 className="pt-3 font-display text-4xl font-semibold tracking-[-0.02em] lg:pt-8">Perfil</h1>

      <div className="mt-4 flex items-center gap-4">
        <Avatar name={name} avatar={avatar} size={72} />
        <div className="min-w-0">
          {name && <p className="font-display text-2xl font-semibold wrap-anywhere">{name}</p>}
          {session?.user.email && <p className="text-[15px] text-mist wrap-anywhere">{session.user.email}</p>}
          {session && (
            <button type="button" className={LINK} onClick={() => setEditing(true)}>
              Mudar avatar
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)] lg:gap-16">
        <div>
          {snapshot.plan.billing && (
            <section aria-labelledby="plano" className={SECTION}>
              <h2 id="plano" className={HEADING}>
                Plano
              </h2>
              <Link to="/assinatura" className="mt-2 flex items-center gap-3 rounded-xl bg-sea-2 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold">{summary.title}</span>
                  <span className="block text-[15px] text-mist">{summary.line}</span>
                  <span className="mt-2 block text-[15px] font-semibold text-tide">{summary.action}</span>
                </span>
                <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
              </Link>
              {hasInvoices(snapshot.plan) && (
                <button type="button" className={`${LINK} mt-1`} disabled={busy} onClick={() => void openInvoices()}>
                  Faturas e pagamento
                </button>
              )}
              {error && (
                <p role="alert" className="mt-2 text-[15px]">
                  {error}
                </p>
              )}
            </section>
          )}

          <section aria-labelledby="atividade" className={SECTION}>
            <h2 id="atividade" className={HEADING}>
              Atividade
            </h2>
            {activity.activeDays === 0 && (
              <p className="mt-2 max-w-[42ch] text-[17px] text-mist">
                Seus números aparecem aqui depois do primeiro hábito, tarefa ou treino concluído.
              </p>
            )}
            <dl className="mt-1 divide-y divide-line">
              {rows.map(([label, value]) => (
                <div key={label} className="flex min-h-12 items-baseline justify-between gap-4 py-2.5">
                  <dt className="min-w-0 text-[17px] text-mist">{label}</dt>
                  <dd className="shrink-0 text-right text-[17px] font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section aria-labelledby="linha-do-tempo" className={`${SECTION} lg:mt-0`}>
          <h2 id="linha-do-tempo" className={HEADING}>
            Linha do tempo
          </h2>
          {events.length === 0 ? (
            <p className="mt-2 max-w-[42ch] text-[17px] text-mist">
              Sua história começa na primeira conquista. Marque um hábito ou conclua uma tarefa para começar.
            </p>
          ) : (
            <>
              <ul className="mt-1 divide-y divide-line">
                {events.slice(0, shown).map(({ id, date, kind, title, detail }) => {
                  const { icon: Icon, reward } = ICONS[kind]
                  return (
                    <li key={id} className="flex min-h-14 items-start gap-3 py-3">
                      <Icon
                        size={20}
                        strokeWidth={1.75}
                        className={`mt-0.5 shrink-0 ${reward ? 'text-sun' : 'text-mist'}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 text-[17px] font-[450] wrap-anywhere">{title}</span>
                          <span className="shrink-0 text-[15px] text-mist">{whenOf(date, today)}</span>
                        </p>
                        <p className="text-[15px] text-mist wrap-anywhere">{detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {events.length > shown && (
                <button type="button" className="ghost mt-3 min-h-12" onClick={() => setShown(shown + PAGE)}>
                  Mostrar mais
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {editing && session && (
        <AvatarSheet userId={session.user.id} name={name} avatar={avatar} onClosed={() => setEditing(false)} />
      )}
    </Screen>
  )
}
