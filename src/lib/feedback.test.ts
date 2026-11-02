import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const MUTED_KEY = 'rumo:sons-desligados'

class FakeAudioContext {
  static created = 0
  state = 'running'
  currentTime = 0
  destination = {}

  constructor() {
    FakeAudioContext.created += 1
  }

  createOscillator() {
    return {
      frequency: { value: 0 },
      connect: (node: unknown) => node,
      start: () => {},
      stop: () => {},
    }
  }

  createGain() {
    return {
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: (node: unknown) => node,
    }
  }
}

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

const brokenStorage = {
  getItem: () => {
    throw new Error('armazenamento bloqueado')
  },
  setItem: () => {
    throw new Error('armazenamento bloqueado')
  },
}

async function loadFeedback(storage: unknown) {
  vi.stubGlobal('localStorage', storage)
  vi.resetModules()
  return import('./feedback')
}

beforeEach(() => {
  FakeAudioContext.created = 0
  vi.stubGlobal('AudioContext', FakeAudioContext)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('preferência de som', () => {
  it('começa com o som ligado', async () => {
    const feedback = await loadFeedback(memoryStorage())
    expect(feedback.isMuted()).toBe(false)
  })

  it('continua sem som depois de reabrir o app', async () => {
    const storage = memoryStorage()
    const first = await loadFeedback(storage)
    first.setMuted(true)

    const reopened = await loadFeedback(storage)
    expect(reopened.isMuted()).toBe(true)
  })

  it('avisa a interface quando a preferência muda', async () => {
    const feedback = await loadFeedback(memoryStorage())
    const listener = vi.fn()
    const unsubscribe = feedback.subscribeMuted(listener)

    feedback.setMuted(true)
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    feedback.setMuted(false)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('funciona mesmo com o armazenamento bloqueado, com o som ligado', async () => {
    const feedback = await loadFeedback(brokenStorage)
    expect(feedback.isMuted()).toBe(false)
    expect(() => feedback.setMuted(true)).not.toThrow()
    expect(feedback.isMuted()).toBe(true)
  })
})

describe('sons', () => {
  it('nenhum som toca enquanto estiver mudo', async () => {
    const feedback = await loadFeedback(memoryStorage({ [MUTED_KEY]: '1' }))

    feedback.soundCheck(0)
    feedback.soundUncheck()
    feedback.soundUnmute()
    feedback.soundWind()
    feedback.soundArrival()
    feedback.soundCelebration()

    expect(FakeAudioContext.created).toBe(0)
  })

  it('volta a tocar ao religar', async () => {
    const feedback = await loadFeedback(memoryStorage({ [MUTED_KEY]: '1' }))
    feedback.setMuted(false)
    feedback.soundCheck(0)
    expect(FakeAudioContext.created).toBe(1)
  })
})
