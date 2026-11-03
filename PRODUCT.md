# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegado ao Claude e aprovado no plano: Vite + React + TypeScript, Tailwind v4 e Motion no cliente; Hono, Better Auth e Drizzle sobre Neon no servidor; hospedagem na Vercel. Os motivos estão em `docs/decisoes.md`.

## Users

Lucas, em uso pessoal, no celular e no computador, com os mesmos dados nos dois. O cadastro é aberto. Depois vem a assinatura de R$ 14,90 por mês, com 7 dias grátis.

O trabalho a fazer: decidir o que importa, repetir isso todo dia e sentir que está avançando.

## Product Purpose

Rumo reúne metas com prazo, hábitos diários, um planner do mês, frases de motivação e anotações em um só lugar. Sucesso é o usuário querer abrir o app e concluir o dia, e conseguir ver o mês inteiro de relance.

## Positioning

A sua vida como uma viagem. Cada meta é uma rota, cada marco é uma estação, o dia é uma maré que sobe. O progresso não é um número em uma lista: é um lugar para onde você está indo.

## Operating Context

Uso rápido e repetido, várias vezes ao dia, com uma mão, muitas vezes à noite. Marcar um hábito precisa ser imediato, com ou sem internet. Sessões mais longas acontecem ao planejar o mês ou escrever uma nota.

## Capabilities and Constraints

- Hábito é criado uma vez e vale para os dias da semana escolhidos; o checklist diário sai dele.
- Cada dia do planner tem tarefas, nota e marca de concluído. O dia é marcado sozinho ao chegar a 100%, e pode ser marcado ou desmarcado à mão.
- Dados pertencem a um usuário desde o início (`user_id` em toda tabela), para virar multi-tenant sem migração.
- Tema único, escuro.
- Interface em português do Brasil.
- Fora da v1: notificações, frases próprias, modo claro, Markdown nas notas, insights com IA, cobrança.

## Brand Commitments

- Nome: Rumo.
- Referência visual: Reel "Dashboard Animation", de @_code_and_chill_. Inspira a linguagem (rota com barco, ondas, brilho de pôr do sol), sem copiar marca nem layout.
- Tom: direto, caloroso, em português natural. Frases sem autor atribuído.

## Evidence on Hand

Não há dados reais nem depoimentos. Tudo o que a interface mostra nas etapas iniciais é demonstração, em `src/data/demo.ts`, e deve ser substituído pelos dados do usuário.

## Product Principles

1. **A recompensa vem de concluir de verdade.** Nada premia abrir o app ou fazer e desfazer.
2. **Criar uma vez, usar sempre.** Configurar nunca pode dar mais trabalho que cumprir.
3. **Um deslize não apaga a viagem.** Faltar um dia não destrói o progresso.
4. **Toque responde na hora.** Rede e banco nunca fazem o usuário esperar.
5. **Calmo no dia a dia, grande nos grandes momentos.** O que se repete muito fica discreto; a festa fica para o raro.

## Accessibility & Inclusion

Respeitar `prefers-reduced-motion`, manter contraste de leitura no fundo animado, garantir alvos de toque confortáveis e nunca depender só de som ou vibração.
