import {
  CalendarClock,
  ChartNoAxesCombined,
  ChevronRight,
  Columns3,
  Dumbbell,
  GlassWater,
  Medal,
  NotebookPen,
  Search,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { authClient } from '../data/authClient'
import { exportMyData } from '../data/exportData'
import { openLayer } from '../data/layers'
import { clearDevice, useSnapshot } from '../data/store'
import { settleUndo } from '../data/undo'
import { useAvatar } from '../data/useAvatar'
import { Avatar } from '../ui/Avatar'
import { DeleteAccountSheet } from '../ui/DeleteAccountSheet'
import { Screen } from '../ui/Screen'

type Area = { to: string; label: string; icon: LucideIcon }

// Item sem tela só atrapalha.
const AREAS: Area[] = [
  { to: '/quadro', label: 'Quadro', icon: Columns3 },
  { to: '/treinos', label: 'Treinos', icon: Dumbbell },
  { to: '/agua', label: 'Água', icon: GlassWater },
  { to: '/rotina', label: 'Rotina', icon: CalendarClock },
  { to: '/evolucao', label: 'Evolução', icon: ChartNoAxesCombined },
  { to: '/conquistas', label: 'Conquistas', icon: Medal },
  { to: '/notas', label: 'Notas', icon: NotebookPen },
  { to: '/foco', label: 'Foco', icon: Timer },
]

async function signOut() {
  settleUndo()
  await authClient.signOut()
  await clearDevice()
}

const SETTING = '-ml-1 min-h-11 px-1 text-[15px] text-mist underline underline-offset-4'

export function Mais() {
  const { data: snapshot } = useSnapshot()
  const { data: session } = authClient.useSession()
  const [deleting, setDeleting] = useState(false)
  const email = session?.user.email ?? ''
  const name = snapshot?.user.name || session?.user.name || ''
  const avatar = useAvatar(session?.user.id)

  return (
    <Screen>
      <div className="max-w-2xl">
        <h1 className="pt-3 font-display text-4xl font-semibold tracking-[-0.02em] lg:pt-8">
          <span className="lg:hidden">Mais</span>
          <span className="hidden lg:inline">Ajustes</span>
        </h1>

        <nav aria-label="Outras áreas" className="mt-3 lg:hidden">
          <ul className="divide-y divide-line">
            <li>
              <Link to="/perfil" className="flex min-h-16 items-center gap-3 text-[17px]">
                <Avatar name={name} avatar={avatar} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block">Perfil</span>
                  {name && <span className="block truncate text-[15px] text-mist">{name}</span>}
                </span>
                <ChevronRight size={18} strokeWidth={1.75} className="text-mist" aria-hidden />
              </Link>
            </li>
            <li>
              <button
                type="button"
                className="flex min-h-14 w-full items-center gap-3 text-left text-[17px]"
                onClick={() => openLayer('buscar')}
              >
                <Search size={20} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
                Buscar
              </button>
            </li>
            {AREAS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link to={to} className="flex min-h-14 items-center gap-3 text-[17px]">
                  <Icon size={20} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
                  <span className="min-w-0 flex-1">{label}</span>
                  <ChevronRight size={18} strokeWidth={1.75} className="text-mist" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="ajustes" className="mt-8 lg:mt-4">
          <h2 id="ajustes" className="font-display text-xl font-semibold lg:sr-only">
            Ajustes
          </h2>
          {email && <p className="mt-2 text-[15px] text-mist wrap-anywhere">{email}</p>}
          <div className="mt-2 grid justify-items-start">
            <button type="button" className={SETTING} onClick={signOut}>
              Sair da conta
            </button>
            <button
              type="button"
              className={SETTING}
              onClick={() => {
                if (snapshot) void exportMyData(snapshot, email)
              }}
            >
              Exportar meus dados
            </button>
            <a href="/termos" className={`${SETTING} grid place-items-center`}>
              Termos de uso
            </a>
            <a href="/privacidade" className={`${SETTING} grid place-items-center`}>
              Privacidade
            </a>
            <button type="button" className={SETTING} onClick={() => setDeleting(true)}>
              Excluir minha conta
            </button>
          </div>
          <p className="mt-2 text-[15px] text-mist">Versão {__APP_VERSION__}</p>
        </section>
      </div>
      {deleting && <DeleteAccountSheet onClosed={() => setDeleting(false)} />}
    </Screen>
  )
}
