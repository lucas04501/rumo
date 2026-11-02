import { describe, expect, it } from 'vitest'
import { FRASES } from './frases'

// Acima disso, a frase passa de duas linhas em 320 px e empurra a tela.
const MAX_LENGTH = 56

describe('FRASES', () => {
  it('tem cerca de 100 frases, sem repetir', () => {
    expect(FRASES.length).toBeGreaterThanOrEqual(95)
    expect(new Set(FRASES).size).toBe(FRASES.length)
  })

  it('cabe no espaço reservado na tela Hoje', () => {
    expect(FRASES.filter((frase) => frase.length > MAX_LENGTH)).toEqual([])
  })
})
