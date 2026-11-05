import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_AVATAR, parseAvatar, rawAvatar, subscribeAvatar, writeAvatar } from './avatar'

afterEach(() => vi.unstubAllGlobals())

const memoryStorage = () => {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

describe('parseAvatar', () => {
  it('sem nada salvo, usa o padrão', () => {
    expect(parseAvatar(null)).toEqual(DEFAULT_AVATAR)
  })

  it('lê o que foi salvo', () => {
    expect(parseAvatar('{"color":"agua","icon":"ancora"}')).toEqual({ color: 'agua', icon: 'ancora' })
  })

  it('valor inválido, de versão futura ou quebrado volta ao padrão, campo a campo', () => {
    expect(parseAvatar('{"color":"rosa","icon":"ancora"}')).toEqual({ color: 'mar', icon: 'ancora' })
    expect(parseAvatar('{"color":"agua"}')).toEqual({ color: 'agua', icon: 'iniciais' })
    expect(parseAvatar('nao e json')).toEqual(DEFAULT_AVATAR)
    expect(parseAvatar('42')).toEqual(DEFAULT_AVATAR)
  })
})

describe('writeAvatar', () => {
  it('guarda por pessoa e avisa quem está ouvindo', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    const listener = vi.fn()
    const stop = subscribeAvatar(listener)

    writeAvatar('ana', { color: 'mare', icon: 'sol' })
    expect(parseAvatar(rawAvatar('ana'))).toEqual({ color: 'mare', icon: 'sol' })
    expect(rawAvatar('bia')).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)

    stop()
    writeAvatar('ana', DEFAULT_AVATAR)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('sem armazenamento, a escolha vale até fechar o app', () => {
    const blocked = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    vi.stubGlobal('localStorage', blocked)

    writeAvatar('caio', { color: 'espuma', icon: 'ondas' })
    expect(parseAvatar(rawAvatar('caio'))).toEqual({ color: 'espuma', icon: 'ondas' })
  })
})
