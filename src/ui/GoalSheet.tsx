import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { deleteGoal, saveGoalPlan } from '../data/goalActions'
import type { Goal, Milestone } from '../data/types'
import { newId } from '../lib/ids'
import { Sheet } from './Sheet'

type GoalSheetProps = {
  goal: Goal | null
  milestones: Milestone[]
  position: number
  today: string
  onClosed: () => void
}

type Draft = { id: string; title: string }

const emptyDraft = (): Draft => ({ id: newId(), title: '' })

export function GoalSheet({ goal, milestones, position, today, onClosed }: GoalSheetProps) {
  const done = milestones.filter((milestone) => milestone.doneAt)
  const pending = milestones.filter((milestone) => !milestone.doneAt)

  const [title, setTitle] = useState(goal?.title ?? '')
  const [why, setWhy] = useState(goal?.why ?? '')
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '')
  const [drafts, setDrafts] = useState<Draft[]>(
    pending.length > 0 || goal
      ? pending.map(({ id, title: name }) => ({ id, title: name }))
      : [emptyDraft()],
  )

  const filled = drafts.filter((draft) => draft.title.trim())
  const canSave = title.trim().length > 0 && done.length + filled.length > 0

  const rename = (id: string, name: string) =>
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, title: name } : draft)),
    )

  const move = (index: number, step: number) =>
    setDrafts((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(index + step, 0, item)
      return next
    })

  return (
    <Sheet title={goal ? 'Editar meta' : 'Nova meta'} onClosed={onClosed}>
      {(close) => {
        const submit = (event: FormEvent) => {
          event.preventDefault()
          if (!canSave) return

          const saved: Goal = {
            ...(goal ?? {
              id: newId(),
              status: 'active' as const,
              doneAt: null,
              position,
            }),
            title: title.trim(),
            why: why.trim() || null,
            targetDate: targetDate || null,
          }

          const after: Milestone[] = [
            ...done,
            ...filled.map((draft, index) => ({
              id: draft.id,
              goalId: saved.id,
              title: draft.title.trim(),
              position: done.length + index,
              doneAt: null,
            })),
          ]

          saveGoalPlan(saved, milestones, after)
          close()
        }

        return (
          <>
            <form onSubmit={submit} className="mt-4 grid gap-5">
              <label className="grid gap-1.5 text-[15px] text-mist">
                Destino
                <input
                  className="field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Correr 10 km"
                  maxLength={120}
                  autoComplete="off"
                  required
                />
              </label>

              <label className="grid gap-1.5 text-[15px] text-mist">
                Prazo
                <input
                  className="field"
                  type="date"
                  value={targetDate}
                  min={goal ? undefined : today}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>

              <label className="grid gap-1.5 text-[15px] text-mist">
                Por que isso importa
                <textarea
                  className="field py-3"
                  rows={2}
                  value={why}
                  onChange={(event) => setWhy(event.target.value)}
                  maxLength={500}
                />
              </label>

              <fieldset>
                <legend className="text-[15px] text-mist">Marcos até o destino</legend>

                {done.length > 0 && (
                  <ul className="mt-1.5 grid gap-1">
                    {done.map((milestone) => (
                      <li key={milestone.id} className="text-[15px] text-foam/60">
                        {milestone.title} (concluído)
                      </li>
                    ))}
                  </ul>
                )}

                <ol className="mt-1.5 grid gap-2">
                  {drafts.map((draft, index) => (
                    <li key={draft.id} className="flex items-center gap-1">
                      <input
                        className="field min-w-0 flex-1"
                        value={draft.title}
                        onChange={(event) => rename(draft.id, event.target.value)}
                        placeholder={`Marco ${done.length + index + 1}`}
                        aria-label={`Marco ${done.length + index + 1}`}
                        maxLength={120}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="icon-button order-handle"
                        aria-label="Subir marco"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ChevronUp size={20} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-button order-handle"
                        aria-label="Descer marco"
                        disabled={index === drafts.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ChevronDown size={20} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-button order-handle"
                        aria-label="Remover marco"
                        onClick={() =>
                          setDrafts((current) => current.filter((item) => item.id !== draft.id))
                        }
                      >
                        <X size={20} strokeWidth={1.75} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ol>

                <button
                  type="button"
                  className="ghost mt-2 flex w-full items-center justify-center gap-1.5"
                  onClick={() => setDrafts((current) => [...current, emptyDraft()])}
                >
                  <Plus size={18} strokeWidth={1.75} aria-hidden />
                  Adicionar marco
                </button>
                <p className="mt-1.5 text-sm text-mist">
                  O último marco é a chegada. Concluí-lo conclui a meta.
                </p>
              </fieldset>

              <button type="submit" className="action min-h-12" disabled={!canSave}>
                {goal ? 'Salvar' : 'Traçar rota'}
              </button>
            </form>

            {goal && <RemoveGoal id={goal.id} />}
          </>
        )
      }}
    </Sheet>
  )
}

function RemoveGoal({ id }: { id: string }) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="mt-6 border-t border-white/8 pt-3">
      {confirming ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px]">Excluir esta meta? Hábitos e tarefas continuam.</p>
          <button
            type="button"
            className="ghost shrink-0"
            onClick={() => {
              deleteGoal(id)
              navigate('/metas')
            }}
          >
            Excluir
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 text-[15px] text-mist underline underline-offset-4"
          onClick={() => setConfirming(true)}
        >
          Excluir meta
        </button>
      )}
    </div>
  )
}
