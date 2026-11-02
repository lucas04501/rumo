import { Flag, Repeat } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDay } from '../data/DayProvider'
import type { Snapshot, Task } from '../data/types'
import { BOARD_COLUMNS, boardColumns, dueLabel, type Column } from '../lib/board'
import { XP } from '../lib/xp'
import { CheckMark } from './ItemRow'
import { TaskSheet } from './TaskSheet'
import { useCardDrag } from './useCardDrag'

const EMPTY: Record<Column, string> = {
  todo: 'Nada para os próximos 7 dias.',
  doing: 'Arraste para cá o que você começou.',
  done: 'O que você concluir fica aqui por 7 dias.',
}

type BoardProps = { snapshot: Snapshot; today: string }

/** Tarefas por andamento. Atrasadas e a semana seguem as regras de sempre, só que em colunas. */
export function Board({ snapshot, today }: BoardProps) {
  const { moveCard, toggleTask } = useDay()
  const columns = useMemo(() => boardColumns(snapshot, today), [snapshot, today])
  const [shown, setShown] = useState<Column>('todo')
  const [opened, setOpened] = useState<Task | null>(null)
  const [earned, setEarned] = useState<string | null>(null)

  const celebrate = (task: Task, xp: number) => {
    if (xp > 0) setEarned(task.id)
  }

  const drag = useCardDrag((task, column) => celebrate(task, moveCard(task, column)))
  const everything = [...columns.todo, ...columns.doing, ...columns.done]
  const subtasksOf = (task: Task) => snapshot.subtasks.filter((item) => item.taskId === task.id)

  return (
    <div ref={drag.board} className="mt-4">
      <div className="lg:hidden">
        <div className="segmented segmented-wide" role="group" aria-label="Coluna">
          {BOARD_COLUMNS.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={shown === id} onClick={() => setShown(id)}>
              {label} <span className="font-normal">{columns[id].length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="board-columns">
        {BOARD_COLUMNS.map(({ id, label }) => (
          <section
            key={id}
            aria-labelledby={`coluna-${id}`}
            data-column={id}
            data-over={drag.over === id}
            className={`board-column ${shown === id ? '' : 'max-lg:hidden'}`}
          >
            <div className="flex items-baseline justify-between gap-3 px-1 max-lg:sr-only">
              <h2 id={`coluna-${id}`} className="font-display text-xl font-semibold">
                {label}
              </h2>
              <p className="text-[15px] text-mist">{columns[id].length}</p>
            </div>

            {columns[id].length > 0 ? (
              <ul className="mt-3 grid grid-cols-1 gap-2 max-lg:mt-0">
                {columns[id].map((task) => (
                  <li key={task.id}>
                    <article
                      className="card"
                      data-dragging={drag.dragged?.id === task.id}
                      onPointerDown={(event) => drag.onPointerDown(event, task)}
                      onContextMenu={(event) => {
                        // Segurar no Android abriria o menu do navegador por cima do gesto.
                        if ((event.nativeEvent as PointerEvent).pointerType !== 'mouse') {
                          event.preventDefault()
                        }
                      }}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={Boolean(task.doneAt)}
                        aria-label={task.title}
                        data-nodrag
                        className="card-check"
                        onClick={() => celebrate(task, toggleTask(task))}
                      >
                        <CheckMark done={Boolean(task.doneAt)} />
                      </button>
                      <button
                        type="button"
                        className="card-body"
                        aria-label={`Detalhes de ${task.title}`}
                        onClick={() => {
                          if (!drag.justDragged()) setOpened(task)
                        }}
                      >
                        <CardText task={task} today={today} subtasks={subtasksOf(task).length} />
                      </button>
                      {earned === task.id && (
                        <span className="xp-float" onAnimationEnd={() => setEarned(null)}>
                          +{XP.task} XP
                        </span>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 px-1 text-[15px] text-mist max-lg:mt-0">{EMPTY[id]}</p>
            )}
          </section>
        ))}
      </div>

      {/* No corpo da página: dentro da área principal, os alvos ficariam atrás do botão de criar. */}
      {drag.dragged &&
        createPortal(
        <>
          <div className="board-drop" aria-hidden>
            {BOARD_COLUMNS.map(({ id, label }) => (
              <span key={id} data-column={id} data-over={drag.over === id}>
                {label}
              </span>
            ))}
          </div>
          <div ref={drag.ghost} className="card card-ghost" style={drag.ghostStyle()} aria-hidden>
            <div className="card-body">
              <CardText
                task={drag.dragged}
                today={today}
                subtasks={subtasksOf(drag.dragged).length}
              />
            </div>
          </div>
        </>,
        document.body,
      )}

      {opened && (
        <TaskSheet
          task={everything.find((task) => task.id === opened.id) ?? opened}
          onClosed={() => setOpened(null)}
        />
      )}
    </div>
  )
}

function CardText({ task, today, subtasks }: { task: Task; today: string; subtasks: number }) {
  const done = Boolean(task.doneAt)
  const label = dueLabel(task.date, today, done)
  const late = label.startsWith('Atrasada')

  return (
    <>
      <span className={`block text-[15px]/snug font-medium wrap-anywhere ${done ? 'text-mist' : ''}`}>
        {task.title}
      </span>
      <span className="mt-1 flex items-center gap-2 text-sm text-mist">
        {task.priority === 'high' && (
          <Flag size={13} strokeWidth={1.75} className="shrink-0 fill-foam text-foam" aria-label="Prioridade alta" />
        )}
        <span className={late ? 'text-foam' : ''}>{label}</span>
        {task.ruleId && <Repeat size={13} strokeWidth={1.75} aria-label="Repete" />}
        {subtasks > 0 && <span aria-label={`${subtasks} subtarefas`}>{subtasks} sub</span>}
      </span>
    </>
  )
}
