# Rumo

PWA de metas, hábitos e planner mensal, em português do Brasil. Uso pessoal agora, multi-tenant com mensalidade depois.

## Comandos

- `npm run dev`: app em desenvolvimento, acessível na rede local para testar no celular
- `npm test`: testes das funções puras (Vitest)
- `npm run build`: checagem de tipos e build de produção
- `npm run preview`: serve o build, com service worker ativo
- `npm run icons`: gera os ícones a partir de `public/logo.svg`

## Regras do projeto

- Datas são dias locais `YYYY-MM-DD`. Toda "data de hoje" vem de `hoje()` em `src/lib/dates.ts`. Nunca usar UTC nem `toISOString()` para data.
- XP e sequência são calculados a partir dos dados, em funções puras de `src/lib/`. Nunca são salvos.
- Toda tabela tem `user_id NOT NULL` e toda rota filtra pelo usuário da sessão.
- Teal é ação e progresso. Âmbar é só recompensa.
- O que acontece muitas vezes ao dia fica discreto. A onda em tela cheia fica para os grandes momentos.
- Sempre respeitar `prefers-reduced-motion` e gatear `:hover`.
- Nada de segredo no cliente. A conexão com o banco vive só no servidor.

## Onde está cada coisa

- `docs/decisoes.md`: decisões, motivos e dúvidas abertas
- `docs/roadmap-multi-tenant.md`: o que falta para abrir ao público
- `PRODUCT.md`: quem usa e o que o produto promete
- `src/voyage/`: elementos de assinatura (rota, barco, maré, onda, sol)
- `src/lib/`: lógica pura, com testes
- `src/data/demo.ts`: dados de demonstração, a remover na etapa 4
