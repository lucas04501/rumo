// Datas do app são dias locais no formato YYYY-MM-DD, nunca instantes em UTC.

const pad = (value: number) => String(value).padStart(2, '0')

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function hoje(now: Date = new Date()): string {
  return toIsoDate(now)
}

function parse(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  // Meio-dia evita pular um dia em viradas de horário de verão.
  return new Date(year, month - 1, day, 12)
}

export function addDays(iso: string, amount: number): string {
  const date = parse(iso)
  date.setDate(date.getDate() + amount)
  return toIsoDate(date)
}

export function diffDays(later: string, earlier: string): number {
  return Math.round((parse(later).getTime() - parse(earlier).getTime()) / 86_400_000)
}

/** 0 é domingo, como em `Date.getDay()`. */
export function weekdayOf(iso: string): number {
  return parse(iso).getDay()
}

/** Os sete dias da semana da data, de domingo a sábado. */
export function weekOf(iso: string): string[] {
  const sunday = addDays(iso, -weekdayOf(iso))
  return Array.from({ length: 7 }, (_, day) => addDays(sunday, day))
}

export function formatShortDate(iso: string): string {
  return parse(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatLongDate(iso: string): string {
  const text = parse(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return text[0].toUpperCase() + text.slice(1)
}
