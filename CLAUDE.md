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
- Offline se testa no build (`npm run build` e `npm run preview`), porque o service worker não roda em desenvolvimento. Teste também reabrir o app sem internet mais de uma vez.
- Ao fim de cada etapa: testar, atualizar o vault, publicar em produção e enviar ao GitHub. O repositório é público: nunca versione nada privado.
- Toda tabela tem `user_id NOT NULL` e toda rota filtra pelo usuário da sessão. Vínculos entre tabelas usam chave estrangeira composta com `user_id`, para o banco recusar dado de outro usuário.
- Toda rota nova precisa de caso em `server/isolation.test.ts`.
- Em `server/` e `api/`, imports relativos terminam em `.js`: a Vercel roda ESM sem empacotar. `schema.ts` fica em um arquivo só, porque o drizzle-kit não resolve esses imports.
- O `.env` aponta só para a branch `dev`. A conexão da branch principal não fica neste computador. Para migrar a principal, passe `DATABASE_URL` pelo ambiente, sem gravar em arquivo nem exibir.
- Testes nunca tocam a branch principal.
- Em produção, verificação é só leitura. Nunca confirme "cadastro fechado" tentando cadastrar: use `GET /api/signup-status`. Depois de um deploy, o endereço principal leva alguns segundos para apontar para a versão nova.
- Cadastro fechado por padrão (`ALLOW_SIGNUP`). Abre só para criar a conta, e fecha em seguida.
- Deploy em produção: `npx vercel deploy --prod --yes`. Autorizado pelo Lucas em 2026-11-02. Sem o `--prod`, o deploy vira pré-visualização.
- Teal é ação e progresso. Âmbar é só recompensa.
- O que acontece muitas vezes ao dia fica discreto. A onda em tela cheia fica para os grandes momentos.
- Sempre respeitar `prefers-reduced-motion` e gatear `:hover`.
- Nada de segredo no cliente. A conexão com o banco vive só no servidor.
- Todo som passa por `pluck()` em `src/lib/feedback.ts`. A preferência de som fica no aparelho, de propósito, e não vai para o banco.
- Ao concluir uma etapa ou tomar uma decisão, atualizar as notas do vault, separando implementado de planejado, conforme `~/.claude/skills/system-docs/references/obsidian-taxonomy.md`.

## Onde está cada coisa

- `C:\Users\Pichau\ObsidianVault\04 - Projetos\Rumo\`: fonte viva de roadmap, funcionalidades, decisões e estado. Comece por `Rumo.md`.
- `docs/`: registro inicial, congelado em 2026-11-02
- `PRODUCT.md`: quem usa e o que o produto promete
- `src/voyage/`: elementos de assinatura (rota, barco, maré, onda, sol)
- `src/lib/`: lógica pura, com testes
- `src/data/`: foto local, fila de escrita e ações
- `server/`: API, login e schema do banco
