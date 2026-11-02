export const MUSCLES = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Pernas',
  'Glúteos',
  'Abdômen',
  'Cardio',
] as const

export type Muscle = (typeof MUSCLES)[number]

export type LibraryExercise = { id: string; name: string; muscle: Muscle; how: string }

// O ID vai para o banco, em `exercise_ref`: renomear é livre, trocar o ID perde o histórico.
export const EXERCISES: LibraryExercise[] = [
  { id: 'supino-reto', name: 'Supino reto', muscle: 'Peito', how: 'Deitado, pés firmes no chão. Desça a barra até perto do peito e empurre sem tirar os ombros do banco.' },
  { id: 'supino-inclinado', name: 'Supino inclinado', muscle: 'Peito', how: 'Banco a cerca de 30 graus. Desça até a parte alta do peito e empurre para cima, com os punhos firmes.' },
  { id: 'supino-halteres', name: 'Supino com halteres', muscle: 'Peito', how: 'Deitado, cotovelos a cerca de 45 graus do tronco. Desça com controle e aproxime os halteres no alto.' },
  { id: 'crucifixo', name: 'Crucifixo', muscle: 'Peito', how: 'Braços levemente flexionados. Abra até sentir o peito alongar e feche como quem abraça.' },
  { id: 'crossover', name: 'Crossover', muscle: 'Peito', how: 'Polias no alto, tronco levemente à frente. Traga as mãos para baixo e para o centro, sem dobrar mais o cotovelo.' },
  { id: 'flexao', name: 'Flexão de braço', muscle: 'Peito', how: 'Corpo reto da cabeça aos pés. Desça até o peito chegar perto do chão e empurre.' },

  { id: 'puxada-frente', name: 'Puxada frontal', muscle: 'Costas', how: 'Peito aberto. Puxe a barra até a parte alta do peito, levando os cotovelos para baixo, e suba com controle.' },
  { id: 'barra-fixa', name: 'Barra fixa', muscle: 'Costas', how: 'Parta com os braços estendidos. Puxe até o queixo passar da barra, sem balançar o corpo.' },
  { id: 'remada-curvada', name: 'Remada curvada', muscle: 'Costas', how: 'Tronco inclinado e coluna reta. Puxe a barra até o abdômen, juntando as escápulas.' },
  { id: 'remada-baixa', name: 'Remada baixa', muscle: 'Costas', how: 'Sentado, coluna reta. Puxe o triângulo até o abdômen sem jogar o tronco para trás.' },
  { id: 'remada-unilateral', name: 'Remada unilateral', muscle: 'Costas', how: 'Apoie mão e joelho no banco. Puxe o halter em direção ao quadril, com o cotovelo perto do corpo.' },
  { id: 'levantamento-terra', name: 'Levantamento terra', muscle: 'Costas', how: 'Barra perto das canelas, coluna neutra. Suba empurrando o chão com os pés, sem arredondar as costas.' },

  { id: 'desenvolvimento', name: 'Desenvolvimento', muscle: 'Ombros', how: 'Parta com a carga na altura dos ombros. Empurre para cima sem arquear a lombar.' },
  { id: 'elevacao-lateral', name: 'Elevação lateral', muscle: 'Ombros', how: 'Cotovelos levemente flexionados. Suba os braços até a linha dos ombros e desça devagar.' },
  { id: 'elevacao-frontal', name: 'Elevação frontal', muscle: 'Ombros', how: 'Suba o peso à frente até a linha dos ombros, sem balançar o tronco.' },
  { id: 'crucifixo-invertido', name: 'Crucifixo invertido', muscle: 'Ombros', how: 'Tronco inclinado ou na máquina. Abra os braços para trás, juntando as escápulas.' },
  { id: 'encolhimento', name: 'Encolhimento', muscle: 'Ombros', how: 'Braços estendidos. Suba os ombros em direção às orelhas e desça devagar, sem girar.' },

  { id: 'rosca-direta', name: 'Rosca direta', muscle: 'Bíceps', how: 'Cotovelos colados ao corpo. Suba a barra dobrando só o cotovelo e desça com controle.' },
  { id: 'rosca-alternada', name: 'Rosca alternada', muscle: 'Bíceps', how: 'Um braço de cada vez, girando o punho ao subir. O tronco fica parado.' },
  { id: 'rosca-martelo', name: 'Rosca martelo', muscle: 'Bíceps', how: 'Palmas voltadas uma para a outra durante todo o movimento.' },
  { id: 'rosca-scott', name: 'Rosca Scott', muscle: 'Bíceps', how: 'Braços apoiados no banco. Desça sem estender tudo de uma vez e suba com controle.' },

  { id: 'triceps-corda', name: 'Tríceps na corda', muscle: 'Tríceps', how: 'Cotovelos parados ao lado do corpo. Estenda os braços e abra a corda no final.' },
  { id: 'triceps-testa', name: 'Tríceps testa', muscle: 'Tríceps', how: 'Deitado, braços apontados para cima. Dobre só o cotovelo, levando a barra perto da testa.' },
  { id: 'triceps-frances', name: 'Tríceps francês', muscle: 'Tríceps', how: 'Peso atrás da cabeça, cotovelos apontados para cima. Estenda os braços sem abrir os cotovelos.' },
  { id: 'mergulho', name: 'Mergulho', muscle: 'Tríceps', how: 'Nas paralelas ou no banco. Desça até os cotovelos formarem um ângulo reto e empurre.' },

  { id: 'agachamento', name: 'Agachamento', muscle: 'Pernas', how: 'Pés na largura dos ombros. Desça como quem senta, com o peito aberto e os joelhos na direção dos pés.' },
  { id: 'agachamento-smith', name: 'Agachamento no Smith', muscle: 'Pernas', how: 'Pés um pouco à frente da barra. Desça com controle, sem tirar os calcanhares do chão.' },
  { id: 'leg-press', name: 'Leg press', muscle: 'Pernas', how: 'Lombar apoiada. Desça até um ângulo confortável e empurre sem travar os joelhos.' },
  { id: 'cadeira-extensora', name: 'Cadeira extensora', muscle: 'Pernas', how: 'Ajuste o apoio na altura dos tornozelos. Estenda as pernas e desça devagar.' },
  { id: 'mesa-flexora', name: 'Mesa flexora', muscle: 'Pernas', how: 'Quadril apoiado. Dobre os joelhos trazendo o rolo em direção ao glúteo e volte com controle.' },
  { id: 'afundo', name: 'Afundo', muscle: 'Pernas', how: 'Um passo à frente. Desça até os dois joelhos formarem cerca de 90 graus e volte.' },
  { id: 'panturrilha-em-pe', name: 'Panturrilha em pé', muscle: 'Pernas', how: 'Suba na ponta dos pés o máximo que der, pare um instante e desça devagar.' },
  { id: 'panturrilha-sentado', name: 'Panturrilha sentado', muscle: 'Pernas', how: 'Joelhos sob o apoio. Suba os calcanhares e desça alongando bem.' },

  { id: 'elevacao-pelvica', name: 'Elevação pélvica', muscle: 'Glúteos', how: 'Costas no banco, pés no chão. Suba o quadril contraindo o glúteo e desça com controle.' },
  { id: 'stiff', name: 'Stiff', muscle: 'Glúteos', how: 'Joelhos quase estendidos. Leve o quadril para trás descendo a barra perto das pernas, com a coluna reta.' },
  { id: 'bulgaro', name: 'Agachamento búlgaro', muscle: 'Glúteos', how: 'Pé de trás apoiado no banco. Desça na vertical e suba empurrando com a perna da frente.' },
  { id: 'abducao', name: 'Abdução de quadril', muscle: 'Glúteos', how: 'Na máquina, sentado. Abra as pernas contra a resistência e volte devagar.' },

  { id: 'abdominal', name: 'Abdominal', muscle: 'Abdômen', how: 'Deitado, joelhos dobrados. Tire os ombros do chão aproximando as costelas do quadril.' },
  { id: 'prancha', name: 'Prancha', muscle: 'Abdômen', how: 'Apoio nos antebraços, corpo reto. Mantenha o abdômen firme, sem deixar o quadril cair. Anote o tempo nas repetições.' },
  { id: 'elevacao-pernas', name: 'Elevação de pernas', muscle: 'Abdômen', how: 'Deitado ou pendurado. Suba as pernas com o abdômen firme e desça sem soltar.' },
  { id: 'abdominal-cabo', name: 'Abdominal no cabo', muscle: 'Abdômen', how: 'De joelhos, corda perto da cabeça. Enrole o tronco para baixo, sem puxar com os braços.' },

  { id: 'esteira', name: 'Esteira', muscle: 'Cardio', how: 'Comece leve por alguns minutos. Anote os minutos nas repetições e a inclinação nas observações.' },
  { id: 'bicicleta', name: 'Bicicleta', muscle: 'Cardio', how: 'Ajuste o banco para o joelho quase estender embaixo. Anote os minutos nas repetições.' },
  { id: 'eliptico', name: 'Elíptico', muscle: 'Cardio', how: 'Tronco reto e movimento contínuo. Anote os minutos nas repetições.' },
  { id: 'remo', name: 'Remo ergométrico', muscle: 'Cardio', how: 'Empurre primeiro com as pernas, depois puxe com os braços. Anote os minutos nas repetições.' },
  { id: 'corda', name: 'Pular corda', muscle: 'Cardio', how: 'Saltos baixos, com o giro vindo dos punhos. Anote os minutos nas repetições.' },
]
