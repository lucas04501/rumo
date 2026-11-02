import { useState, type ReactNode } from 'react'

type ItemRowProps = {
  title: string
  /** Nome lido por leitores de tela, quando diz mais que o título. */
  label?: string
  done: boolean
  /** Conclui ou desfaz o item e devolve o XP ganho. */
  onToggle: () => number
  leading?: ReactNode
  trailing?: ReactNode
}

type Float = { id: number; xp: number }

export function ItemRow({ title, label, done, onToggle, leading, trailing }: ItemRowProps) {
  const [ripples, setRipples] = useState(0)
  const [floats, setFloats] = useState<Float[]>([])

  const handleClick = () => {
    const xp = onToggle()
    if (xp === 0) return
    setRipples((count) => count + 1)
    setFloats((current) => [...current, { id: Date.now(), xp }])
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label ?? title}
      className="item-row"
      onClick={handleClick}
    >
      <span className="check" data-done={done}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path d="M5.5 12.5l4.2 4.2L18.5 7.5" pathLength="1" />
        </svg>
        {ripples > 0 && done && <span key={ripples} className="check-ripple" />}
      </span>
      {leading}
      <span className={`min-w-0 flex-1 text-[17px] wrap-anywhere transition-colors duration-200 ${done ? 'text-foam/70' : ''}`}>
        {title}
      </span>
      {trailing}
      {floats.map((float) => (
        <span
          key={float.id}
          className="xp-float"
          onAnimationEnd={() => setFloats((current) => current.filter((item) => item.id !== float.id))}
        >
          +{float.xp} XP
        </span>
      ))}
    </button>
  )
}
