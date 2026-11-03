# Rumo

PWA de metas, hábitos e planner mensal, em português do Brasil. Uso pessoal agora, multi-tenant com mensalidade depois.

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
- O Rumo fica no gratuito, por decisão do Lucas: nada de plano pago. Termos e privacidade em `src/content/legal.ts` precisam continuar verdadeiros: mudou provedor ou o que é guardado, muda o texto.
- Em `server/` e `api/`, imports relativos terminam em `.js`: a Vercel roda ESM sem empacotar. `schema.ts` fica em um arquivo só, porque o drizzle-kit não resolve esses imports.
- O `.env` aponta só para a branch `dev`. A conexão da branch principal não fica neste computador. Para migrar a principal, passe `DATABASE_URL` pelo ambiente, sem gravar em arquivo nem exibir. `vercel env run` não serve: a Vercel não libera valores do tipo Secret, e o CLI carrega o `.env`, então a migração cairia na `dev` dizendo sucesso. A conexão vem de `neonctl connection-string main`, guardada só em uma variável do comando. Confira que o endereço difere do `.env` antes de migrar. A migração vem antes do deploy, e a autorização do Lucas é pedida a cada vez.
- Testes nunca tocam a branch principal.
- Em produção, verificação é só leitura. Nunca confirme "cadastro fechado" tentando cadastrar: use `GET /api/signup-status`. Depois de um deploy, o endereço principal leva alguns segundos para apontar para a versão nova.
- Cadastro fechado por padrão no código (`ALLOW_SIGNUP`). Em produção, está aberto a qualquer pessoa desde 2026-11-02, por decisão do Lucas, ainda sem confirmação de e-mail nem recuperação de senha. O limite de tentativas fica no banco, em `rate_limit`, e só liga em produção. Para fechar: remova a variável na Vercel e publique de novo.
- Deploy em produção: `npx vercel deploy --prod --yes`. Autorizado pelo Lucas em 2026-11-02. Sem o `--prod`, o deploy vira pré-visualização.
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

- `C:\Users\Pichau\ObsidianVault\04 - Projetos\Rumo\`: fonte viva de roadmap, funcionalidades, decisões e estado. Comece por `Rumo.md`.
- `docs/`: registro inicial, congelado em 2026-11-02
- `PRODUCT.md`: quem usa e o que o produto promete
- `DESIGN.md`: sistema visual, com tokens e regras. Leia antes de criar telas
- `src/voyage/`: elementos de assinatura (rota, barco, maré, onda, sol)
- `src/lib/`: lógica pura, com testes
- `src/data/`: foto local, fila de escrita e ações
- `server/`: API, login e schema do banco
