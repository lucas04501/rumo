---
name: Rumo
description: Metas, hábitos e o mês como uma viagem. O dia é uma maré que sobe.
colors:
  abyss: "#050809"
  sea-1: "#0b1113"
  sea-2: "#121a1d"
  sea-3: "#1a2529"
  water-1: "#0a2a2e"
  water-2: "#0d3a3e"
  water-3: "#114a4e"
  wash-mid: "#125059"
  wash: "#1a6f76"
  foam: "#f3f8f7"
  mist: "#aebdc0"
  haze: "#7d8e92"
  tide: "#2fd6bd"
  tide-ink: "#03211f"
  sun: "#ffb23e"
  chart-task: "#5a8dff"
  chart-focus: "#ff5c8a"
  chart-workout: "#b692ff"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "42px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
  body:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
  body-small:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  label:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
rounded:
  control: "12px"
  toast: "14px"
  sheet: "16px"
  round: "999px"
spacing:
  gutter: "20px"
  gutter-wide: "40px"
  row: "56px"
components:
  button-primary:
    backgroundColor: "{colors.tide}"
    textColor: "{colors.tide-ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 18px"
  button-primary-hover:
    backgroundColor: "#5be6d1"
  button-ghost:
    textColor: "{colors.foam}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  field:
    backgroundColor: "{colors.abyss}"
    textColor: "{colors.foam}"
    rounded: "{rounded.control}"
    height: "52px"
    padding: "0 14px"
  sheet:
    backgroundColor: "{colors.sea-1}"
    textColor: "{colors.foam}"
    rounded: "{rounded.sheet}"
  toast:
    backgroundColor: "{colors.abyss}"
    textColor: "{colors.sun}"
    rounded: "{rounded.toast}"
---

# Design System: Rumo

## Overview

**Creative North Star: "A Maré do Dia"**

O dia é uma maré. A água sobe a cada item concluído, e o progresso se sente em um lugar só, a faixa do topo da tela Hoje. O resto do app é a noite no mar: fundo quase preto, texto forte e nada atrás da leitura.

O sistema é calmo na repetição e grande nos raros momentos de chegada. Quem abre o app várias vezes ao dia, com uma mão, muitas vezes à noite, precisa de marcar rápido e de ler sem esforço.

Recusa os anéis de progresso e os cartões de estatística comuns nessa categoria.

**Key Characteristics:**

- Tema único, escuro, com fundo quase preto.
- A identidade de viagem fica concentrada: faixa da maré, rota, barco e onda dos grandes momentos.
- Cor com significado: teal age, âmbar recompensa, e nos gráficos cada coisa tem a sua cor.
- Listas abertas no celular. No computador, painéis separados por um passo de tom.
- Movimento proporcional à raridade do momento.

## Colors

Preto azulado, com um teal vivo para agir e um âmbar guardado para recompensar.

### Primary

- **Teal Maré** (`tide`): ação e progresso. Botão principal, check concluído, aba ativa, rota percorrida, campo em foco e gráficos de hábitos e de andamento do dia.
- **Tinta Funda** (`tide-ink`): texto e traço sobre o teal.

### Secondary

- **Âmbar Sol** (`sun`): só recompensa. XP subindo, barra de patente, avisos de vento, marco e patente, medalhas ganhas, sequência marcante, destino da rota e texto "Dia perfeito".

### Chart

Só dentro de gráficos, e a cor segue a coisa medida, em qualquer tela.

- **Azul Tarefa** (`chart-task`): tarefas concluídas.
- **Rosa Foco** (`chart-focus`): tempo de foco.
- **Roxo Treino** (`chart-workout`): frequência e carga dos treinos. Passa nos pares vizinhos, e nunca divide o plano com o azul, com quem se confunde em daltonismo.
- Hábitos e andamento do dia usam `tide`. XP usa `sun`. A água bebida também usa `tide`, porque bater a meta é concluir um hábito.
- A carta de consistência é uma rampa de uma cor só: `#115a53`, `#16806f`, `#20a892` e `tide`.

Validação com `validate_palette.js`, sobre `#0a0f11`, em todos os pares: daltonismo com ΔE 8,8, visão normal com ΔE 23 e contraste de pelo menos 3:1. A rampa passa em `--ordinal`. O teste de faixa de claridade reprova as quatro cores porque ele pede até 0,67, e elas vão de 0,69 a 0,82. É uma escolha: cumprir esse limite apagaria as cores, e o pedido é de gráfico forte em fundo quase preto. Texto nunca usa cor de gráfico.

### Neutral

- **Abismo** (`abyss`): fundo do app, navegação, campos e avisos.
- **Mar 1, 2 e 3** (`sea-1`, `sea-2`, `sea-3`): degraus de superfície. O primeiro é painel, coluna e folha. O segundo é cartão e item ativo da navegação. O terceiro é seleção e fantasma do arraste.
- **Água** (`water-1`, `water-2`, `water-3`): as camadas da maré. Só existem na faixa da Hoje, no foco, no login, na onda e no copo da tela de Água, aprovado pelo Lucas em 2026-11-04. No copo, nenhum texto fica por cima: os números ficam acima dele.
- **Onda** (`wash-mid`, `wash`): camadas da onda em tela cheia.
- **Espuma** (`foam`): texto principal.
- **Névoa** (`mist`): texto secundário e ícones em repouso, 10:1 sobre o fundo.
- **Bruma** (`haze`): o mínimo legível, 5,5:1 sobre painel. Item concluído, dia sem marca e medalha ainda não ganha.
- Linhas usam `line` (espuma a 10%) entre itens e `line-strong` (espuma a 20%) em campos e botões secundários.

### Named Rules

**The Sun Rule.** Âmbar é só recompensa. Se a cor aparece em algo que não foi conquistado, ela perde o sentido. Excluir, alertar ou decorar nunca usa âmbar.

**The Clean Reading Rule.** Nada se mexe atrás de texto de leitura. A maré fica na sua faixa e o foco tem pouco texto, com contraste medido.

**The Legible Sunset Rule.** O texto mantém 4,5:1 com a maré cheia, medido nos pixels. O sol tem o centro no canto da faixa, longe do texto.

## Typography

**Display Font:** Bricolage Grotesque Variable (com ui-sans-serif e system-ui)
**Body Font:** Figtree Variable (com ui-sans-serif e system-ui)

**Character:** Bricolage dá calor e personalidade aos títulos e às frases do dia. Figtree fica discreta e legível na lista. As duas são auto-hospedadas, para funcionar sem internet.

### Hierarchy

- **Display** (saudação da tela Hoje): 38 px, 44 px no computador. Só uma por tela.
- **Headline** (título das outras telas).
- **Title** (título de seção). Folhas usam 24 px no título.
- **Frase do dia** (Bricolage, 17 px, peso 500, em névoa): sempre em até duas linhas em 320 px.
- **Body** (itens, parágrafos e campos): peso 450 nos itens de lista, porque texto claro sobre preto parece mais fino. Limite de 42 a 52 caracteres por linha nos textos corridos.
- **Body Small** (contagens, datas, prévias e ajuda).
- **Label** (abas da navegação no celular).

### Named Rules

**The 16px Field Rule.** Campo de digitação nunca tem menos de 16 px. Abaixo disso, o iPhone aproxima a tela ao focar.

**The Tabular Rule.** Figtree usa números tabulares em todo o app, para que XP, datas e contagens não dancem ao mudar. A exceção é o número grande da Evolução, proporcional, porque dígitos de largura igual ficam frouxos nesse tamanho.

## Layout

Coluna única no celular, com margem lateral de 20 px, que cresce sob o notch com o aparelho deitado. A partir de 1024 px, a navegação vira coluna lateral de 224 px, e o conteúdo vai a até 1024 px com margem de 40 px. Hoje e Quadro vão a até 1280 px.

A Hoje é o painel geral: dois painéis a partir de 1024 px e três a partir de 1280 px, com hábitos, tarefas, meta e semana. No celular, a mesma ordem vira uma coluna aberta, com hábitos e tarefas antes da meta, porque marcar é o trabalho principal da tela. Meta, Notas, Mês, Evolução e Conquistas usam duas colunas no computador. Hábitos e Metas ficam em uma coluna de até 672 px, e o título acompanha essa largura.

O app é uma tela só: altura em `dvh`, com rolagem dentro da área principal e das folhas. A página nunca rola.

Linhas de lista têm ao menos 56 px, e alvos de toque têm 44 px. A exceção são as células do calendário em telas estreitas, que dividem a largura em sete colunas.

## Elevation & Depth

O sistema é plano. A profundidade vem de um passo de tom: fundo, painel e cartão. Folhas ficam em `sea-1` sobre um véu escuro, e avisos em `abyss` com borda fina.

Há duas sombras no app: o brilho do sol na onda de tela cheia, que faz parte desse momento, e a do fantasma do cartão, porque ele está de fato acima de tudo enquanto é arrastado. O botão de criar tem um anel da cor do fundo, sem sombra.

## Shapes

Cantos suaves em tudo o que é controle e cartão (12 px), um pouco mais em avisos (14 px), e 16 px em painéis, faixa da maré e folhas (só em cima no celular). Círculos ficam para check, dia da semana, estações da rota, medalhas e o botão de criar. A forma orgânica vem das cristas e da rota ondulada, nunca dos controles.

## Components

### Buttons

- **Primary:** teal cheio, usado em uma ação por vez. Aperta para 97% ao toque.
- **Ghost:** borda fina de espuma, sem preenchimento. Para ações secundárias, como Vincular e Nova nota dentro de uma meta.
- **Icon:** 44 × 44, em névoa.
- **Link:** texto em névoa sublinhado, para ações raras como Excluir e Desfazer.
- **Toque:** todo controle responde enquanto o dedo está na tela. Os que não têm mola própria ficam a 60% de opacidade.
- **Hover:** só em dispositivos com mouse.

### Inputs / Fields

- **Style:** fundo `abyss`, borda de espuma a 16% e 52 px de altura.
- **Focus:** borda teal. Cursor e seleção de texto também são teal.
- **Inline:** adicionar tarefa fica na própria lista, sem caixa, com um ícone de mais.

### Navigation

Cinco abas no rodapé do celular, sobre `abyss`, com a marca teal deslizando até a aba ativa: Hoje, Hábitos, Metas, Plano e Mais. Plano reúne Mês, Semana e Quadro, em `/mes`, `/semana` e `/quadro`, com um seletor na largura toda, no topo. A tarefa da Hoje e a lista de Mais também levam ao Quadro. Mais reúne Buscar, Quadro, Treinos, Rotina, Evolução, Conquistas, Notas, Foco e Ajustes, e fica ativa nessas telas. Item sem tela pronta não entra nela. No computador, vira coluna lateral com Criar e Buscar no topo e todas as áreas direto na lista, com o item ativo em `sea-2`.

### Create

Um ponto só para criar qualquer coisa de qualquer tela: botão redondo acima das abas no celular, Criar na coluna lateral e a tecla `N` no computador. A folha abre com o campo da adição rápida, que salva tarefa ou repetição. Hábito, Meta, Nota, Repetição, Passo da rotina e Ficha de treino abrem a folha de sempre, com o texto já escrito. O botão some no foco e no modo treino, para não disputar com o que está acontecendo.

### Search

`Ctrl K`, `Cmd K` ou `/` no computador, e Buscar em Mais no celular. Procura em tarefas, hábitos, metas, repetições, fichas e notas, sem diferenciar acento, e leva às telas. A última linha cria com o texto digitado. Abre e fecha sem animação, porque atalho de teclado se repete muitas vezes ao dia. Atalhos não valem dentro de campos nem com folha aberta.

### Sheets

Folha inferior no celular e janela central de 460 px no computador, com o `<dialog>` nativo cuidando de foco e Esc. Abre em 320 ms e fecha em 200 ms. Fecha também tocando fora.

### Item Row

Check redondo, ícone opcional, título e informação à direita. Ao concluir: mola no check, ondulação, XP subindo em âmbar, som curto e maré subindo. Item concluído fica em `haze`, riscado. Nada disso bloqueia o próximo toque.

Na tarefa, a marca de prioridade fica antes do título: bandeira cheia em espuma para alta, seta em névoa para baixa, nada para normal. Prioridade não é ação nem recompensa, então não usa teal nem âmbar. À direita ficam a palavra Fazendo em teal, o ícone de repetição, a contagem de subtarefas e o botão de detalhes, que abre a folha com prioridade, andamento, data, subtarefas, repetição e excluir.

Deslizar a linha para a direita conclui, pelo mesmo caminho do check. Para a esquerda, adia para amanhã, ou pula quando a tarefa repete. Vale passar de 96 px ou um toque rápido. Abaixo disso, a linha volta sem agir.

A adição rápida da Hoje lê data, prioridade e repetição no fim do texto ("pagar luz sexta !alta") e mostra chips do que entendeu antes de salvar, com a opção Ignorar. Só no fim do texto, para "Segunda via do boleto" continuar sendo um título.

### Board

Três colunas fixas: A fazer, Fazendo e Feito. Mostra o dia, os atrasos, os próximos 7 dias e o que foi concluído nos últimos 7. Hoje vem primeiro, depois o atraso mais recente e os próximos dias. Dentro disso, a prioridade ordena: não há ordem manual. A fazer se divide em blocos com título discreto em névoa: Hoje, Atrasadas, Amanhã e Próximos dias, cada um só quando tem cartão. No topo de A fazer, um campo cria a tarefa para hoje com a mesma leitura rápida da Hoje.

O cartão mostra título, dia, prioridade, repetição e a meta ligada. Com subtarefas, ganha a barra fina e a conta "1/3". Em A fazer, um botão de começar leva o cartão para Fazendo com um toque.

Todo cartão tem uma alça visível à direita. Tocar nela abre "Mover para", e arrastar por ela começa na hora, sem rolar a tela. Nenhum caminho depende de gesto escondido, e uma frase sob o seletor explica isso no celular. Depois de mover, um aviso diz para onde o cartão foi e oferece Desfazer.

No computador, as colunas ficam lado a lado em `sea-1`, e arrastar começa ao mover o mouse. No celular, o seletor mostra uma coluna por vez, e arrastar abre três alvos grandes acima das abas. O corpo do cartão também arrasta depois de segurar por 220 ms, e deslizar sem segurar rola a tela. O fantasma acompanha o dedo, um pouco inclinado, e Esc cancela.

Concluir no quadro passa pelo mesmo caminho do check: som, vibração e XP em âmbar. O XP vem dos dados, então mover não conta duas vezes.

### Day Sheet

A folha do dia é o relatório daquele dia: resumo com barra fina e XP, frases, hábitos, tarefas, rotina, foco, metas, notas editadas e a nota do dia. Cada bloco só aparece se tiver algo a dizer. No calendário, ponto cheio é anotação e ponto vazado é foco.

### Routine

Sete dias de segunda a domingo, cada um com a sua lista. Um ponto mostra quais dias têm passos. Horário à esquerda, em névoa, e em teal no passo de agora. Só o dia de hoje tem check. Rotina não dá XP nem sobe a maré, porque ela guia o dia e já há hábitos para medir. Copiar de outro dia é o atalho para montar a semana.

### Undo Toast

Aviso neutro no rodapé por 5 s, em `abyss` com borda de espuma e Desfazer em teal, porque desfazer é ação, e não recompensa. Aparece ao excluir, pular, adiar e mover. Entra dentro da folha do topo, porque um `<dialog>` modal deixa o resto da página sem resposta ao toque.

### Charts

A cor segue a coisa medida, como descrito em Chart. Marca fina e cor cheia: linha de 2,5 px, colunas de até 24 px com cantos de 4 px em cima, e área com lavagem de 34% a 0. A coluna selecionada ganha uma tampa em espuma. Sem cartões de estatística: números em lista aberta com linhas finas, e um único número grande por tela. A maré do período usa curva com média móvel nos períodos longos, e a legenda diz isso. Tocar lê o valor em uma linha acima do gráfico, sem balão, e abre o dia. Quando não há dados, a seção some ou diz o que falta, e nunca mostra zero como se fosse resultado.

### Water

A primeira vez é guiada, em três passos: meta (digitada ou calculada a 35 ml por kg, sem salvar o peso), copo de sempre e hábito ligado. Depois, o número do dia e o copo de água enchendo, com os botões de copo e garrafa logo abaixo, a lista do dia com Desfazer e as colunas dos últimos 7 dias em `tide`. Cada copo é discreto: vibração e uma nota que sobe a cada copo do dia. A festa é só ao bater a meta, que marca o hábito ligado e dá o XP dele. Na Hoje, uma linha com a barra fina e um botão de somar o copo.

### Focus

Uma tarefa, um relógio e dois botões. No celular, a navegação some enquanto há um bloco. O relógio usa Figtree com números tabulares, para não dançar a cada segundo, e tem de 76 a 112 px. Esta é a única tela do app logado com maré cheia na tela toda, porque ali ela é o medidor do bloco: sobe durante o foco e desce na pausa. Sem âmbar: foco não dá XP.

### Reward Toast

Aviso no rodapé por 3,2 s, com título em âmbar: vento a favor, marco, patente e conquista. Um por vez, em fila, esperando a onda e o barco.

### Medals

Conquistas em lista aberta, por grupo: sequência, dias perfeitos, hábitos, tarefas, foco, marcos e metas. Medalha ganha fica em âmbar, com ícone e anel. Medalha que falta fica em `haze`, com contagem e barra teal. A animação toca uma vez, no aviso: uma mola curta na medalha, com o som de chegada. O que já estava alcançado ao atualizar o app ou chegou de outro aparelho entra em silêncio. Medalha ganha não se perde.

### Workouts

A tela Treinos abre com o que importa hoje: continuar, começar ou recuperação. Depois vêm fichas, histórico, calendário, frequência e maiores cargas. No calendário, cheio é treino feito, tracejado é planejado e vazio é recuperação. Dia passado sem treino fica vazio: o calendário não cobra o que já foi.

O modo treino é para uma mão, com a tela acesa e sem navegação no celular. Um exercício fica aberto de cada vez, e a série da vez ocupa a tela: botões de 56 px para repetições e carga, com passo de 2,5 kg, e Série feita em teal. O valor já vem preenchido com a série anterior, o último treino ou a ficha. O próximo exercício abre sozinho. O descanso fica fixo no topo enquanto a tela rola, conta pelo horário do fim e toca o som de fim do foco.

Recorde é recompensa, então usa âmbar: a palavra Recorde na série e um aviso ao finalizar.

### Tide, Route, WaveWash

Os elementos de assinatura. A maré mora na faixa de 104 px da tela Hoje, com crista baixa e o sol no canto, e o texto do dia em cima. O login e o foco a usam em tela cheia, sem lista por trás. A rota é uma linha ondulada com estações, horizontal na tela Hoje e vertical no detalhe da meta, e o barco deixa um check para trás. A onda cobre a tela só em Dia perfeito e Meta concluída, em cerca de 3 s, e fecha com um toque.

## Do's and Don'ts

### Do:

- **Do** deixar o que acontece muitas vezes ao dia discreto, e guardar a onda para os grandes momentos.
- **Do** animar `transform` e `opacity`, usando as curvas `--ease-out` e `--ease-drawer`.
- **Do** manter a troca de aba em cerca de 160 ms e a resposta de toque em até 160 ms.
- **Do** respeitar `prefers-reduced-motion`: fica o que explica, sai o que só balança.
- **Do** respeitar as áreas seguras do aparelho em tudo o que encosta nas bordas da tela.
- **Do** garantir 4,5:1 com a maré cheia, não só com a tela vazia.
- **Do** usar `lg:hidden` só em elementos sem classe própria de `display`: o CSS de `voyage.css` fica fora das camadas do Tailwind e vence a classe.

### Don't:

- **Don't** usar âmbar fora de recompensa, nem teal em decoração.
- **Don't** colocar maré, sol ou gradiente atrás de texto de leitura.
- **Don't** criar cor nova de gráfico sem rodar o validador.
- **Don't** usar anéis de progresso, cartões de estatística ou cartões dentro de cartões.
- **Don't** usar a onda em tela cheia para transições comuns. Em um app aberto todo dia, isso cansa e atrasa.
- **Don't** colocar `:hover` sem `@media (hover: hover) and (pointer: fine)`.
- **Don't** bloquear o zoom da página.
- **Don't** depender só de som ou vibração para confirmar algo.
