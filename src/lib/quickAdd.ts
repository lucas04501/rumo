import type { Priority } from '../data/types'
import { addDays, formatShortDate, toIsoDate, weekdayOf } from './dates'
import { describeRule, type Schedule } from './tasks'

export type QuickAdd = {
  title: string
  date: string
  priority: Priority
  repeat: Schedule | null
  /** O que foi entendido, para mostrar antes de salvar. */
  labels: string[]
}

const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
const WEEKDAY = `(${WEEKDAYS.join('|')})(?:-feira)?`
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const WORK_WEEK = [1, 2, 3, 4, 5]

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

/** Procura só no fim do texto, para "Segunda via do boleto" continuar sendo só um título. */
function atEnd(words: string[], pattern: string): RegExpExecArray | null {
  return new RegExp(`(?:^|\\s)(${pattern})$`).exec(normalize(words.join(' ')))
}

const dropWords = (words: string[], matched: string) =>
  words.slice(0, words.length - matched.trim().split(/\s+/).length)

function nextWeekday(today: string, weekday: number): string {
  return addDays(today, (weekday - weekdayOf(today) + 7) % 7 || 7)
}

function realDate(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day, 12)
  return date.getMonth() === month - 1 && date.getDate() === day ? toIsoDate(date) : null
}

function nextDayOfMonth(today: string, day: number): string | null {
  const [year, month] = today.split('-').map(Number)
  for (let ahead = 0; ahead < 3; ahead += 1) {
    const date = realDate(year, month + ahead, day)
    if (date && date >= today) return date
  }
  return null
}

function nextDate(today: string, day: number, month: number): string | null {
  const year = Number(today.slice(0, 4))
  const date = realDate(year, month, day)
  return date && date >= today ? date : realDate(year + 1, month, day)
}

type Found<T> = { value: T; matched: string } | null

function findRepeat(words: string[], today: string): Found<Schedule> {
  const daily = atEnd(words, 'todo dia|todos os dias|diariamente')
  const monthly = atEnd(words, 'todo dia (\\d{1,2})')
  const monthlyDay = Number(monthly?.[2])
  if (monthly && monthlyDay >= 1 && monthlyDay <= 31) {
    return { value: { weekdays: EVERY_DAY, monthDay: monthlyDay }, matched: monthly[1] }
  }
  if (daily) return { value: { weekdays: EVERY_DAY, monthDay: null }, matched: daily[1] }

  const workDays = atEnd(words, 'dias uteis|todo dia util')
  if (workDays) return { value: { weekdays: WORK_WEEK, monthDay: null }, matched: workDays[1] }

  const everyMonth = atEnd(words, 'todo mes')
  if (everyMonth) {
    return {
      value: { weekdays: EVERY_DAY, monthDay: Number(today.slice(8)) },
      matched: everyMonth[1],
    }
  }

  const everyWeek = atEnd(words, 'toda semana')
  if (everyWeek) {
    return { value: { weekdays: [weekdayOf(today)], monthDay: null }, matched: everyWeek[1] }
  }

  const list = atEnd(words, `(?:toda|todas as) ${WEEKDAY}(?:(?:,| e) ${WEEKDAY})*`)
  if (list) {
    const weekdays = WEEKDAYS.flatMap((name, day) => (list[1].includes(name) ? [day] : []))
    return { value: { weekdays, monthDay: null }, matched: list[1] }
  }

  return null
}

function findDate(words: string[], today: string): Found<string> {
  const after = atEnd(words, 'depois de amanha')
  if (after) return { value: addDays(today, 2), matched: after[1] }

  const tomorrow = atEnd(words, 'amanha')
  if (tomorrow) return { value: addDays(today, 1), matched: tomorrow[1] }

  const now = atEnd(words, 'hoje')
  if (now) return { value: today, matched: now[1] }

  const weekday = atEnd(words, `(?:(?:na|no|de|para|pra) )?${WEEKDAY}`)
  if (weekday) return { value: nextWeekday(today, WEEKDAYS.indexOf(weekday[2])), matched: weekday[1] }

  const dayOfMonth = atEnd(words, '(?:(?:no|para|pra) )?dia (\\d{1,2})')
  const monthDate = dayOfMonth ? nextDayOfMonth(today, Number(dayOfMonth[2])) : null
  if (dayOfMonth && monthDate) return { value: monthDate, matched: dayOfMonth[1] }

  const numeric = atEnd(words, '(?:(?:em|para|pra) )?(\\d{1,2})/(\\d{1,2})')
  const parsed = numeric ? nextDate(today, Number(numeric[2]), Number(numeric[3])) : null
  if (numeric && parsed) return { value: parsed, matched: numeric[1] }

  return null
}

function findPriority(word: string): Priority | null {
  const clean = normalize(word)
  if (clean === '!!' || clean === '!alta' || clean === '!a') return 'high'
  if (clean === '!baixa' || clean === '!b') return 'low'
  return null
}

function dateLabel(date: string, today: string): string {
  if (date === addDays(today, 1)) return 'Amanhã'
  const name = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${name[0].toUpperCase()}${name.slice(1).replace('-feira', '')}, ${formatShortDate(date)}`
}

/** Lê o que a pessoa escreveu. Se tirar a data deixaria o título vazio, o texto fica como está. */
export function parseQuickAdd(text: string, today: string): QuickAdd {
  const typed = text.trim().split(/\s+/)
  let words = typed.filter((word) => findPriority(word) === null)
  // Só a marca, sem título: fica como foi escrito.
  if (words.length === 0) words = typed
  const priority =
    (words === typed ? null : typed.map(findPriority).findLast(Boolean)) ?? 'normal'

  const priorityLabels = priority === 'high' ? ['Alta'] : priority === 'low' ? ['Baixa'] : []
  const plain = (title: string): QuickAdd => ({
    title,
    date: today,
    priority,
    repeat: null,
    labels: priorityLabels,
  })

  const repeat = findRepeat(words, today)
  if (repeat) {
    const rest = dropWords(words, repeat.matched)
    if (rest.length === 0) return plain(words.join(' '))
    words = rest
  }

  const found = findDate(words, today)
  const rest = found ? dropWords(words, found.matched) : words
  const date = found && rest.length > 0 ? found.value : null
  const title = (date ? rest : words).join(' ')

  return {
    ...plain(title),
    date: date ?? today,
    repeat: repeat?.value ?? null,
    labels: [
      ...(date ? [date === today ? 'Hoje' : dateLabel(date, today)] : []),
      ...(repeat ? [`Repete: ${describeRule(repeat.value)}`] : []),
      ...priorityLabels,
    ],
  }
}
