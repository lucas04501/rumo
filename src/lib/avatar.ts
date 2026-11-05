// A escolha de cor e ícone fica só neste aparelho, como a do som: nenhuma imagem é guardada e
// nada vai para o banco. Uma chave por pessoa, para outra conta no mesmo aparelho não herdar.

export const AVATAR_COLORS = [
  { id: 'mar', label: 'Mar', className: 'bg-sea-3 text-foam' },
  { id: 'espuma', label: 'Espuma', className: 'bg-foam text-abyss' },
  { id: 'agua', label: 'Água', className: 'bg-wash text-foam' },
  { id: 'nevoa', label: 'Névoa', className: 'bg-mist text-abyss' },
  { id: 'mare', label: 'Maré', className: 'bg-tide text-tide-ink' },
] as const

/** `iniciais` não tem ícone: mostra as letras do nome. */
export const AVATAR_ICONS = ['iniciais', 'ancora', 'bussola', 'veleiro', 'ondas', 'sol', 'haltere'] as const

export type Avatar = {
  color: (typeof AVATAR_COLORS)[number]['id']
  icon: (typeof AVATAR_ICONS)[number]
}

export const DEFAULT_AVATAR: Avatar = { color: 'mar', icon: 'iniciais' }

const keyOf = (userId: string) => `rumo:avatar:${userId}`

const listeners = new Set<() => void>()
// Sem armazenamento (aba privada, por exemplo), a escolha fica aqui até fechar o app.
const memory = new Map<string, string>()

export function subscribeAvatar(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** O texto salvo, ou nulo. É o que `useSyncExternalStore` compara: texto igual não redesenha. */
export function rawAvatar(userId: string): string | null {
  try {
    return localStorage.getItem(keyOf(userId)) ?? memory.get(keyOf(userId)) ?? null
  } catch {
    return memory.get(keyOf(userId)) ?? null
  }
}

/** Valor salvo à mão ou de uma versão futura nunca quebra a tela: o que não vale volta ao padrão. */
export function parseAvatar(raw: string | null): Avatar {
  try {
    const value: unknown = raw === null ? null : JSON.parse(raw)
    const { color, icon } = (value ?? {}) as Partial<Record<keyof Avatar, unknown>>
    return {
      color: AVATAR_COLORS.find(({ id }) => id === color)?.id ?? DEFAULT_AVATAR.color,
      icon: AVATAR_ICONS.find((id) => id === icon) ?? DEFAULT_AVATAR.icon,
    }
  } catch {
    return DEFAULT_AVATAR
  }
}

export function writeAvatar(userId: string, avatar: Avatar) {
  memory.set(keyOf(userId), JSON.stringify(avatar))
  try {
    localStorage.setItem(keyOf(userId), JSON.stringify(avatar))
  } catch {
    // Fica só na memória.
  }
  listeners.forEach((listener) => listener())
}
