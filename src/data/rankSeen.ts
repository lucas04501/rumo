const SEEN_KEY = 'rumo:patente-vista'

/**
 * Maior patente já vista neste aparelho. O XP continua calculado dos dados: isto
 * só impede que o aviso se repita ao reabrir o app ou ao desmarcar e remarcar.
 */
export function readRankSeen(): number | null {
  try {
    const stored = localStorage.getItem(SEEN_KEY)
    return stored === null ? null : Number(stored)
  } catch {
    return null
  }
}

export function writeRankSeen(level: number) {
  try {
    localStorage.setItem(SEEN_KEY, String(level))
  } catch {
    // Sem armazenamento, o aviso volta a valer na próxima abertura.
  }
}

export function forgetRankSeen() {
  try {
    localStorage.removeItem(SEEN_KEY)
  } catch {
    // Nada salvo, nada a esquecer.
  }
}
