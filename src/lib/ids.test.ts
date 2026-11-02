import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { newId } from './ids'

describe('newId', () => {
  it('gera um UUID que a API aceita', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(z.uuid().safeParse(newId()).success).toBe(true)
    }
  })

  it('não repete', () => {
    const ids = new Set(Array.from({ length: 1000 }, newId))
    expect(ids.size).toBe(1000)
  })
})
