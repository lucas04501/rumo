---
version: 1
slug: "src-screens-hoje-tsx"
primary_target: "src/screens/Hoje.tsx"
related_targets: ["src/App.tsx"]
---

Escopo: casca do app e tela Hoje. Modo: Operate.
Público: usuário único, uso rápido com uma mão, várias vezes ao dia, muitas vezes à noite.
Tarefa: ver o que falta hoje, marcar, sentir o avanço.
Restrições: tema único escuro; alvos de toque confortáveis; contraste de leitura sobre o fundo animado; `prefers-reduced-motion`.
Direção: fixada pelo usuário (vídeo de referência + opção "Jornada completa"), sem sorteio de conceito.
Momento memorável: a água sobe atrás da lista a cada conclusão, até a maré cheia.
Em aberto: aprovação da sensação pelo usuário no checkpoint da etapa 2.

## Direction contract

THESIS: O dia é uma maré. A água sobe atrás da lista a cada item concluído, e o progresso se sente no ambiente, não em um medidor. Recusa os anéis de progresso, os cards de estatística e o painel de números que a categoria sempre entrega.

OWN-WORLD: Mar ao anoitecer. Fundo azul-petróleo quase preto, três camadas opacas de água com linha fina de crista. Teal para ação e progresso; âmbar somente para recompensa. Bricolage Grotesque na voz de título, Figtree na interface. Controles padrão, sem fantasia náutica: botões, checkboxes, abas, inputs.

STORY: Abre o app e sabe na hora quanto falta. Marca um item e vê a água subir, ouve uma nota mais aguda que a anterior e recebe XP. Conclui um marco e o barco navega até a estação. Fecha o dia e a onda cobre a tela.

FIRST VIEWPORT: Topo com marca à esquerda e patente, XP e barra de nível à direita. Saudação grande. Data e "Faltam N para a maré cheia". Frase rotativa. Meta em foco com título, dias restantes, rota com barco e botão Concluir do próximo marco. Depois a lista de hábitos. Navegação inferior com cinco abas. A maré ocupa a tela inteira, atrás de tudo; o sol fica no canto superior direito.

FORM: Forma fixada pelo usuário, primeira e única da lista; sem seed key, pois não houve sorteio. Interação de assinatura: maré em tela cheia ligada ao progresso do dia. Gramática de movimento: deriva lenta e constante em CSS, subida com mola, travessia do barco com ease-in-out longo, onda de dia perfeito só uma vez por dia.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
