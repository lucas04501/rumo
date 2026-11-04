import { Minus, Plus, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useDay } from '../data/DayProvider'
import { saveHabit } from '../data/habitActions'
import { useSnapshot } from '../data/store'
import type { Snapshot, WaterSettings } from '../data/types'
import { saveWaterSettings } from '../data/waterActions'
import { addDays } from '../lib/dates'
import { buckets, periodDates } from '../lib/evolution'
import { newId } from '../lib/ids'
import {
  adjustGoal,
  BOTTLE_ML,
  CUP_SIZES,
  cupsLeft,
  formatWater,
  logsOn,
  ML_PER_KG,
  suggestedGoal,
  totalOn,
  waterSettingsOf,
} from '../lib/water'
import { Bars } from '../ui/EvolutionCharts'
import { Screen } from '../ui/Screen'
import { Tide } from '../voyage/Tide'

const HEADING = 'font-display text-xl font-semibold'
const DEFAULT_GOAL_ML = 2_000
const DEFAULT_CUP_ML = 250
const MAX_EXTRA_ML = 3_000

export function Agua() {
  const { data: snapshot } = useSnapshot()
  const [editing, setEditing] = useState(false)
  if (!snapshot) return null

  const settings = waterSettingsOf(snapshot)

  return (
    <Screen>
      {!settings || editing ? (
        <Setup snapshot={snapshot} current={settings} onDone={() => setEditing(false)} />
      ) : (
        <Today snapshot={snapshot} settings={settings} onEdit={() => setEditing(true)} />
      )}
    </Screen>
  )
}

const formatTime = (moment: string) =>
  new Date(moment).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function Today({
  snapshot,
  settings,
  onEdit,
}: {
  snapshot: Snapshot
  settings: WaterSettings
  onEdit: () => void
}) {
  const { date, drinkWater, removeWater } = useDay()
  const [other, setOther] = useState('')
  const logs = logsOn(snapshot, date)
  const total = totalOn(logs, date)
  const left = cupsLeft(total, settings.goalMl, settings.cupMl)
  const level = Math.min(total / settings.goalMl, 1)

  const week = useMemo(
    () =>
      buckets(
        periodDates(addDays(date, 1), 7),
        (day) => totalOn(snapshot.waterLogs, day),
        formatWater,
      ),
    [snapshot.waterLogs, date],
  )

  const addOther = (event: FormEvent) => {
    event.preventDefault()
    const amount = Math.round(Number(other.replace(',', '.')))
    if (!amount || amount < 1 || amount > MAX_EXTRA_ML) return
    drinkWater(amount)
    setOther('')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="pt-3 font-display text-4xl font-semibold tracking-[-0.02em] lg:pt-8">Água</h1>
      <p className="mt-1 text-[17px] text-mist">
        {left === 0
          ? 'Meta do dia batida. O que vier agora é extra.'
          : `Faltam ${left} ${left === 1 ? 'copo' : 'copos'} de ${formatWater(settings.cupMl)}.`}
      </p>

      <p className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-[44px]/none font-semibold tracking-[-0.02em]">
          {formatWater(total)}
        </span>
        <span className="text-[17px] text-mist">de {formatWater(settings.goalMl)}</span>
      </p>

      {/* O medidor é água de verdade, como no foco, e nenhum texto fica por cima dele. */}
      <div
        className="water-glass mt-3"
        role="progressbar"
        aria-label="Água de hoje"
        aria-valuemin={0}
        aria-valuemax={settings.goalMl}
        aria-valuenow={total}
        aria-valuetext={`${formatWater(total)} de ${formatWater(settings.goalMl)}`}
      >
        <Tide level={level} crest={28} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="action flex min-h-14 items-center justify-center gap-1.5"
          onClick={() => drinkWater(settings.cupMl)}
        >
          <Plus size={18} strokeWidth={2} aria-hidden />
          Copo, {formatWater(settings.cupMl)}
        </button>
        <button
          type="button"
          className="ghost flex min-h-14 items-center justify-center gap-1.5"
          onClick={() => drinkWater(settings.cupMl === BOTTLE_ML ? BOTTLE_ML * 2 : BOTTLE_ML)}
        >
          <Plus size={18} strokeWidth={2} aria-hidden />
          {settings.cupMl === BOTTLE_ML ? 'Garrafa, 1 L' : `Garrafa, ${formatWater(BOTTLE_ML)}`}
        </button>
      </div>

      <form onSubmit={addOther} className="mt-3 flex gap-3">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Outra quantidade, em ml</span>
          <input
            className="field w-full"
            inputMode="numeric"
            placeholder="Outra quantidade, em ml"
            value={other}
            onChange={(event) => setOther(event.target.value.replace(/[^\d]/g, ''))}
            enterKeyHint="done"
          />
        </label>
        <button type="submit" className="ghost min-h-12 shrink-0" disabled={!other}>
          Somar
        </button>
      </form>

      <section aria-labelledby="agua-hoje" className="mt-7">
        <h2 id="agua-hoje" className={HEADING}>
          Hoje
        </h2>
        {logs.length > 0 ? (
          <ul className="mt-1 divide-y divide-line">
            {[...logs].reverse().map((log) => (
              <li key={log.id} className="flex min-h-13 items-center gap-3">
                <span className="w-14 shrink-0 text-[15px] text-mist">{formatTime(log.loggedAt)}</span>
                <span className="min-w-0 flex-1 text-[17px]">{formatWater(log.amountMl)}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Tirar ${formatWater(log.amountMl)} das ${formatTime(log.loggedAt)}`}
                  onClick={() => removeWater(log)}
                >
                  <X size={18} strokeWidth={1.75} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[17px] text-mist">Nenhum copo ainda. O primeiro é um toque.</p>
        )}
      </section>

      <section aria-labelledby="agua-semana" className="mt-7">
        <h2 id="agua-semana" className={HEADING}>
          Últimos 7 dias
        </h2>
        <div className="mt-1">
          <Bars items={week} label="Água por dia" color="tide" />
        </div>
      </section>

      <button
        type="button"
        className="mt-6 min-h-11 text-[15px] text-mist underline underline-offset-4"
        onClick={onEdit}
      >
        Ajustar meta e copo
      </button>
    </div>
  )
}

type Step = 'start' | 'weight' | 'goal' | 'cup' | 'habit'
const NEW_HABIT = 'novo'
const NO_HABIT = 'nenhum'

function Setup({
  snapshot,
  current,
  onDone,
}: {
  snapshot: Snapshot
  current: WaterSettings | null
  onDone: () => void
}) {
  const { date } = useDay()
  const habits = snapshot.habits.filter((habit) => !habit.archivedAt)
  const linked = habits.find((habit) => habit.id === current?.habitId)

  const [step, setStep] = useState<Step>(current ? 'goal' : 'start')
  const [weight, setWeight] = useState('')
  const [goalMl, setGoalMl] = useState(current?.goalMl ?? DEFAULT_GOAL_ML)
  const [cupMl, setCupMl] = useState(current?.cupMl ?? DEFAULT_CUP_ML)
  const [habitChoice, setHabitChoice] = useState(linked?.id ?? (current ? NO_HABIT : NEW_HABIT))

  const kg = Number(weight.replace(',', '.'))
  const validWeight = kg >= 20 && kg <= 300
  const position = { start: 1, weight: 1, goal: 1, cup: 2, habit: 3 }[step]
  const previous: Step | null = { start: null, weight: 'start', goal: current ? null : 'start', cup: 'goal', habit: 'cup' }[step] as Step | null

  const finish = () => {
    let habitId: string | null = habitChoice === NO_HABIT ? null : habitChoice
    if (habitChoice === NEW_HABIT) {
      habitId = newId()
      saveHabit({
        id: habitId,
        title: 'Beber água',
        icon: 'water',
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        startDate: date,
        goalId: null,
        archivedAt: null,
        position: snapshot.habits.length,
      })
    }
    saveWaterSettings({ id: current?.id ?? newId(), goalMl, cupMl, habitId })
    onDone()
  }

  return (
    <div className="max-w-xl">
      <p className="pt-3 text-[15px] text-mist lg:pt-8">Passo {position} de 3</p>
      <h1 className="mt-1 font-display text-4xl font-semibold tracking-[-0.02em]">Água</h1>

      {step === 'start' && (
        <>
          <p className="mt-2 max-w-[44ch] text-[17px] text-mist">
            Uma meta por dia, um toque por copo. Bater a meta marca o hábito na Hoje.
          </p>
          <h2 className={`${HEADING} mt-7`}>Você já sabe quanto quer beber por dia?</h2>
          <div className="mt-3 grid gap-3">
            <button type="button" className="action min-h-13" onClick={() => setStep('goal')}>
              Já sei a minha meta
            </button>
            <button type="button" className="ghost min-h-13" onClick={() => setStep('weight')}>
              Calcular pelo meu peso
            </button>
          </div>
        </>
      )}

      {step === 'weight' && (
        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault()
            if (!validWeight) return
            setGoalMl(suggestedGoal(kg))
            setStep('goal')
          }}
        >
          <label className="grid gap-1.5 text-[15px] text-mist">
            Seu peso, em kg
            <input
              className="field"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value.replace(/[^\d,.]/g, ''))}
              enterKeyHint="next"
              autoFocus
            />
          </label>
          <p className="mt-3 max-w-[48ch] text-[15px] text-mist">
            A conta usa {ML_PER_KG} ml por kg, uma referência geral, não uma orientação médica. Se
            você tem alguma condição de saúde, siga o que o seu médico indicar. O peso fica só nesta
            tela e não é salvo.
          </p>
          <button type="submit" className="action mt-5 min-h-12 w-full" disabled={!validWeight}>
            {validWeight ? `Calcular: ${formatWater(suggestedGoal(kg))}` : 'Calcular'}
          </button>
        </form>
      )}

      {step === 'goal' && (
        <div className="mt-6">
          <h2 className={HEADING}>Meta do dia</h2>
          <div className="mt-3 flex items-center justify-between gap-4">
            <button
              type="button"
              className="icon-button"
              aria-label="Diminuir 100 ml"
              onClick={() => setGoalMl((value) => adjustGoal(value, -1))}
            >
              <Minus size={20} strokeWidth={2} aria-hidden />
            </button>
            <p className="font-display text-[44px]/none font-semibold tracking-[-0.02em]" aria-live="polite">
              {formatWater(goalMl)}
            </p>
            <button
              type="button"
              className="icon-button"
              aria-label="Aumentar 100 ml"
              onClick={() => setGoalMl((value) => adjustGoal(value, 1))}
            >
              <Plus size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>
          <p className="mt-3 text-[15px] text-mist">Ajuste de 100 em 100 ml, quando quiser.</p>
          <button type="button" className="action mt-6 min-h-12 w-full" onClick={() => setStep('cup')}>
            Continuar
          </button>
          {current && (
            <button
              type="button"
              className="mt-3 min-h-11 w-full text-[15px] text-mist underline underline-offset-4"
              onClick={onDone}
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      {step === 'cup' && (
        <div className="mt-6">
          <h2 className={HEADING}>Qual é o seu copo de sempre?</h2>
          <div className="segmented segmented-wide mt-3" role="group" aria-label="Tamanho do copo">
            {CUP_SIZES.map((size) => (
              <button key={size} type="button" aria-pressed={cupMl === size} onClick={() => setCupMl(size)}>
                {size} ml
              </button>
            ))}
          </div>
          <p className="mt-3 text-[15px] text-mist">
            São {cupsLeft(0, goalMl, cupMl)} copos para chegar a {formatWater(goalMl)}. A garrafa e
            outras quantidades também ficam a um toque.
          </p>
          <button type="button" className="action mt-6 min-h-12 w-full" onClick={() => setStep('habit')}>
            Continuar
          </button>
        </div>
      )}

      {step === 'habit' && (
        <fieldset className="mt-6">
          <legend className={HEADING}>Ligar à Hoje</legend>
          <p className="mt-1 text-[15px] text-mist">
            Bater a meta marca este hábito, com o XP e a maré de sempre.
          </p>
          <ul className="mt-2 divide-y divide-line">
            {[
              { id: NEW_HABIT, title: 'Criar o hábito Beber água' },
              ...habits.map((habit) => ({ id: habit.id, title: habit.title })),
              { id: NO_HABIT, title: 'Não ligar a um hábito' },
            ].map((option) => (
              <li key={option.id}>
                <label className="link-row">
                  <input
                    type="radio"
                    name="habito-da-agua"
                    className="link-check"
                    checked={habitChoice === option.id}
                    onChange={() => setHabitChoice(option.id)}
                  />
                  <span className="min-w-0 flex-1 text-[17px] wrap-anywhere">{option.title}</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="action mt-6 min-h-12 w-full" onClick={finish}>
            {current ? 'Salvar' : 'Começar'}
          </button>
        </fieldset>
      )}

      {previous && (
        <button
          type="button"
          className="mt-3 min-h-11 w-full text-[15px] text-mist underline underline-offset-4"
          onClick={() => setStep(previous)}
        >
          Voltar
        </button>
      )}
    </div>
  )
}
