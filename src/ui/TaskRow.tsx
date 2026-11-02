import { X } from 'lucide-react'
import { deleteTask } from '../data/dayActions'
import { useDay } from '../data/DayProvider'
import type { Task } from '../data/types'
import { ItemRow } from './ItemRow'

export function TaskRow({ task }: { task: Task }) {
  const { toggleTask } = useDay()

  return (
    <div className="flex items-center gap-1">
      <div className="min-w-0 flex-1">
        <ItemRow
          title={task.title}
          done={Boolean(task.doneAt)}
          onToggle={() => toggleTask(task.id)}
        />
      </div>
      <button
        type="button"
        className="icon-button -mr-2.5"
        aria-label={`Excluir ${task.title}`}
        onClick={() => deleteTask(task.id)}
      >
        <X size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}
