import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { authClient } from '../data/authClient'
import { Login } from '../screens/Login'

const Landing = lazy(() => import('../landing/Landing').then((module) => ({ default: module.Landing })))

const SIGNED_IN_KEY = 'rumo:conectado'

/** A landing é para quem chega pelo navegador. Pedir a conta ou abrir o app instalado leva ao login. */
function wantsLogin(): boolean {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return standalone || new URLSearchParams(window.location.search).has('conta')
}

function readSignedIn(): boolean {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) === '1'
  } catch {
    return false
  }
}

function saveSignedIn(value: boolean) {
  try {
    if (value) localStorage.setItem(SIGNED_IN_KEY, '1')
    else localStorage.removeItem(SIGNED_IN_KEY)
  } catch {
    // Sem armazenamento, o app só deixa de abrir antes da resposta do servidor.
  }
}

/**
 * Quem já entrou neste aparelho vê o app na hora, sem esperar o banco acordar,
 * e continua usando sem internet. Só uma resposta do servidor dizendo que não
 * há sessão leva ao login.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { data, error, isPending } = authClient.useSession()
  const [signedIn, setSignedIn] = useState(readSignedIn)

  const confirmed = Boolean(data)
  const refused = !isPending && !error && !data

  useEffect(() => {
    if (confirmed) {
      saveSignedIn(true)
      setSignedIn(true)
      if (window.location.search.includes('conta=')) history.replaceState(null, '', window.location.pathname)
    } else if (refused) {
      saveSignedIn(false)
      setSignedIn(false)
    }
  }, [confirmed, refused])

  if (confirmed || signedIn) return children
  // A landing não espera o banco acordar: quem nunca entrou neste aparelho a vê na hora.
  if (!wantsLogin())
    return (
      <Suspense fallback={null}>
        <Landing />
      </Suspense>
    )
  if (isPending) return null
  return <Login />
}
