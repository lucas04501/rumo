---
name: Rumo
description: Metas, hábitos e o mês como uma viagem. O dia é uma maré que sobe.
colors:
  abyss: "#06161c"
  sea-1: "#0a2630"
  sea-2: "#0c2f39"
  sea-3: "#0f3843"
  wash-mid: "#125059"
  wash: "#1a6f76"
  foam: "#e9f3f1"
  mist: "#9db6ba"
  tide: "#4fd8c4"
  tide-ink: "#052a29"
  sun: "#f6b25e"
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
    backgroundColor: "#6ce3d1"
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

O dia é uma maré. A água sobe atrás da lista a cada item concluído, e o progresso se sente no ambiente, não em um medidor. A tela inteira é o mar ao anoitecer: céu escuro, três camadas de água, um sol de pôr do sol no canto. A interface fica leve por cima disso, com listas sem cartão e poucos controles preenchidos.

O sistema é calmo na repetição e grande nos raros momentos de chegada. Quem abre o app várias vezes ao dia, com uma mão, muitas vezes à noite, precisa de marcar rápido e de um ambiente que recompense sem cansar.

Recusa os anéis de progresso e os cartões de estatística comuns nessa categoria.

**Key Characteristics:**

- Tema único, escuro.
- Progresso mostrado pelo ambiente: maré, sol e barco.
- Cor com significado: teal age, âmbar recompensa.
- Listas abertas, separadas por linhas finas, sem cartões.
- Movimento proporcional à raridade do momento.

## Colors

Azul-petróleo quase preto, com um teal vivo para agir e um âmbar guardado para recompensar.

### Primary

- **Teal Maré** (`tide`): ação e progresso. Botão principal, check concluído, aba ativa, rota percorrida e campo em foco.
- **Tinta Funda** (`tide-ink`): texto e traço sobre o teal.

### Secondary

- **Âmbar Sol** (`sun`): só recompensa. XP subindo, barra de patente, avisos de vento, marco e patente, sequência marcante, destino da rota e texto "Dia perfeito".

### Neutral

- **Abismo** (`abyss`): céu, fundo do app, navegação, campos e avisos.
- **Mar 1, 2 e 3** (`sea-1`, `sea-2`, `sea-3`): as três camadas de água. O primeiro é também o fundo das folhas, e o terceiro marca o item ativo do seletor.
- **Onda** (`wash-mid`, `wash`): camadas da onda em tela cheia.
- **Espuma** (`foam`): texto principal. A 70% de opacidade, item concluído.
- **Névoa** (`mist`): texto secundário e ícones em repouso.
- Linhas e bordas usam espuma com pouca opacidade: 8% entre itens, de 16% a 22% em campos e botões secundários.

### Named Rules

**The Sun Rule.** Âmbar é só recompensa. Se a cor aparece em algo que não foi conquistado, ela perde o sentido. Excluir, alertar ou decorar nunca usa âmbar.

**The Legible Sunset Rule.** O texto sobre o sol e sobre a maré cheia mantém 4,5:1. Por isso o sol tem o centro no canto da tela e um tom mais laranja: com o mesmo destaque visual, ele clareia menos que um amarelo.

## Typography

**Display Font:** Bricolage Grotesque Variable (com ui-sans-serif e system-ui)
**Body Font:** Figtree Variable (com ui-sans-serif e system-ui)

**Character:** Bricolage dá calor e personalidade aos títulos e às frases do dia. Figtree fica discreta e legível na lista. As duas são auto-hospedadas, para funcionar sem internet.

### Hierarchy

- **Display** (saudação da tela Hoje): cresce para 56 px no computador. Só uma por tela.
- **Headline** (título das outras telas).
- **Title** (título de seção). Folhas usam 24 px no título.
- **Frase do dia** (Bricolage, 21 px, peso 500, altura 1,3): sempre em até duas linhas em 320 px.
- **Body** (itens, parágrafos e campos): limite de 42 a 52 caracteres por linha nos textos corridos.
- **Body Small** (contagens, datas, prévias e ajuda).
- **Label** (abas da navegação no celular).

### Named Rules

**The 16px Field Rule.** Campo de digitação nunca tem menos de 16 px. Abaixo disso, o iPhone aproxima a tela ao focar.

**The Tabular Rule.** Figtree usa números tabulares em todo o app, para que XP, datas e contagens não dancem ao mudar.

## Layout

Coluna única no celular, com margem lateral de 20 px, que cresce sob o notch com o aparelho deitado. A partir de 1024 px, a navegação vira coluna lateral de 224 px, e o conteúdo vai a até 1024 px com margem de 40 px.

Hoje, Meta, Notas e Mês usam duas colunas no computador, na proporção 5 para 4, com 64 px entre elas. Hábitos e Metas ficam em uma coluna de até 672 px, e o título acompanha essa largura.

O app é uma tela só: altura em `dvh`, com rolagem dentro da área principal e das folhas. A página nunca rola.

Linhas de lista têm ao menos 56 px, e alvos de toque têm 44 px. A exceção são as células do calendário em telas estreitas, que dividem a largura em sete colunas.

## Elevation & Depth

O sistema é plano. A profundidade vem das camadas de água e do contraste de tom entre fundo e folha. Folhas ficam em `sea-1` sobre um véu escuro, e avisos em `abyss` com borda âmbar fina.

A única sombra do app é o brilho do sol na onda de tela cheia. Ela faz parte desse momento, não é um recurso de interface.

## Shapes

Cantos suaves em tudo o que é controle (12 px), um pouco mais em avisos (14 px) e folhas (16 px, só em cima no celular). Círculos ficam para check, dia da semana e estações da rota. A forma orgânica vem das cristas e da rota ondulada, nunca dos controles.

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

Cinco abas no rodapé do celular, sobre `abyss`, com a marca teal deslizando até a aba ativa: Hoje, Hábitos, Metas, Mês e Mais. A aba Mais reúne Notas, Foco e Ajustes, e fica ativa nessas telas. Item sem tela pronta não entra nela. No computador, vira coluna lateral com a marca vertical, com Notas, Foco e Ajustes direto na lista.

### Sheets

Folha inferior no celular e janela central de 460 px no computador, com o `<dialog>` nativo cuidando de foco e Esc. Abre em 320 ms e fecha em 200 ms. Fecha também tocando fora.

### Item Row

Check redondo, ícone opcional, título e informação à direita. Ao concluir: mola no check, ondulação, XP subindo em âmbar, som curto e maré subindo. Nada disso bloqueia o próximo toque.

Na tarefa, a marca de prioridade fica antes do título: bandeira cheia em espuma para alta, seta em névoa para baixa, nada para normal. Prioridade não é ação nem recompensa, então não usa teal nem âmbar. À direita ficam o ícone de repetição, a contagem de subtarefas e o botão de detalhes, que abre a folha com prioridade, subtarefas, repetição e excluir.

### Focus

Uma tarefa, um relógio e dois botões. No celular, a navegação some enquanto há um bloco. O relógio usa Figtree com números tabulares, para não dançar a cada segundo, e tem de 76 a 112 px. Nesta tela, a maré mede o bloco: sobe durante o foco e desce na pausa. Sem âmbar: foco não dá XP.

### Reward Toast

Aviso no rodapé por 3,2 s, com título em âmbar: vento a favor, marco e patente. Um por vez, em fila, esperando a onda e o barco.

### Tide, Route, WaveWash

Os elementos de assinatura. A maré ocupa a tela inteira atrás do conteúdo. A rota é uma linha ondulada com estações, horizontal na tela Hoje e vertical no detalhe da meta, e o barco deixa um check para trás. A onda cobre a tela só em Dia perfeito e Meta concluída, em cerca de 3 s, e fecha com um toque.

## Do's and Don'ts

### Do:

- **Do** deixar o que acontece muitas vezes ao dia discreto, e guardar a onda para os grandes momentos.
- **Do** animar `transform` e `opacity`, usando as curvas `--ease-out` e `--ease-drawer`.
- **Do** manter a troca de aba em cerca de 160 ms e a resposta de toque em até 160 ms.
- **Do** respeitar `prefers-reduced-motion`: fica o que explica, sai o que só balança.
- **Do** respeitar as áreas seguras do aparelho em tudo o que encosta nas bordas da tela.
- **Do** garantir 4,5:1 com a maré cheia, não só com a tela vazia.

### Don't:

- **Don't** usar âmbar fora de recompensa, nem teal em decoração.
- **Don't** usar anéis de progresso, cartões de estatística ou cartões dentro de cartões.
- **Don't** usar a onda em tela cheia para transições comuns. Em um app aberto todo dia, isso cansa e atrasa.
- **Don't** colocar `:hover` sem `@media (hover: hover) and (pointer: fine)`.
- **Don't** bloquear o zoom da página.
- **Don't** depender só de som ou vibração para confirmar algo.
