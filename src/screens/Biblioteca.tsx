import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useSnapshot } from '../data/store'
import type { Exercise } from '../lib/workouts'
import { ExerciseList } from '../ui/ExerciseList'
import { Screen } from '../ui/Screen'
import { CustomExerciseSheet, ExerciseSheet } from '../ui/WorkoutSheets'

export function Biblioteca() {
  const { data: snapshot } = useSnapshot()
  const [opened, setOpened] = useState<Exercise | null>(null)
  const [creating, setCreating] = useState(false)

  if (!snapshot) return null

  return (
    <Screen>
      <div className="max-w-2xl">
        <Link
          to="/treinos"
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 text-[15px] text-mist"
        >
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
          Treinos
        </Link>
        <div className="mt-1 mb-4 flex items-center justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">Exercícios</h1>
          <button type="button" className="ghost" onClick={() => setCreating(true)}>
            Novo
          </button>
        </div>
        <ExerciseList custom={snapshot.customExercises} onPick={setOpened} />
      </div>

      {opened && (
        <ExerciseSheet exercise={opened} snapshot={snapshot} onClosed={() => setOpened(null)} />
      )}
      {creating && <CustomExerciseSheet exercise={null} onClosed={() => setCreating(false)} />}
    </Screen>
  )
}
