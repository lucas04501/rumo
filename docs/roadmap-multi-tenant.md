# Do uso pessoal ao produto

> Registro inicial, congelado em 2026-11-02. A versão viva está no vault do Obsidian, em `04 - Projetos\Rumo\Rumo - Roadmap.md`.

O Rumo nasce pronto para ter vários usuários no modelo de dados. O que falta para abrir ao público é isto.

## Já garantido desde o início

- Toda tabela tem `user_id NOT NULL`.
- Toda rota filtra pelo usuário da sessão.
- Teste automatizado com dois usuários confirma que um não vê os dados do outro.

## Antes de abrir para outras pessoas

1. **RLS no Postgres**, como segunda camada de proteção, com um papel próprio para a API. Pode ser adicionado sem migrar dados.
2. **Cadastro aberto**, com verificação de e-mail e recuperação de senha. Exige um provedor de e-mail.
3. **Exportar e excluir meus dados.**
4. **Termos de uso e política de privacidade.**
5. **Confirmar direitos de uso do nome** Rumo.
6. **Backups** além do histórico de 6 horas do plano gratuito do Neon.

## Para cobrar mensalidade

1. **Hospedagem:** sair do plano Hobby da Vercel, que é só para uso não comercial.
2. **Pagamento:** escolher o provedor e integrar (o Better Auth tem plugin de Stripe; avaliar opções com Pix).
3. **Tabela de assinaturas**, webhook do provedor e bloqueio de acesso por plano.
4. **Landing page** separada do app.

## Depois

- Notificações e lembretes
- Frases próprias
- Horário de virada do dia
- Modo claro
- Insights com IA
