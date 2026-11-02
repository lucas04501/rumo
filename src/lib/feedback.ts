// Sons sintetizados na hora: nada para baixar, e funcionam offline.

const ROOT_HZ = 440
// Pentatônica: qualquer sequência de notas soa bem, e cada conclusão do dia sobe um degrau.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
const PARTIALS = [
  [1, 1],
  [2, 0.3],
  [3.01, 0.08],
]

const MUTED_KEY = 'rumo:sons-desligados'

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1'
  } catch {
    return false
  }
}

let audio: AudioContext | null = null
let muted = readMuted()
const mutedListeners = new Set<() => void>()

export function isMuted(): boolean {
  return muted
}

export function subscribeMuted(listener: () => void) {
  mutedListeners.add(listener)
  return () => {
    mutedListeners.delete(listener)
  }
}

export function setMuted(value: boolean) {
  muted = value
  try {
    localStorage.setItem(MUTED_KEY, value ? '1' : '0')
  } catch {
    // Sem armazenamento, a escolha vale até fechar o app.
  }
  mutedListeners.forEach((listener) => listener())
}

// Todo som passa por aqui: este é o único portão do "sem som".
function pluck(semitones: number, delay = 0, peak = 0.14) {
  if (muted) return

  audio ??= new AudioContext()
  if (audio.state === 'suspended') void audio.resume()

  const start = audio.currentTime + delay
  const frequency = ROOT_HZ * 2 ** (semitones / 12)

  for (const [ratio, level] of PARTIALS) {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.frequency.value = frequency * ratio
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak * level, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.55)
  }
}

function phrase(notes: number[], gap: number) {
  notes.forEach((note, index) => pluck(note, index * gap))
}

export function soundCheck(step: number) {
  pluck(SCALE[Math.min(step, SCALE.length - 1)])
}

export function soundUncheck() {
  pluck(-5, 0, 0.05)
}

export function soundUnmute() {
  pluck(7, 0, 0.07)
}

export function soundWind() {
  phrase([12, 16, 19, 24], 0.07)
}

export function soundArrival() {
  phrase([7, 12, 16], 0.1)
}

export function soundCelebration() {
  phrase([0, 4, 7, 12, 16, 19, 24], 0.09)
}

/** Fim de um bloco de foco ou de uma pausa: audível de longe, sem festa. */
export function soundFocusEnd() {
  phrase([7, 12, 7, 12], 0.16)
}

/** Android vibra. No iPhone a chamada não faz nada, e o som e o visual seguem valendo. */
export function haptic() {
  navigator.vibrate?.(10)
}
