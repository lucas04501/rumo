import { hoje } from '../lib/dates'
import { ApiError, request } from './api'
import type { Snapshot } from './types'

/** Baixa tudo do usuário em JSON. Sem internet, sai a cópia que está no aparelho. */
export async function exportMyData(local: Snapshot, email: string) {
  const fresh = await request<Snapshot>('GET', '/snapshot').catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) throw error
    return local
  })
  const content = JSON.stringify({ exportadoEm: new Date().toISOString(), email, ...fresh }, null, 2)
  const file = new File([content], `rumo-${hoje()}.json`, { type: 'application/json' })

  // No iPhone instalado, baixar por link não funciona: a folha de compartilhar salva em Arquivos.
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] }).catch(() => {})
    return
  }

  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = file.name
  link.click()
  URL.revokeObjectURL(link.href)
}
