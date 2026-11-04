import { useState, type FormEvent } from 'react'
import { authClient } from '../data/authClient'
import { SunGlow } from '../voyage/SunGlow'
import { Tide } from '../voyage/Tide'

const TIDE = 0.18
const MIN_PASSWORD = 8
const EXPIRED = 'Este link venceu ou já foi usado. Peça outro na tela de entrar.'

/** Fora do login: quem chega pelo link do e-mail ainda não tem sessão. */
export function Redefinir() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(token && !params.get('error') ? null : EXPIRED)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setSending(true)
    setError(null)

    try {
      const result = await authClient.resetPassword({ newPassword: password, token })
      if (!result.error) setDone(true)
      else if (result.error.status === 400) setError(EXPIRED)
      else setError('Não foi possível trocar a senha. Tente de novo.')
    } catch {
      setError('Não foi possível conectar. Confira a internet e tente de novo.')
    }

    setSending(false)
  }

  const usable = token && error !== EXPIRED && !done
  const subtitle = done ? 'Senha trocada. Entre com a senha nova.' : usable ? 'Crie uma senha nova para a sua conta.' : 'Redefinir a senha.'

  return (
    <div className="relative grid min-h-dvh overflow-y-auto">
      <Tide level={TIDE} />
      <SunGlow level={TIDE} />

      <main className="relative z-10 mx-auto flex w-full max-w-sm flex-col justify-center px-5 pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
        <h1 className="font-display text-[42px]/[1.05] font-semibold tracking-[-0.025em]">Rumo</h1>
        <p className="mt-2 text-[17px] text-mist">{subtitle}</p>

        {usable && (
          <form onSubmit={submit} className="mt-8 grid gap-4">
            <label className="grid gap-1.5 text-[15px] text-mist">
              Senha nova
              <input
                className="field"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={MIN_PASSWORD}
                enterKeyHint="go"
                required
              />
            </label>
            {error && (
              <p role="alert" className="text-[15px] text-foam">
                {error}
              </p>
            )}
            <button type="submit" className="action mt-2 min-h-12" disabled={sending}>
              {sending ? 'Aguarde…' : 'Trocar senha'}
            </button>
          </form>
        )}

        {!usable && (
          <>
            {error && (
              <p role="alert" className="mt-8 text-[15px] text-foam">
                {error}
              </p>
            )}
            <a href="/" className="action mt-6 grid min-h-12 place-items-center">
              Ir para entrar
            </a>
          </>
        )}
      </main>
    </div>
  )
}
