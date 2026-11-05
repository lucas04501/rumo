import {
  CalendarClock,
  Compass,
  Dumbbell,
  ListChecks,
  NotebookPen,
  Repeat,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useDay } from '../data/DayProvider'
import { closeLayer } from '../data/layers'
import { refuseHabits, refusePro, usePlanView } from '../data/planGate'
import { useSnapshot } from '../data/store'
import { weekdayOf } from '../lib/dates'
import { newId } from '../lib/ids'
import { nameOfDay, stepCount, stepsOn, suggestTime } from '../lib/routine'
import { GoalSheet } from './GoalSheet'
import { HabitSheet } from './HabitSheet'
import { NoteSheet } from './NoteSheet'
import { QuickChips, useQuickAdd } from './QuickAdd'
import { StepSheet } from './RoutineSheets'
import { RuleSheet } from './RuleSheet'
import { Sheet } from './Sheet'
import { ProMark } from './ProGate'
import { PlanSheet } from './WorkoutSheets'

type Kind = 'habit' | 'goal' | 'note' | 'rule' | 'step' | 'plan'

const KINDS: { kind: Kind; label: string; icon: LucideIcon; pro?: boolean }[] = [
  { kind: 'habit', label: 'Hábito', icon: ListChecks },
  { kind: 'goal', label: 'Meta', icon: Compass },
  { kind: 'note', label: 'Nota', icon: NotebookPen, pro: true },
  { kind: 'rule', label: 'Repetição', icon: Repeat, pro: true },
  { kind: 'step', label: 'Passo da rotina', icon: CalendarClock, pro: true },
  { kind: 'plan', label: 'Ficha de treino', icon: Dumbbell, pro: true },
]

function leave(notice: () => void) {
  closeLayer()
  notice()
}

/** Ponto único de criar. O campo é a adição rápida; o resto abre a folha certa com o texto já escrito. */
export function Creator({ draft = '' }: { draft?: string }) {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const [form, setForm] = useState<{ kind: Kind; title: string } | null>(null)
  const { habitRoom, pro } = usePlanView()

  if (!snapshot) return null
  if (!form) {
    // Fora do plano, avisa já na escolha: ninguém preenche uma folha que não vai ser aceita.
    const pick = (kind: Kind, title: string) => {
      if (kind === 'habit' && !habitRoom) return leave(refuseHabits)
      if (!pro && KINDS.find((item) => item.kind === kind)?.pro) return leave(refusePro)
      setForm({ kind, title })
    }
    return <QuickSheet draft={draft} onPick={pick} />
  }

  const { kind, title } = form
  const shared = { today: date, onClosed: closeLayer }

  if (kind === 'habit') {
    return (
      <HabitSheet habit={null} initialTitle={title} position={snapshot.habits.length} {...shared} />
    )
  }
  if (kind === 'goal') {
    return (
      <GoalSheet
        goal={null}
        milestones={[]}
        initialTitle={title}
        position={snapshot.goals.length}
        {...shared}
      />
    )
  }
  if (kind === 'rule') {
    return (
      <RuleSheet rule={null} initialTitle={title} position={snapshot.taskRules.length} {...shared} />
    )
  }
  if (kind === 'plan') {
    return <PlanSheet plan={null} initialTitle={title} snapshot={snapshot} onClosed={closeLayer} />
  }
  if (kind === 'note') {
    return (
      <NoteSheet note={null} initialTitle={title} goals={snapshot.goals} onClosed={closeLayer} />
    )
  }

  const weekday = weekdayOf(date)
  const step = {
    id: newId(),
    weekday,
    time: suggestTime(stepsOn(snapshot.routineSteps, weekday)),
    title,
    position: stepCount(snapshot.routineSteps, weekday),
  }
  return (
    <StepSheet
      step={step}
      snapshot={snapshot}
      sheetTitle={`Passo de ${nameOfDay(weekday).toLowerCase()}`}
      isNew
      onClosed={closeLayer}
    />
  )
}

type QuickSheetProps = { draft: string; onPick: (kind: Kind, title: string) => void }

function QuickSheet({ draft, onPick }: QuickSheetProps) {
  const { title, setTitle, labels, ignore, save } = useQuickAdd(draft)
  const { pro } = usePlanView()
  const field = useRef<HTMLInputElement>(null)
  // O aviso de Desfazer entra na folha do topo: salvar espera esta folha fechar.
  const afterClose = useRef<(() => void) | null>(null)

  // Roda depois de a folha abrir, que move o foco para o botão de fechar.
  useEffect(() => field.current?.focus(), [])

  return (
    <Sheet
      title="Criar"
      onClosed={() => {
        const next = afterClose.current
        if (next) next()
        else closeLayer()
      }}
    >
      {(close) => {
        const leave = (action: () => void) => {
          afterClose.current = action
          close()
        }

        const submit = (event: FormEvent) => {
          event.preventDefault()
          if (!title.trim()) return
          leave(() => {
            save()
            closeLayer()
          })
        }

        return (
          <>
            {!pro && (
              <p className="mt-3 text-[15px] text-mist">
                No plano grátis, você cria hábitos (até 3 ativos) e metas. Tarefas e o que tem a marca Pro são do plano Pro.
              </p>
            )}
            {pro && <form onSubmit={submit} className="mt-3 grid gap-2">
              <label className="grid gap-1.5 text-[15px] text-mist">
                Tarefa
                <input
                  ref={field}
                  className="field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="pagar luz sexta !alta"
                  maxLength={300}
                  enterKeyHint="done"
                  autoComplete="off"
                />
              </label>
              {labels.length > 0 && <QuickChips labels={labels} onIgnore={ignore} />}
              <button type="submit" className="action min-h-12" disabled={!title.trim()}>
                Criar tarefa
              </button>
            </form>}

            <h3 className="mt-6 text-[15px] text-mist">{pro ? 'Ou criar outra coisa' : 'Criar'}</h3>
            <ul className="mt-1 divide-y divide-line">
              {KINDS.map(({ kind, label, icon: Icon, pro: proKind }) => (
                <li key={kind}>
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center gap-3 text-left text-[17px]"
                    onClick={() => leave(() => onPick(kind, title.trim()))}
                  >
                    <Icon size={20} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
                    {label}
                    {proKind && !pro && <ProMark />}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )
      }}
    </Sheet>
  )
}
