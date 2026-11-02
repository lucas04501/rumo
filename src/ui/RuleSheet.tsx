import { useState, type FormEvent } from 'react'
import { createRule, stopRule, updateRule } from '../data/taskActions'
import type { Priority, TaskRule } from '../data/types'
import { newId } from '../lib/ids'
import { sameSchedule, type Schedule } from '../lib/tasks'
import { EVERY_DAY, isValidSchedule, PriorityPicker, SchedulePicker } from './SchedulePicker'
import { Sheet } from './Sheet'

type RuleSheetProps = {
  rule: TaskRule | null
  position: number
  today: string
  onClosed: () => void
}

export function RuleSheet({ rule, position, today, onClosed }: RuleSheetProps) {
  const [title, setTitle] = useState(rule?.title ?? '')
  const [priority, setPriority] = useState<Priority>(rule?.priority ?? 'normal')
  const [schedule, setSchedule] = useState<Schedule>({
    weekdays: rule?.weekdays ?? EVERY_DAY,
    monthDay: rule?.monthDay ?? null,
  })

  const canSave = title.trim().length > 0 && isValidSchedule(schedule)
  const changesDays = rule && !sameSchedule(rule, schedule) && rule.startDate <= today

  return (
    <Sheet title={rule ? 'Editar repetição' : 'Nova tarefa que repete'} onClosed={onClosed}>
      {(close) => {
        const submit = (event: FormEvent) => {
          event.preventDefault()
          if (!canSave) return

          const fields = { title: title.trim(), priority, ...schedule }
          if (rule) updateRule(rule, { ...rule, ...fields }, today)
          else {
            createRule({
              id: newId(),
              startDate: today,
              endDate: null,
              goalId: null,
              position,
              ...fields,
            })
          }
          close()
        }

        return (
          <>
            <form onSubmit={submit} className="mt-4 grid gap-5">
              <label className="grid gap-1.5 text-[15px] text-mist">
                Nome
                <input
                  className="field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Pagar o aluguel"
                  maxLength={300}
                  enterKeyHint="done"
                  autoComplete="off"
                  required
                />
              </label>

              <div className="grid gap-1.5 text-[15px] text-mist">
                Prioridade
                <PriorityPicker value={priority} onChange={setPriority} />
              </div>

              <div className="grid gap-1.5 text-[15px] text-mist">
                Quando repete
                <SchedulePicker
                  value={schedule}
                  fallbackDay={Number(today.slice(8))}
                  onChange={setSchedule}
                />
                {changesDays && <p>Os novos dias valem a partir de amanhã.</p>}
              </div>

              <button type="submit" className="action min-h-12" disabled={!canSave}>
                {rule ? 'Salvar' : 'Criar'}
              </button>
            </form>

            {rule && <StopRule rule={rule} today={today} onStopped={close} />}
          </>
        )
      }}
    </Sheet>
  )
}

type StopRuleProps = { rule: TaskRule; today: string; onStopped: () => void }

function StopRule({ rule, today, onStopped }: StopRuleProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="mt-6 border-t border-white/8 pt-3">
      {confirming ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px]">Parar de repetir? O que já passou continua como foi.</p>
          <button
            type="button"
            className="ghost shrink-0"
            onClick={() => {
              stopRule(rule, today)
              onStopped()
            }}
          >
            Parar
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 text-[15px] text-mist underline underline-offset-4"
          onClick={() => setConfirming(true)}
        >
          Parar de repetir
        </button>
      )}
    </div>
  )
}
