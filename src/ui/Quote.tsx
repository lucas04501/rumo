import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { FRASES, pick } from '../content/frases'

const ROTATION_MS = 30_000

export function Quote() {
  const [quote, setQuote] = useState(() => pick(FRASES))

  useEffect(() => {
    const timer = setInterval(() => setQuote(pick(FRASES)), ROTATION_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="mt-4 min-h-[2lh] font-display text-[17px]/[1.35] font-medium text-mist sm:min-h-[1lh]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={quote}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {quote}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
