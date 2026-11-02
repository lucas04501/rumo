import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { MutationCache, MutationObserver, QueryClient, useQuery } from '@tanstack/react-query'
import { del, get, set } from 'idb-keyval'
import { complete } from '../lib/snapshot'
import { ApiError, request } from './api'
import { forgetFocusTimer } from './focusTimer'
import { forgetRankSeen } from './rankSeen'
import type { Snapshot } from './types'

const SNAPSHOT_KEY = ['snapshot']
const WRITE_KEY = ['escrita']
const STORAGE_KEY = 'rumo-dados'
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000
const MAX_RETRY_DELAY_MS = 30_000

export type Write = { method: 'PUT' | 'DELETE'; path: string; body?: unknown }

// 404 e 409 são recusas de regra: item excluído ou edição mais nova no servidor.
// Repetir não adianta. A próxima foto mostra o que valeu.
const isRefusal = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 409)

const isPermanent = (error: unknown) => error instanceof ApiError && error.status < 500

async function send({ method, path, body }: Write) {
  try {
    await request(method, path, body)
  } catch (error) {
    if (!isRefusal(error)) throw error
  }
}

async function fetchSnapshot(): Promise<Snapshot> {
  const fresh = await request<Snapshot>('GET', '/snapshot')
  // Com escritas na fila, a tela está à frente do servidor. A foto só entra depois.
  const current = store.getQueryData<Snapshot>(SNAPSHOT_KEY)
  return store.isMutating() > 0 && current ? current : fresh
}

export const store: QueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSettled: () => {
      // A escrita que acabou de terminar ainda conta como em andamento aqui.
      if (store.isMutating() <= 1) void store.invalidateQueries({ queryKey: SNAPSHOT_KEY })
    },
  }),
  defaultOptions: {
    // Sem validade: ao abrir ou voltar ao app, a foto é sempre conferida com o servidor.
    queries: { networkMode: 'offlineFirst', gcTime: Infinity, staleTime: 0, retry: 1 },
  },
})

// As opções da fila ficam aqui, e não em cada escrita, para valerem também nas
// escritas restauradas do aparelho depois de fechar o app.
store.setMutationDefaults(WRITE_KEY, {
  mutationFn: send,
  scope: { id: 'fila' },
  retry: (_count, error) => !isPermanent(error),
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS),
})

export const persistOptions = {
  persister: createAsyncStoragePersister({
    storage: { getItem: get, setItem: set, removeItem: del },
    key: STORAGE_KEY,
    throttleTime: 200,
  }),
  maxAge: ONE_YEAR_MS,
  dehydrateOptions: {
    // Sem internet a busca falha e a foto fica com status de erro, mas os dados
    // continuam valendo. Salvar só em caso de sucesso apagaria a cópia do aparelho.
    shouldDehydrateQuery: (query: { state: { data: unknown } }) => query.state.data !== undefined,
    shouldDehydrateMutation: (mutation: { state: { status: string } }) =>
      mutation.state.status === 'pending',
  },
}

/** Retoma a fila salva no aparelho, depois de restaurar a foto. */
export function resumeWrites() {
  const pending = store
    .getMutationCache()
    .getAll()
    .filter((mutation) => mutation.state.status === 'pending')
  for (const mutation of pending) void mutation.continue().catch(() => {})
}

export function useSnapshot() {
  return useQuery({ queryKey: SNAPSHOT_KEY, queryFn: fetchSnapshot, select: complete })
}

let localEdits = 0

/** Quantas mudanças saíram deste aparelho, para separá-las das que chegam na foto. */
export const localEditCount = () => localEdits

/** Muda a tela na hora e coloca as escritas na fila, que envia em ordem. */
export function commit(update: (snapshot: Snapshot) => Snapshot, writes: Write[]) {
  localEdits += 1
  void store.cancelQueries({ queryKey: SNAPSHOT_KEY })
  store.setQueryData<Snapshot>(SNAPSHOT_KEY, (current) => current && update(complete(current)))

  for (const write of writes) {
    const observer = new MutationObserver<void, Error, Write>(store, { mutationKey: WRITE_KEY })
    observer.mutate(write).catch(() => {})
  }
}

/** Ao sair da conta, nada deste usuário pode ficar no aparelho. */
export async function clearDevice() {
  store.clear()
  forgetRankSeen()
  forgetFocusTimer()
  await del(STORAGE_KEY).catch(() => {})
}
