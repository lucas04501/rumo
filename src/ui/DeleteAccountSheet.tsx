import { useState, type FormEvent } from 'react'
import { authClient } from '../data/authClient'
import { clearDevice } from '../data/store'
import { Sheet } from './Sheet'

function messageFor(status: number): string {
  if (status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
  if (status === 0 || status >= 500) return 'Não foi possível conectar. Confira a internet e tente de novo.'
  return 'Senha incorreta.'
}

/** A senha confirma que é a própria pessoa, e dá tempo de pensar: aqui não existe Desfazer. */
export function DeleteAccountSheet({ onClosed }: { onClosed: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError(null)

    try {
      const result = await authClient.deleteUser({ password })
      if (result.error) {
        setError(messageFor(result.error.status))
        setSending(false)
        return
      }
    } catch {
      setError(messageFor(0))
      setSending(false)
      return
    }

    await clearDevice()
    window.location.replace('/')
  }

  return (
    <Sheet title="Excluir conta" onClosed={onClosed}>
      {() => (
        <form onSubmit={submit} className="mt-3 grid gap-4">
          <p className="text-[17px]/snug">
            Isso apaga sua conta e tudo o que está nela: metas, hábitos, tarefas, treinos e notas. Não
            dá para desfazer.
          </p>
          <p className="text-[15px] text-mist">Se quiser guardar uma cópia, exporte antes de continuar.</p>
          <label className="grid gap-1.5 text-[15px] text-mist">
            Sua senha
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              enterKeyHint="done"
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-[15px]">
              {error}
            </p>
          )}
          <button type="submit" className="ghost min-h-12" disabled={sending || !password}>
            {sending ? 'Excluindo…' : 'Excluir minha conta'}
          </button>
        </form>
      )}
    </Sheet>
  )
}
