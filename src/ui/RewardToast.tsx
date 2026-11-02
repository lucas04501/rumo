import { Medal } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import type { Reward } from '../data/DayProvider'

const VISIBLE_MS = 3200

type RewardToastProps = {
  reward: Reward | null
  onDone: () => void
}

/** Recompensa pequena: aparece sem bloquear nada e some sozinha. */
export function RewardToast({ reward, onDone }: RewardToastProps) {
  useEffect(() => {
    if (!reward) return
    reward.sound?.()
    const timer = setTimeout(onDone, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [reward, onDone])

  return (
    <div role="status" className="reward-slot">
      <AnimatePresence mode="wait">
        {reward && (
          <motion.div
            key={reward.id}
            className="reward-toast"
            initial={{ opacity: 0, transform: 'translateY(100%)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            exit={{ opacity: 0, transform: 'translateY(100%)' }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center gap-3">
              {reward.isMedal && (
                <span className="medal medal-pop" data-earned="true">
                  <Medal size={20} strokeWidth={1.75} aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-sun">{reward.title}</p>
                <p className="mt-0.5 text-[15px]">{reward.detail}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
