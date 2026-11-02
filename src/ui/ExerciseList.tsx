import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MUSCLES } from '../content/exercicios'
import type { CustomExercise } from '../data/types'
import { allExercises, findExercises, type Exercise } from '../lib/workouts'

type ExerciseListProps = { custom: CustomExercise[]; onPick: (exercise: Exercise) => void }

/** Busca e grupos musculares. A biblioteca e a escolha de exercício da ficha usam a mesma lista. */
export function ExerciseList({ custom, onPick }: ExerciseListProps) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)
  const exercises = useMemo(
    () => findExercises(allExercises(custom), query, muscle),
    [custom, query, muscle],
  )

  return (
    <>
      <label className="relative block">
        <Search
          size={19}
          strokeWidth={1.75}
          className="absolute top-[17px] left-3.5 text-mist"
          aria-hidden
        />
        <input
          type="search"
          className="field field-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar exercício"
          aria-label="Buscar exercício"
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Grupo muscular">
        {MUSCLES.map((name) => (
          <button
            key={name}
            type="button"
            className="muscle-chip"
            aria-pressed={muscle === name}
            onClick={() => setMuscle(muscle === name ? null : name)}
          >
            {name}
          </button>
        ))}
      </div>

      {exercises.length > 0 ? (
        <ul className="mt-2 divide-y divide-line">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                className="flex min-h-13 w-full items-center justify-between gap-3 py-2 text-left"
                onClick={() => onPick(exercise)}
              >
                <span className="min-w-0 text-[17px] font-[450] wrap-anywhere">{exercise.name}</span>
                <span className="shrink-0 text-[15px] text-mist">{exercise.muscle}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[15px] text-mist">Nenhum exercício com essa busca.</p>
      )}
    </>
  )
}
