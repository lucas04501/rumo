import { describe, expect, it } from 'vitest'
import { buildRoute, wavePath } from './geometry'

describe('buildRoute', () => {
  const route = buildRoute(340, 60)

  it('começa e termina nas margens', () => {
    expect(route.pointAt(0).x).toBeCloseTo(12)
    expect(route.pointAt(1).x).toBeCloseTo(328)
  })

  it('não passa dos limites com t fora de 0 a 1', () => {
    expect(route.pointAt(-1)).toEqual(route.pointAt(0))
    expect(route.pointAt(2)).toEqual(route.pointAt(1))
  })

  it('anda para a frente sem recuar', () => {
    for (let t = 0.01; t <= 1; t += 0.01) {
      expect(route.pointAt(t).x).toBeGreaterThan(route.pointAt(t - 0.01).x)
    }
  })

  it('distribui as estações por comprimento de caminho', () => {
    const a = route.pointAt(0.25)
    const b = route.pointAt(0.5)
    const c = route.pointAt(0.75)
    const ab = Math.hypot(b.x - a.x, b.y - a.y)
    const bc = Math.hypot(c.x - b.x, c.y - b.y)
    expect(Math.abs(ab - bc) / ab).toBeLessThan(0.15)
  })
})

describe('wavePath', () => {
  it('termina na mesma altura em que começa, para a deriva não ter emenda', () => {
    const { crest } = wavePath(1000, 44, 1.3)
    const heightOf = (point: string) => Number(point.trim().split(' ')[1])
    const points = crest.slice(1).split('L')
    expect(heightOf(points.at(-1)!)).toBeCloseTo(heightOf(points[0]), 1)
  })
})
