import { describe, expect, it } from 'vitest'
import type { Note } from '../data/types'
import { isBlankNote, journalEntries, notePreview, noteTitle, visibleNotes } from './notes'

const note = (id: string, change: Partial<Note> = {}): Note => ({
  id,
  goalId: null,
  title: '',
  body: '',
  pinned: false,
  updatedAt: '2026-11-02T12:00:00.000Z',
  ...change,
})

describe('título e prévia', () => {
  it('usa o título quando existe', () => {
    const item = { title: 'Mercado', body: 'Pão\nCafé' }
    expect(noteTitle(item)).toBe('Mercado')
    expect(notePreview(item)).toBe('Pão Café')
  })

  it('sem título, a primeira linha vira título e sai da prévia', () => {
    const item = { title: '  ', body: '\nPão\n\nCafé' }
    expect(noteTitle(item)).toBe('Pão')
    expect(notePreview(item)).toBe('Café')
  })

  it('nota sem nada mostra "Sem título"', () => {
    expect(noteTitle({ title: '', body: '  \n ' })).toBe('Sem título')
  })

  it('reconhece nota em branco', () => {
    expect(isBlankNote({ title: ' ', body: '\n ' })).toBe(true)
    expect(isBlankNote({ title: '', body: 'x' })).toBe(false)
  })
})

describe('visibleNotes', () => {
  it('põe as fixadas primeiro e, em cada grupo, a mais recente', () => {
    const notes = [
      note('antiga', { updatedAt: '2026-11-01T12:00:00.000Z' }),
      note('nova', { updatedAt: '2026-11-02T12:00:00.000Z' }),
      note('fixada', { pinned: true, updatedAt: '2026-10-01T12:00:00.000Z' }),
    ]
    expect(visibleNotes(notes, '').map(({ id }) => id)).toEqual(['fixada', 'nova', 'antiga'])
  })

  it('busca no título e no texto, sem diferenciar maiúscula nem acento', () => {
    const notes = [note('a', { title: 'Maré alta' }), note('b', { body: 'Ver a MARÉ' }), note('c', { title: 'Sol' })]
    expect(visibleNotes(notes, 'mare').map(({ id }) => id).sort()).toEqual(['a', 'b'])
  })

  it('não altera a lista recebida', () => {
    const notes = [note('a'), note('b', { pinned: true })]
    visibleNotes(notes, '')
    expect(notes.map(({ id }) => id)).toEqual(['a', 'b'])
  })
})

describe('journalEntries', () => {
  const day = (date: string, value: string | null) => ({ date, completedAt: null, note: value })
  const today = '2026-11-02'

  it('lista dias com texto, do mais novo ao mais antigo, com hoje no topo mesmo vazio', () => {
    const days = [day('2026-10-30', 'Antes'), day('2026-11-01', 'Ontem'), day('2026-10-31', null)]
    expect(journalEntries(days, today, '')).toEqual([
      { date: today, note: '' },
      { date: '2026-11-01', note: 'Ontem' },
      { date: '2026-10-30', note: 'Antes' },
    ])
  })

  it('não duplica hoje quando já há texto', () => {
    expect(journalEntries([day(today, 'Hoje')], today, '')).toEqual([{ date: today, note: 'Hoje' }])
  })

  it('na busca, mostra só o que combina, sem o convite de hoje', () => {
    const days = [day('2026-11-01', 'Treino bom'), day('2026-10-30', 'Chuva')]
    expect(journalEntries(days, today, 'TREINO')).toEqual([{ date: '2026-11-01', note: 'Treino bom' }])
  })

  it('ignora dia com texto só de espaços', () => {
    expect(journalEntries([day('2026-11-01', '  ')], today, 'x')).toEqual([])
  })
})
