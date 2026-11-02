import { Check, ChevronDown, Clock, Ellipsis, Flag, Repeat, SkipForward } from 'lucide-react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { useRef, useState } from 'react'
import { useDay } from '../data/DayProvider'
import { useSnapshot } from '../data/store'
import { postponeTask } from '../data/taskActions'
import type { Task } from '../data/types'
import { haptic } from '../lib/feedback'
import { ItemRow } from './ItemRow'
import { TaskSheet } from './TaskSheet'

const LABELS = { high: 'Prioridade alta: ', normal: '', low: 'Prioridade baixa: ' }

const SWIPE_DISTANCE = 96
const SWIPE_VELOCITY = 500
const SWIPE_MIN_FLICK = 24
const REVEAL_DISTANCE = 56
const CLICK_GUARD_MS = 60

export function TaskRow({ task }: { task: Task }) {
  const { date: today, toggleTask } = useDay()
  const { data: snapshot } = useSnapshot()
  const [opened, setOpened] = useState(false)
  const row = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const armed = useRef(false)

  const x = useMotionValue(0)
  const doneOpacity = useTransform(x, [0, REVEAL_DISTANCE], [0, 1])
  const laterOpacity = useTransform(x, [-REVEAL_DISTANCE, 0], [1, 0])

  const subtasks = snapshot?.subtasks.filter((subtask) => subtask.taskId === task.id) ?? []
  const subtasksDone = subtasks.filter((subtask) => subtask.doneAt).length

  const swiped = ({ offset, velocity }: PanInfo) => {
    const far = Math.abs(offset.x) >= SWIPE_DISTANCE
    const flicked = Math.abs(velocity.x) >= SWIPE_VELOCITY && Math.abs(offset.x) >= SWIPE_MIN_FLICK
    return far || flicked
  }

  const finishSwipe = (info: PanInfo) => {
    setTimeout(() => {
      dragged.current = false
    }, CLICK_GUARD_MS)
    armed.current = false
    if (!swiped(info)) return

    if (info.offset.x > 0) {
      // Passa pelo mesmo clique do check, para manter XP, som e ondulação. A trava
      // contra o clique que vem depois do gesto não pode barrar este aqui.
      dragged.current = false
      row.current?.querySelector<HTMLElement>('[role="checkbox"]')?.click()
      dragged.current = true
    } else if (!task.doneAt) postponeTask(task, today)
  }

  return (
    <div className="swipe-row">
      <div className="swipe-under" aria-hidden>
        <motion.span className="swipe-action swipe-done" style={{ opacity: doneOpacity }}>
          <Check size={20} strokeWidth={2.25} />
        </motion.span>
        {!task.doneAt && (
          <motion.span className="swipe-action swipe-later" style={{ opacity: laterOpacity }}>
            {task.ruleId ? 'Pular' : 'Amanhã'}
            {task.ruleId ? (
              <SkipForward size={18} strokeWidth={1.75} />
            ) : (
              <Clock size={18} strokeWidth={1.75} />
            )}
          </motion.span>
        )}
      </div>

      <motion.div
        ref={row}
        className="swipe-surface flex items-center gap-1"
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragSnapToOrigin
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.62}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
        onDragStart={() => {
          dragged.current = true
        }}
        onDrag={(_, info) => {
          const crossed = Math.abs(info.offset.x) >= SWIPE_DISTANCE
          if (crossed && !armed.current) haptic()
          armed.current = crossed
        }}
        onDragEnd={(_, info) => finishSwipe(info)}
        onClickCapture={(event) => {
          if (!dragged.current) return
          event.preventDefault()
          event.stopPropagation()
        }}
      >
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
      </motion.div>
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
