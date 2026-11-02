# Decisões

Registro do que foi decidido, por quem e por quê. Última revisão: 2026-11-02.

## Decididas pelo Lucas

- Nome: Rumo.
- Conceito: jornada completa. Meta é rota, marco é estação, o dia é uma maré.
- Banco: Neon, porque o plano gratuito do Supabase já está ocupado por 2 apps.
- Planner: cada dia tem tarefas, nota e marca de concluído.

## Propostas e aprovadas no plano

| Tema | Escolha | Motivo |
|---|---|---|
| Frontend | Vite + React + TypeScript | App interativo atrás de login. SSR não ajuda, e uma SPA tem o caminho mais simples para offline. |
| API | Hono em Vercel Function, no mesmo domínio | O Neon é só banco. O Hono é pequeno e portátil se trocarmos de host. |
| Login | Better Auth auto-hospedado, e-mail e senha | Ver "Por que não o Neon Auth". |
| Banco | Neon + Drizzle, região São Paulo | Branch `dev` para testes, `main` para dados reais. |
| Dados no cliente | TanStack Query com cache em IndexedDB e fila | Toque responde na hora, mesmo offline. |
| Animação | Motion, uma biblioteca só | Cobre molas e transições. O barco é posicionado por geometria própria. |
| Estilo | Tailwind v4 com tokens | Paleta centralizada em `src/styles/tokens.css`. |
| PWA | `vite-plugin-pwa` | Shell pré-cacheado: o app abre mesmo com o banco dormindo. |
| Hospedagem | Vercel Hobby agora | Hobby é só para uso não comercial. Ao cobrar, mudar para Pro ou migrar. |

### Por que não o Neon Auth + Data API

Em 2026-11-02, a documentação do Neon dizia que:

1. Qualquer pessoa pode se cadastrar; restringir cadastros ainda "vem aí".
2. O cookie de sessão usa `SameSite=None`. A documentação não confirma o domínio nem cita Safari, mas se for o domínio do Neon, tende a ser bloqueado no iPhone (inferência).
3. Plugins próprios não são suportados, e a Stripe não aparece na lista.
4. A Data API não tem camada de permissão própria: uma política esquecida expõe a tabela.

Com API própria no mesmo domínio, o cookie é primário e o cadastro pode ser fechado. O custo é escrever as rotas.

### Por que não Cloudflare Workers

O limite de CPU por requisição do plano gratuito é arriscado para hash de senha.

## Decisões de produto e design

- **Hábito é uma linha só**, com os dias da semana. Nada é gerado por dia. É isso que atende "criar uma vez".
- **Datas são dias locais**, para que um check às 22h no Brasil não caia no dia seguinte.
- **IDs são gerados no cliente** e as escritas são idempotentes, para a fila offline poder repetir sem duplicar.
- **XP é derivado dos dados.** O bônus "vento a favor" vem de um hash de hábito e data, então desmarcar e remarcar não rende XP extra.
- **Sequência conta só dias programados** e tem uma âncora: uma falta a cada 7 dias não quebra.
- **A onda fica para os grandes momentos.** No vídeo ela aparece em toda transição; em um app aberto todo dia isso cansaria. Abas trocam em cerca de 150 ms.
- **A maré é a tela inteira**, não um medidor: a água sobe atrás da lista a cada item concluído.
- **Paleta:** âmbar só em recompensa, para funcionar como sinal de conquista.

## Dúvidas abertas

- A sensação do núcleo visual aguarda aprovação no checkpoint da etapa 2. A revisão final de design e o `DESIGN.md` ficam para depois dela, porque a direção ainda pode mudar.
- O aparelho principal é mesmo um iPhone? O vídeo sugere que sim. Afeta só o háptico.
- A região `gru1` da Vercel está disponível no plano Hobby? Conferir no deploy da etapa 3.
- Vite + Hono na mesma Vercel não tem guia oficial exato. O deploy de teste da etapa 3 valida isso.
