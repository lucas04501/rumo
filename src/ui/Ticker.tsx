import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

const number = new Intl.NumberFormat('pt-BR')

export function Ticker({ value }: { value: number }) {
  const shown = useSpring(value, { stiffness: 110, damping: 20 })
  const text = useTransform(shown, (current) => number.format(Math.round(current)))

  useEffect(() => shown.set(value), [shown, value])

  return <motion.span>{text}</motion.span>
}
