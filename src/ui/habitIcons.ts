import {
  Apple,
  BookOpen,
  Brain,
  Dumbbell,
  Flower2,
  Footprints,
  GlassWater,
  Heart,
  Moon,
  Music,
  PenLine,
  Pill,
  Sun,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export const HABIT_ICONS = {
  dumbbell: Dumbbell,
  run: Footprints,
  water: GlassWater,
  apple: Apple,
  book: BookOpen,
  pen: PenLine,
  brain: Brain,
  flower: Flower2,
  moon: Moon,
  sun: Sun,
  heart: Heart,
  pill: Pill,
  music: Music,
  wallet: Wallet,
} satisfies Record<string, LucideIcon>

export type HabitIconName = keyof typeof HABIT_ICONS

export const DEFAULT_HABIT_ICON: HabitIconName = 'dumbbell'

export function iconFor(name: string): LucideIcon {
  return HABIT_ICONS[name as HabitIconName] ?? HABIT_ICONS[DEFAULT_HABIT_ICON]
}
