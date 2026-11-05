import { Check } from 'lucide-react'
import { writeAvatar, AVATAR_COLORS, AVATAR_ICONS, type Avatar as AvatarChoice } from '../lib/avatar'
import { initialsOf } from '../lib/profile'
import { Avatar, AVATAR_ICON_COMPONENTS } from './Avatar'
import { Sheet } from './Sheet'

const ICON_LABELS: Record<AvatarChoice['icon'], string> = {
  iniciais: 'Iniciais',
  ancora: 'Âncora',
  bussola: 'Bússola',
  veleiro: 'Veleiro',
  ondas: 'Ondas',
  sol: 'Sol',
  haltere: 'Haltere',
}

type Props = { userId: string; name: string; avatar: AvatarChoice; onClosed: () => void }

/** Salva a cada toque: não há o que confirmar, e a escolha é só deste aparelho. */
export function AvatarSheet({ userId, name, avatar, onClosed }: Props) {
  const choose = (change: Partial<AvatarChoice>) => writeAvatar(userId, { ...avatar, ...change })

  return (
    <Sheet title="Seu avatar" onClosed={onClosed}>
      {(close) => (
        <div className="mt-4 grid gap-6">
          <div className="flex justify-center">
            <Avatar name={name} avatar={avatar} size={88} />
          </div>

          <fieldset>
            <legend className="text-[15px] text-mist">Cor</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {AVATAR_COLORS.map(({ id, label, className }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  aria-pressed={avatar.color === id}
                  className={`grid size-12 place-items-center rounded-full ${className} ${
                    avatar.color === id ? 'ring-2 ring-tide ring-offset-2 ring-offset-sea-1' : 'ring-1 ring-line-strong'
                  }`}
                  onClick={() => choose({ color: id })}
                >
                  {avatar.color === id && <Check size={20} strokeWidth={2.5} aria-hidden />}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[15px] text-mist">Símbolo</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {AVATAR_ICONS.map((id) => {
                const Icon = id === 'iniciais' ? null : AVATAR_ICON_COMPONENTS[id]
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={ICON_LABELS[id]}
                    aria-pressed={avatar.icon === id}
                    className="pick size-12 shrink-0"
                    onClick={() => choose({ icon: id })}
                  >
                    {Icon ? <Icon size={22} strokeWidth={1.75} aria-hidden /> : initialsOf(name) || 'Aa'}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <p className="text-[15px] text-mist">
            Nenhuma foto é guardada. A escolha fica só neste aparelho, e em outro você escolhe de novo.
          </p>
          <button type="button" className="action min-h-12" onClick={close}>
            Pronto
          </button>
        </div>
      )}
    </Sheet>
  )
}
