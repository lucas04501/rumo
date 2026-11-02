export const FRASES = [
  'Ninguém chega de uma vez. Chega um dia de cada vez.',
  'Feito hoje pesa mais que perfeito amanhã.',
  'Pequeno também é avanço.',
  'Você não precisa de vontade. Precisa da próxima remada.',
  'Disciplina é gentileza com quem você vai ser amanhã.',
  'A rota muda. O rumo, não.',
  'Começar pequeno ainda é começar.',
  'O que você repete hoje decide onde vai ancorar.',
  'Cada check é mais uma milha.',
  'Não é sobre o dia perfeito. É sobre voltar para o barco.',
  'Quem rema devagar ainda sai do lugar.',
  'O cansaço passa. O dia feito fica.',
  'Hoje só precisa ser feito, não precisa ser bonito.',
  'A maré sobe para quem aparece.',
  'Você já está mais longe do que ontem.',
  'Palavra cumprida consigo mesmo vale ouro.',
  'Foco é escolher o que fica fora do barco.',
  'Um passo chato ainda é um passo.',
  'Seu eu de amanhã agradece o de hoje.',
  'Constância vence intensidade.',
  'Menos plano, mais remo.',
  'Se está difícil, é porque você saiu do porto.',
  'Termine o dia melhor do que começou. Só isso.',
  'Ninguém vê o treino. Todo mundo vê a chegada.',
  'Agora só importa o próximo item.',
  'Devagar também chega. Parado, não.',
  'Você não precisa ver o porto para continuar navegando.',
  'Hoje conta.',
]

export const FRASES_VENTO = [
  'Hoje o mar está do seu lado.',
  'O vento virou a seu favor.',
  'Boa. O barco ganhou velocidade.',
  'Sorte de quem apareceu para remar.',
]

export function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}
