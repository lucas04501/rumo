import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { XP } from '../lib/xp'

const VISIBLE_MS = 3200

type WindToastProps = {
  message: string | null
  onDone: () => void
}

export function WindToast({ message, onDone }: WindToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDone, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [message, onDone])

  return (
    <div role="status" className="wind-slot">
      <AnimatePresence>
        {message && (
          <motion.div
            className="wind-toast"
            initial={{ opacity: 0, transform: 'translateY(100%)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            exit={{ opacity: 0, transform: 'translateY(100%)' }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="font-display text-lg font-semibold text-sun">
              Vento a favor! Mais {XP.tailwind} XP
            </p>
            <p className="mt-0.5 text-[15px] text-foam/90">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
