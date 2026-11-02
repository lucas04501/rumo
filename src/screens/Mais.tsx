import { ChevronRight, NotebookPen, Timer, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { authClient } from '../data/authClient'
import { clearDevice } from '../data/store'
import { Screen } from '../ui/Screen'

type Area = { to: string; label: string; icon: LucideIcon }

// Evolução e Treinos entram aqui quando existirem. Item sem tela só atrapalha.
const AREAS: Area[] = [
  { to: '/notas', label: 'Notas', icon: NotebookPen },
  { to: '/foco', label: 'Foco', icon: Timer },
]

async function signOut() {
  await authClient.signOut()
  await clearDevice()
}

export function Mais() {
  return (
    <Screen>
      <div className="max-w-2xl">
        <h1 className="pt-3 font-display text-4xl font-semibold tracking-[-0.02em] lg:pt-8">
          <span className="lg:hidden">Mais</span>
          <span className="hidden lg:inline">Ajustes</span>
        </h1>

        <nav aria-label="Outras áreas" className="mt-3 lg:hidden">
          <ul className="divide-y divide-white/8">
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
          <button
            type="button"
            className="mt-2 -ml-1 min-h-11 px-1 text-[15px] text-mist underline underline-offset-4"
            onClick={signOut}
          >
            Sair da conta
          </button>
          <p className="text-[15px] text-mist">Versão {__APP_VERSION__}</p>
        </section>
      </div>
    </Screen>
  )
}
