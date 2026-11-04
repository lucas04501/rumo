import { useEffect, useState, type FormEvent } from 'react'
import { authClient } from '../data/authClient'
import { SunGlow } from '../voyage/SunGlow'
import { Tide } from '../voyage/Tide'

type Mode = 'entrar' | 'criar' | 'esqueci'

const SUBTITLE: Record<Mode, string> = {
  entrar: 'Entre para continuar a viagem.',
  criar: 'Crie sua conta para começar a viagem.',
  esqueci: 'Digite o e-mail da conta. Mandamos um link para criar uma senha nova.',
}

const LOGIN_TIDE = 0.18
const LINK = 'min-h-11 text-[15px] text-mist underline underline-offset-4'
const MIN_PASSWORD = 8

function messageFor(status: number, mode: Mode): string {
  if (status === 429) return 'Muitas tentativas. Aguarde um minuto e tente de novo.'
  if (status === 0 || status >= 500) return 'Não foi possível conectar. Confira a internet e tente de novo.'
  if (mode === 'criar') return 'Não foi possível criar a conta. Confira os dados e tente de novo.'
  if (mode === 'esqueci') return 'Não foi possível enviar o link. Confira o e-mail e tente de novo.'
  return 'E-mail ou senha incorretos.'
}

export function Login() {
  const [signupOpen, setSignupOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('entrar')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  useEffect(() => {
    fetch('/api/signup-status')
      .then((response) => response.json())
      .then((status: { open: boolean }) => setSignupOpen(status.open))
      .catch(() => setSignupOpen(false))
  }, [])

  const creating = mode === 'criar'
  const forgot = mode === 'esqueci'

  const switchTo = (next: Mode) => {
    setMode(next)
    setError(null)
    setLinkSent(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError(null)

    try {
      const result = forgot
        ? await authClient.requestPasswordReset({ email: email.trim(), redirectTo: '/redefinir' })
        : creating
          ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
          : await authClient.signIn.email({ email: email.trim(), password })
      if (result.error) setError(messageFor(result.error.status, mode))
      else if (forgot) setLinkSent(true)
    } catch {
      setError(messageFor(0, mode))
    }

    setSending(false)
  }

  return (
    <div className="relative grid min-h-dvh overflow-y-auto">
      <Tide level={LOGIN_TIDE} />
      <SunGlow level={LOGIN_TIDE} />

      <main className="relative z-10 mx-auto flex w-full max-w-sm flex-col justify-center px-5 pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
        <h1 className="font-display text-[42px]/[1.05] font-semibold tracking-[-0.025em]">Rumo</h1>
        <p className="mt-2 text-[17px] text-mist">{SUBTITLE[mode]}</p>

        <form onSubmit={submit} className="mt-8 grid gap-4">
          {creating && (
            <label className="grid gap-1.5 text-[15px] text-mist">
              Nome
              <input
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                enterKeyHint="next"
                required
              />
            </label>
          )}

          <label className="grid gap-1.5 text-[15px] text-mist">
            E-mail
            <input
              className="field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="next"
              required
            />
          </label>

          {!forgot && (
            <label className="grid gap-1.5 text-[15px] text-mist">
              Senha
              <input
                className="field"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={creating ? 'new-password' : 'current-password'}
                minLength={creating ? MIN_PASSWORD : undefined}
                enterKeyHint="go"
                required
              />
            </label>
          )}

          {linkSent && (
            <p role="status" className="text-[15px]">
              Se houver uma conta com esse e-mail, o link chega em alguns minutos. Confira também o spam.
            </p>
          )}

          {error && (
            <p role="alert" className="text-[15px] text-foam">
              {error}
            </p>
          )}

          {creating && (
            <p className="text-[15px] text-mist">
              Ao criar a conta, você aceita os{' '}
              <a href="/termos" className="underline underline-offset-4">
                Termos
              </a>{' '}
              e a{' '}
              <a href="/privacidade" className="underline underline-offset-4">
                Privacidade
              </a>
              .
            </p>
          )}

          <button type="submit" className="action mt-2 min-h-12" disabled={sending}>
            {sending ? 'Aguarde…' : forgot ? 'Enviar link' : creating ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 grid">
          {mode === 'entrar' && (
            <button type="button" className={LINK} onClick={() => switchTo('esqueci')}>
              Esqueci a senha
            </button>
          )}
          {forgot ? (
            <button type="button" className={LINK} onClick={() => switchTo('entrar')}>
              Voltar para entrar
            </button>
          ) : (
            signupOpen && (
              <button type="button" className={LINK} onClick={() => switchTo(creating ? 'entrar' : 'criar')}>
                {creating ? 'Já tenho conta' : 'Criar conta'}
              </button>
            )
          )}
        </div>
      </main>
    </div>
  )
}
