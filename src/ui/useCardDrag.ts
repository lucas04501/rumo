import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Task } from '../data/types'
import { columnOf, type Column } from '../lib/board'
import { haptic } from '../lib/feedback'

const LONG_PRESS_MS = 220
const MOVE_SLOP = 8
const CLICK_GUARD_MS = 60

type Press = {
  task: Task
  pointerId: number
  x: number
  y: number
  grabX: number
  grabY: number
  width: number
  active: boolean
}

const columnAt = (x: number, y: number) =>
  (document.elementFromPoint(x, y)?.closest('[data-column]')?.getAttribute('data-column') ??
    null) as Column | null

/**
 * Arrastar cartões com o mesmo código no mouse e no toque. No toque, o gesto começa
 * ao segurar: antes disso, o dedo está só rolando a tela. Nada aqui re-renderiza a
 * cada movimento: o fantasma anda direto no estilo.
 */
export function useCardDrag(onDrop: (task: Task, column: Column) => void) {
  const board = useRef<HTMLDivElement>(null)
  const ghost = useRef<HTMLDivElement>(null)
  const press = useRef<Press | null>(null)
  const guarded = useRef(false)
  const [dragged, setDragged] = useState<Task | null>(null)
  const [over, setOver] = useState<Column | null>(null)

  useEffect(() => {
    // O Safari só aceita cancelar a rolagem com um ouvinte não passivo já registrado antes do toque.
    const node = board.current
    const hold = (event: TouchEvent) => {
      if (press.current?.active) event.preventDefault()
    }
    node?.addEventListener('touchmove', hold, { passive: false })
    return () => node?.removeEventListener('touchmove', hold)
  }, [])

  const paint = ({ x, y, grabX, grabY }: Press) => {
    if (ghost.current) ghost.current.style.transform = `translate3d(${x - grabX}px, ${y - grabY}px, 0)`
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>, task: Task) => {
    const target = event.target as HTMLElement
    if (event.button !== 0 || press.current || target.closest('[data-nodrag]')) return

    const box = event.currentTarget.getBoundingClientRect()
    const started = { x: event.clientX, y: event.clientY }
    const touch = event.pointerType !== 'mouse'
    const current: Press = {
      task,
      pointerId: event.pointerId,
      ...started,
      grabX: event.clientX - box.left,
      grabY: event.clientY - box.top,
      width: box.width,
      active: false,
    }
    press.current = current

    const activate = () => {
      current.active = true
      if (touch) haptic()
      setDragged(task)
    }
    const timer = touch ? setTimeout(activate, LONG_PRESS_MS) : undefined

    const stop = () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('keydown', escape)
      press.current = null
      setDragged(null)
      setOver(null)
    }

    const move = (moved: PointerEvent) => {
      if (moved.pointerId !== current.pointerId) return
      current.x = moved.clientX
      current.y = moved.clientY

      if (!current.active) {
        if (Math.hypot(moved.clientX - started.x, moved.clientY - started.y) < MOVE_SLOP) return
        if (touch) return stop()
        activate()
      }
      paint(current)
      setOver(columnAt(moved.clientX, moved.clientY))
    }

    const finish = (ended: PointerEvent) => {
      if (ended.pointerId !== current.pointerId) return
      if (current.active) {
        guarded.current = true
        setTimeout(() => {
          guarded.current = false
        }, CLICK_GUARD_MS)
        const column = columnAt(ended.clientX, ended.clientY)
        if (column && column !== columnOf(task)) onDrop(task, column)
      }
      stop()
    }

    const escape = (pressed: KeyboardEvent) => {
      if (pressed.key === 'Escape') stop()
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('keydown', escape)
  }

  return {
    board,
    ghost,
    dragged,
    over,
    onPointerDown,
    ghostStyle: () => {
      const current = press.current
      return current
        ? {
            width: current.width,
            transform: `translate3d(${current.x - current.grabX}px, ${current.y - current.grabY}px, 0)`,
          }
        : undefined
    },
    /** O clique que o navegador manda ao soltar não pode abrir o cartão. */
    justDragged: () => guarded.current,
  }
}
