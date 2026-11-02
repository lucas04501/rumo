import { Volume2, VolumeX } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { isMuted, setMuted, soundUnmute, subscribeMuted } from '../lib/feedback'

export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted)
  const Icon = muted ? VolumeX : Volume2

  const toggle = () => {
    setMuted(!muted)
    if (muted) soundUnmute()
  }

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-label={muted ? 'Ativar sons' : 'Desativar sons'}
      onClick={toggle}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden />
    </button>
  )
}
