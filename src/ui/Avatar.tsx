import {
  Anchor,
  Compass,
  Dumbbell,
  Sailboat,
  Sunrise,
  UserRound,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import { AVATAR_COLORS, type Avatar as AvatarChoice } from '../lib/avatar'
import { initialsOf } from '../lib/profile'

export const AVATAR_ICON_COMPONENTS: Record<Exclude<AvatarChoice['icon'], 'iniciais'>, LucideIcon> = {
  ancora: Anchor,
  bussola: Compass,
  veleiro: Sailboat,
  ondas: Waves,
  sol: Sunrise,
  haltere: Dumbbell,
}

/** Decorativo: o nome sempre aparece ao lado, então leitor de tela não repete. */
export function Avatar({ name, avatar, size }: { name: string; avatar: AvatarChoice; size: number }) {
  const color = AVATAR_COLORS.find(({ id }) => id === avatar.color) ?? AVATAR_COLORS[0]
  const initials = initialsOf(name)
  const Icon = avatar.icon === 'iniciais' ? (initials ? null : UserRound) : AVATAR_ICON_COMPONENTS[avatar.icon]

  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-display font-semibold ${color.className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {Icon ? <Icon size={size * 0.5} strokeWidth={1.75} /> : initials}
    </span>
  )
}
