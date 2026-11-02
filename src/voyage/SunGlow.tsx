import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

/** O sol ganha força conforme o dia avança. */
export function SunGlow({ level }: { level: number }) {
  const strength = useSpring(level, { stiffness: 50, damping: 20 })
  const opacity = useTransform(strength, [0, 1], [0.4, 1])
  const transform = useTransform(strength, (value) => `scale(${0.85 + value * 0.35})`)

  useEffect(() => strength.set(level), [strength, level])

  return <motion.div aria-hidden className="sun-glow" style={{ opacity, transform }} />
}
