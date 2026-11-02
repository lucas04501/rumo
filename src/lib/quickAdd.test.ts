import { describe, expect, it } from 'vitest'
import { parseQuickAdd } from './quickAdd'

// 2026-11-02 é uma segunda-feira.
const TODAY = '2026-11-02'
const parse = (text: string) => parseQuickAdd(text, TODAY)

describe('parseQuickAdd', () => {
  it('texto comum continua igual', () => {
    expect(parse('Comprar pão')).toEqual({
      title: 'Comprar pão',
      date: TODAY,
      priority: 'normal',
      repeat: null,
      labels: [],
    })
  })

  it.each([
    ['Ligar amanhã', 'Ligar', '2026-11-03'],
    ['Ligar amanha', 'Ligar', '2026-11-03'],
    ['Ligar depois de amanhã', 'Ligar', '2026-11-04'],
    ['Ligar hoje', 'Ligar', TODAY],
    ['Pagar luz sexta', 'Pagar luz', '2026-11-06'],
    ['Pagar luz na sexta-feira', 'Pagar luz', '2026-11-06'],
    ['Prova de terça', 'Prova', '2026-11-03'],
    ['Reunião sábado', 'Reunião', '2026-11-07'],
    ['Dentista dia 15', 'Dentista', '2026-11-15'],
    ['Dentista dia 1', 'Dentista', '2026-12-01'],
    ['Dentista 25/12', 'Dentista', '2026-12-25'],
    ['Dentista para 10/01', 'Dentista', '2027-01-10'],
  ])('%s', (text, title, date) => {
    expect(parse(text)).toMatchObject({ title, date })
  })

  it('o mesmo dia da semana de hoje vai para a semana seguinte', () => {
    expect(parse('Treino segunda').date).toBe('2026-11-09')
  })

  it('só entende data no fim, para não estragar o título', () => {
    expect(parse('Segunda via do boleto')).toMatchObject({
      title: 'Segunda via do boleto',
      date: TODAY,
    })
    expect(parse('Amanhã eu resolvo isso').date).toBe(TODAY)
  })

  it('não apaga o título inteiro', () => {
    expect(parse('amanhã')).toMatchObject({ title: 'amanhã', date: TODAY, labels: [] })
    expect(parse('toda segunda')).toMatchObject({ title: 'toda segunda', repeat: null })
  })

  it('só a marca de prioridade continua sendo o título', () => {
    expect(parse('!alta')).toMatchObject({ title: '!alta', priority: 'normal', labels: [] })
  })

  it('ignora data que não existe', () => {
    expect(parse('Pagar 31/02')).toMatchObject({ title: 'Pagar 31/02', date: TODAY })
  })

  it.each([
    ['Pagar luz !alta', 'high'],
    ['!! Pagar luz', 'high'],
    ['Pagar !a luz', 'high'],
    ['Pagar luz !baixa', 'low'],
  ])('prioridade em %s', (text, priority) => {
    const parsed = parse(text)
    expect(parsed.priority).toBe(priority)
    expect(parsed.title).toBe('Pagar luz')
  })

  it.each([
    ['Regar todo dia', [0, 1, 2, 3, 4, 5, 6], null],
    ['Regar todos os dias', [0, 1, 2, 3, 4, 5, 6], null],
    ['Relatório dias úteis', [1, 2, 3, 4, 5], null],
    ['Faxina toda sexta', [5], null],
    ['Treino toda segunda e quarta', [1, 3], null],
    ['Treino toda segunda, quarta e sexta', [1, 3, 5], null],
    ['Aluguel todo dia 5', [0, 1, 2, 3, 4, 5, 6], 5],
    ['Fechar mês todo mês', [0, 1, 2, 3, 4, 5, 6], 2],
    ['Backup toda semana', [1], null],
  ])('repetição em %s', (text, weekdays, monthDay) => {
    expect(parse(text).repeat).toEqual({ weekdays, monthDay })
  })

  it('mostra o que entendeu', () => {
    expect(parse('Pagar luz sexta !alta').labels).toEqual(['Sexta, 06/11', 'Alta'])
    expect(parse('Ligar amanhã').labels).toEqual(['Amanhã'])
    expect(parse('Aluguel todo dia 5').labels).toEqual(['Repete: Todo dia 5'])
  })
})
