const SAMPLES = 120

/** Onda periódica: o fim encaixa no começo, então a deriva infinita não tem emenda. */
export function wavePath(tileWidth: number, height: number, phase: number) {
  const middle = height * 0.5
  const amplitude = height * 0.42
  const points: string[] = []

  for (let i = 0; i <= SAMPLES * 2; i += 1) {
    const u = (i / SAMPLES) * Math.PI * 2
    const y =
      0.62 * Math.sin(2 * u + phase) +
      0.28 * Math.sin(3 * u + phase * 2.1) +
      0.1 * Math.sin(5 * u + phase * 0.7)
    points.push(`${((i / SAMPLES) * tileWidth).toFixed(1)} ${(middle + amplitude * y).toFixed(1)}`)
  }

  const crest = `M${points.join('L')}`
  return { crest, body: `${crest}L${tileWidth * 2} ${height}L0 ${height}Z` }
}

export type RoutePoint = { x: number; y: number; angle: number }

export type RouteShape = {
  d: string
  total: number
  /** Ponto na rota, com `t` de 0 (partida) a 1 (chegada), medido pelo comprimento do caminho. */
  pointAt: (t: number) => RoutePoint
}

export function buildRoute(width: number, height: number, margin = 12): RouteShape {
  const middle = height * 0.6
  const amplitude = height * 0.2
  const span = width - margin * 2

  const xs = Array.from({ length: SAMPLES + 1 }, (_, i) => margin + (i / SAMPLES) * span)
  const ys = xs.map((_, i) => middle + amplitude * Math.sin((i / SAMPLES) * Math.PI * 3 + 0.5))

  const lengths = [0]
  for (let i = 1; i <= SAMPLES; i += 1) {
    lengths.push(lengths[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]))
  }
  const total = lengths[SAMPLES]

  function pointAt(t: number): RoutePoint {
    const distance = Math.min(Math.max(t, 0), 1) * total
    let i = lengths.findIndex((length) => length >= distance)
    i = Math.max(i, 1)
    const stretch = lengths[i] - lengths[i - 1]
    const within = stretch === 0 ? 0 : (distance - lengths[i - 1]) / stretch
    const dx = xs[i] - xs[i - 1]
    const dy = ys[i] - ys[i - 1]
    return {
      x: xs[i - 1] + dx * within,
      y: ys[i - 1] + dy * within,
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    }
  }

  const d = `M${xs.map((x, i) => `${x.toFixed(1)} ${ys[i].toFixed(1)}`).join('L')}`
  return { d, total, pointAt }
}
