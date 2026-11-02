import { BookOpen, Dumbbell, Flower2, GlassWater, Moon, type LucideIcon } from 'lucide-react'

export const HABIT_ICONS = {
  book: BookOpen,
  dumbbell: Dumbbell,
  flower: Flower2,
  moon: Moon,
  water: GlassWater,
} satisfies Record<string, LucideIcon>

export type HabitIconName = keyof typeof HABIT_ICONS
