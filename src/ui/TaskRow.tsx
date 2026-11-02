import { ChevronDown, Ellipsis, Flag, Repeat } from 'lucide-react'
import { useState } from 'react'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import type { Task } from '../data/types'
import { ItemRow } from './ItemRow'
import { TaskSheet } from './TaskSheet'

const LABELS = { high: 'Prioridade alta: ', normal: '', low: 'Prioridade baixa: ' }

export function TaskRow({ task }: { task: Task }) {
  const { toggleTask } = useDay()
  const { data: snapshot } = useSnapshot()
  const [opened, setOpened] = useState(false)

  const subtasks = snapshot?.subtasks.filter((subtask) => subtask.taskId === task.id) ?? []
  const subtasksDone = subtasks.filter((subtask) => subtask.doneAt).length

  return (
    <div className="flex items-center gap-1">
      <div className="min-w-0 flex-1">
        <ItemRow
          title={task.title}
          label={`${LABELS[task.priority]}${task.title}`}
          done={Boolean(task.doneAt)}
          onToggle={() => toggleTask(task)}
          leading={<PriorityMark priority={task.priority} />}
          trailing={
            (task.ruleId || subtasks.length > 0) && (
              <span className="flex shrink-0 items-center gap-1.5 text-[15px] text-mist">
                {task.ruleId && <Repeat size={14} strokeWidth={1.75} aria-label="Repete" />}
                {subtasks.length > 0 && (
                  <span aria-label={`${subtasksDone} de ${subtasks.length} subtarefas`}>
                    {subtasksDone}/{subtasks.length}
                  </span>
                )}
              </span>
            )
          }
        />
      </div>
      <button
        type="button"
        className="icon-button -mr-2.5"
        aria-label={`Detalhes de ${task.title}`}
        onClick={() => setOpened(true)}
      >
        <Ellipsis size={20} strokeWidth={1.75} aria-hidden />
      </button>
      {opened && <TaskSheet task={task} onClosed={() => setOpened(false)} />}
    </div>
  )
}

function PriorityMark({ priority }: { priority: Task['priority'] }) {
  if (priority === 'high') {
    return <Flag size={15} strokeWidth={1.75} className="shrink-0 fill-foam text-foam" aria-hidden />
  }
  if (priority === 'low') {
    return <ChevronDown size={17} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
  }
  return null
}
