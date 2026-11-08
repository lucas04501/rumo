# Rumo

PWA de metas, hábitos, planner e treinos, em português do Brasil. Multi-usuário, com assinatura planejada e nenhum custo fixo de infraestrutura.

## Comandos

- `npm run dev`: app e API em desenvolvimento, acessível na rede local para testar no celular
- `npm test`: testes das funções puras (Vitest)
- `npm run test:server`: testes da API contra a branch `dev` do Neon
- `npm run build`: checagem de tipos e build de produção
- `npm run preview`: serve o build, com service worker ativo
- `npm run icons`: gera os ícones a partir de `public/logo.svg`
- `npm run db:generate`: gera a migração SQL a partir de `server/db/schema.ts`
- `npm run db:migrate`: aplica as migrações na branch do `.env`, que é sempre a `dev`

## Regras do projeto

- Datas são dias locais `YYYY-MM-DD`. Toda "data de hoje" vem de `hoje()` em `src/lib/dates.ts`. Nunca usar UTC nem `toISOString()` para data.
- XP e sequência são calculados a partir dos dados, em funções puras de `src/lib/`. Nunca são salvos.
- Toda escrita passa por `commit()` em `src/data/store.ts`: atualiza a foto local e entra na fila. Não chame a API direto de uma tela.
- Tarefas de um dia sempre vêm de `tasksOn()` ou `indexedTasks()`, nunca de `snapshot.tasks` direto: as ocorrências de regras recorrentes não têm linha até serem tocadas, e as puladas têm linha, mas não aparecem.
- Ocorrência recorrente nunca usa `DELETE`, porque a regra a recriaria. Pular grava `skippedAt`. Regra não é excluída nem reescreve o passado: encerra com `endDate`.
- Estatísticas são calculadas no aparelho, em `src/lib/evolution.ts`, a partir da foto. O período termina ontem: hoje ainda está em aberto. Frase de padrão só sai com amostra mínima.
- Ação destrutiva oferece Desfazer por `offerUndo()`, em `src/data/undo.ts`. O que não volta no servidor, como `DELETE`, só entra na fila em `expire`.
- Campo novo na foto precisa de tratamento em `complete()`, em `src/lib/snapshot.ts`, e teste com uma foto antiga de verdade.
- Depois de `npm run db:generate`, leia o SQL: o drizzle-kit coloca a unicidade de tabela existente depois das chaves estrangeiras que dependem dela.
- Offline se testa no build (`npm run build` e `npm run preview`), porque o service worker não roda em desenvolvimento. Teste também reabrir o app sem internet mais de uma vez.
- Ao fim de cada etapa: testar, atualizar o vault, publicar em produção e enviar ao GitHub. O repositório é público: nunca versione nada privado.
- Toda tabela do app tem `user_id NOT NULL` e toda rota filtra pelo usuário da sessão. A exceção é `rate_limit`, do Better Auth, que conta por IP antes de existir sessão. Vínculos entre tabelas usam chave estrangeira composta com `user_id`, para o banco recusar dado de outro usuário.
- Toda rota nova precisa de caso em `server/isolation.test.ts`.
- RLS é a segunda trava: toda consulta de rota do app roda em `db.batch([claim(userId), ...])`, como o papel `rumo_app`. Tabela nova com `user_id` precisa, na migração, de `GRANT`, RLS ligada e a política `dono`, como em `drizzle/0007_rls.sql`. Um teste recusa tabela sem isso. Só o Better Auth e `user` ficam de fora.
- `GET /api/health/rls` prova sem login que o papel funciona. Confira depois de todo deploy que mexa no banco.
- Nenhum custo fixo, por decisão do Lucas: nada de plano pago de hospedagem ou banco. A cobrança é de R$ 14,90 por mês pela Stripe, que só desconta taxa por venda. A Vercel Hobby não permite uso comercial, então o app roda na Netlify Free (`rumo-app.netlify.app`). A Vercel segue no ar só com a versão antiga, até o Lucas validar a Netlify. A cobrança está ligada em produção desde 2026-11-08: `BILLING_ENABLED` e `VITE_SHOW_PRICING` existem só no contexto Production da Netlify, com a chave restrita e o webhook da Stripe de produção (conta "Rumo"). Os outros contextos usam a Stripe de teste (conta de sandbox, separada). Mexer nessas chaves ou desligar a cobrança depende de autorização dele.
- Termos e privacidade em `src/content/legal.ts` precisam continuar verdadeiros: mudou provedor, preço ou o que é guardado, muda o texto. Eles descrevem o plano grátis, o Pro, a Stripe e a Netlify.
- Em `server/` e `api/`, imports relativos terminam em `.js`: a Vercel roda ESM sem empacotar. `schema.ts` fica em um arquivo só, porque o drizzle-kit não resolve esses imports.
- O `.env` aponta só para a branch `dev`. A conexão da branch principal não fica neste computador. Para migrar a principal, passe `DATABASE_URL` pelo ambiente, sem gravar em arquivo nem exibir. `vercel env run` não serve: a Vercel não libera valores do tipo Secret, e o CLI carrega o `.env`, então a migração cairia na `dev` dizendo sucesso. A conexão vem de `neonctl connection-string main`, guardada só em uma variável do comando. Confira que o endereço difere do `.env` antes de migrar. A migração vem antes do deploy, e a autorização do Lucas é pedida a cada vez.
- Testes nunca tocam a branch principal.
- Em produção, verificação é só leitura. Nunca confirme "cadastro fechado" tentando cadastrar: use `GET /api/signup-status`. Depois de um deploy, o endereço principal leva alguns segundos para apontar para a versão nova.
- Cadastro fechado por padrão no código (`ALLOW_SIGNUP`). Em produção, está aberto a qualquer pessoa desde 2026-11-02, por decisão do Lucas, ainda sem confirmação de e-mail. A recuperação de senha está no ar desde 2026-11-04 e envia pelo Gmail, com senha de app em `GMAIL_USER` e `GMAIL_APP_PASSWORD`, só na Vercel. Em produção, não teste pedindo link: isso envia e-mail de verdade. O limite de tentativas fica no banco, em `rate_limit`, e só liga em produção. Para fechar: remova a variável na Vercel e publique de novo.
- Deploy na Vercel (hospedagem antiga): `npx vercel deploy --prod --yes`. Autorizado pelo Lucas em 2026-11-02. Sem o `--prod`, o deploy vira pré-visualização.
- Plano: a regra é `server/plan.ts` (pura, sem imports), reexportada em `src/lib/plan.ts`. Os 7 dias grátis são a assinatura `trialing` da Stripe: só começam com cartão informado no checkout e só valem para quem nunca assinou. Nunca volte a contar teste por data de cadastro. `BILLING_ENABLED` desligado deixa todo mundo Pro. O grátis só tem Hábitos (3 ativos), Hoje e Metas: o resto (Plano e tarefas, Foco, Rotina, Notas, Água, Evolução, Conquistas, Treinos) é do Pro, e o que a pessoa já criou fica guardado, exportável e em leitura (criar/editar dá `402`, excluir é livre). A lista única das rotas do Pro é `PRO_PATHS`, em `server/plan.ts`: rota nova de área Pro entra nela, com o guard no servidor, e `commit()` em `src/data/store.ts` barra a mesma escrita no app via `needsPro()`. Sem reembolso depois da primeira cobrança: os 7 dias grátis são o prazo para cancelar sem pagar.
- Preço na landing (`src/landing/Pricing.tsx`) só aparece com `VITE_SHOW_PRICING=true` no build, ligada junto com `BILLING_ENABLED` e nunca antes.
- Assinatura só é escrita pelo webhook (`POST /api/stripe/webhook`, no papel dono, sem login e protegido pela assinatura do corpo): ele busca a assinatura de novo na Stripe antes de gravar. Por isso a rota é registrada antes de `data` em `server/app.ts`. Checkout e portal ficam em `server/routes/billing.ts` e o app nunca vê dado de cartão. Excluir a conta apaga o cliente na Stripe, e se isso falhar a exclusão para. Conta de cortesia (Pro sem cobrança) é uma linha manual em `subscriptions` com `stripe_customer_id = 'cortesia_<userId>'`, `status = 'active'` e período nulo: a tela mostra "Cortesia" e o portal responde 404. Assinatura duplicada (duas abas pagando) é cancelada na Stripe e a linha boa não muda.
- Variáveis da cobrança, só no ambiente (nunca no repositório): `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `BILLING_ENABLED`. Testes da API simulam a Stripe e nunca falam com ela.
- Teal é ação e progresso. Âmbar é só recompensa. Azul, rosa e roxo existem só em gráficos: tarefa, foco e treino.
- A coluna do Quadro vem dos dados, em `columnOf()`. Concluir é só `doneAt`, e `startedAt` não dá XP. Toda mudança de coluna passa por `placeOn()`.
- Conquista é calculada dos mesmos agregados da Evolução. `achievements_seen` só impede a animação de repetir.
- A maré fica na faixa da Hoje. Atrás de texto de leitura, nada se mexe.
- Treino não dá XP por existir. Finalizar marca o hábito ligado, pelo check de sempre, e só recorde de carga soma XP próprio, em `recordsOf()`. Série só existe depois de feita, e sessão aberta não conta recorde.
- `exercise_ref` aponta para a biblioteca fixa, em `src/content/exercicios.ts`, ou para `custom_exercises`, então não tem chave estrangeira. Trocar o ID de um exercício da biblioteca perde o histórico. Ficha se arquiva, não se exclui, porque as sessões apontam para ela.
- O que acontece muitas vezes ao dia fica discreto. A onda em tela cheia fica para os grandes momentos.
- Atalho de teclado abre sem animação.
- Gesto nunca é o único caminho: toda ação no toque tem um controle visível. Mudança de toque também se testa no WebKit (`npx playwright install webkit`), porque o Chromium emulado não é o motor do iPhone.
- Elemento com `position: fixed` que precisa ficar acima das abas vai por portal para o `body`, porque `main` cria um contexto de empilhamento.
- Sempre respeitar `prefers-reduced-motion` e gatear `:hover`.
- Nada de segredo no cliente. A conexão com o banco vive só no servidor.
- Todo som passa por `pluck()` em `src/lib/feedback.ts`. A preferência de som fica no aparelho, de propósito, e não vai para o banco.
- Ao concluir uma etapa ou tomar uma decisão, atualizar as notas do vault, separando implementado de planejado, conforme `~/.claude/skills/system-docs/references/obsidian-taxonomy.md`.

## Onde está cada coisa

- `C:\Users\lucas\ObsidianVault\04 - Projetos\Rumo\`: fonte viva de roadmap, funcionalidades, decisões e estado. Comece por `Rumo.md`.
- `docs/`: registro inicial, congelado em 2026-11-02
- `PRODUCT.md`: quem usa e o que o produto promete
- `DESIGN.md`: sistema visual, com tokens e regras. Leia antes de criar telas
- `src/voyage/`: elementos de assinatura (rota, barco, maré, onda, sol)
- `src/lib/`: lógica pura, com testes
- `src/data/`: foto local, fila de escrita e ações
- `server/`: API, login e schema do banco
