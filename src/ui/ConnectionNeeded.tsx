import { store } from '../data/store'

/** Só aparece no primeiro acesso de um aparelho sem internet: depois disso há cópia local. */
export function ConnectionNeeded() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-sm">
        <h1 className="font-display text-3xl font-semibold">Sem conexão</h1>
        <p className="mt-2 text-[17px] text-mist">
          Conecte o aparelho à internet uma vez para trazer seus dados.
        </p>
        <button
          type="button"
          className="action mt-5"
          onClick={() => store.refetchQueries({ queryKey: ['snapshot'] })}
        >
          Tentar de novo
        </button>
      </div>
    </div>
  )
}
