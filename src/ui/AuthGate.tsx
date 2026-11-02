import { useEffect, useState, type ReactNode } from 'react'
import { authClient } from '../data/authClient'
import { Login } from '../screens/Login'

const SIGNED_IN_KEY = 'rumo:conectado'

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
    } else if (refused) {
      saveSignedIn(false)
      setSignedIn(false)
    }
  }, [confirmed, refused])

  if (confirmed || signedIn) return children
  if (isPending) return null
  return <Login />
}
