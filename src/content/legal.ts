export type LegalPage = {
  title: string
  updated: string
  sections: { heading: string; text: string[] }[]
}

const UPDATED = 'Versão de 5 de novembro de 2026'

// Tudo aqui precisa continuar verdadeiro: mudou o provedor ou o que é guardado, muda este texto.
export const LEGAL_PAGES: Record<string, LegalPage> = {
  '/termos': {
    title: 'Termos de uso',
    updated: UPDATED,
    sections: [
      {
        heading: 'O que é o Rumo',
        text: [
          'O Rumo reúne metas, hábitos, tarefas, planejamento, notas e treinos. Tem um plano grátis, com até 3 hábitos ativos e a área de Treinos só para leitura, e o plano Pro, com tudo liberado. Não tem anúncios.',
          'É um projeto pessoal, oferecido como está. Ele pode mudar, ficar fora do ar ou ser encerrado, sem garantia de disponibilidade.',
        ],
      },
      {
        heading: 'Sua conta',
        text: [
          'Você é responsável pela sua senha. Se esquecer, peça um link na tela de entrar: ele chega no e-mail da conta e vale por 1 hora.',
          'Você pode excluir a conta quando quiser, em Ajustes. Se tiver uma assinatura, ela é cancelada junto.',
        ],
      },
      {
        heading: 'Assinatura e pagamento',
        text: [
          'O plano Pro custa R$ 14,90 por mês. Os 7 primeiros dias são grátis: você informa o cartão ao começar e só é cobrado depois dos 7 dias. Cancelando antes do fim do teste, nada é cobrado. O teste vale uma vez por conta.',
          'A assinatura renova todo mês, no mesmo cartão, até você cancelar. Cancele quando quiser em Mais, Assinatura: o Pro segue até o fim do período já pago, sem nova cobrança, e depois o app volta ao plano grátis. Você mantém tudo o que já criou, mas não cria hábitos acima do limite do plano grátis nem altera Treinos.',
          'O pagamento é feito na Stripe. O Rumo não vê nem guarda os dados do seu cartão. Para dúvidas sobre uma cobrança, escreva para lucaspds9@hotmail.com.',
        ],
      },
      {
        heading: 'Seus dados',
        text: [
          'O que você escreve no Rumo continua sendo seu. Em Ajustes, você pode exportar tudo a qualquer momento. Vale guardar uma cópia de vez em quando, porque o serviço não promete backup.',
        ],
      },
      {
        heading: 'Uso',
        text: ['Não tente acessar dados de outras pessoas, nem usar o serviço de um jeito que o prejudique.'],
      },
      {
        heading: 'Treinos e saúde',
        text: [
          'As instruções da biblioteca de exercícios são orientações gerais. Elas não substituem um profissional de educação física nem um médico. Treine dentro dos seus limites.',
        ],
      },
      {
        heading: 'Mudanças',
        text: ['Estes termos podem mudar. A data no topo mostra a versão em vigor.'],
      },
    ],
  },
  '/privacidade': {
    title: 'Privacidade',
    updated: UPDATED,
    sections: [
      {
        heading: 'O que é guardado',
        text: [
          'Seu nome, seu e-mail e tudo o que você registra no app. A senha é guardada só em forma de hash, que não permite ler a senha original. Na área de Água, o peso usado para calcular a meta fica só na tela e não é guardado: o app salva apenas a meta e os copos.',
          'Se você assina o Pro, também ficam guardados o identificador do seu cliente e da sua assinatura na Stripe, o estado da assinatura e suas datas. Os dados do cartão ficam só na Stripe.',
          'Para manter o login e limitar tentativas, também ficam guardados o endereço de internet e o tipo de aparelho das sessões.',
        ],
      },
      {
        heading: 'Para que serve',
        text: [
          'Só para o Rumo funcionar para você. Seus dados não são vendidos, não são usados em anúncios e não passam por ferramentas de análise de terceiros.',
        ],
      },
      {
        heading: 'Onde ficam',
        text: [
          'O banco de dados fica na Neon, em São Paulo, e o app é hospedado na Netlify. Os pagamentos passam pela Stripe, que recebe seu e-mail e os dados do cartão quando você assina e mantém o registro das cobranças. O e-mail para redefinir a senha sai pelo Gmail, do Google, e só é enviado quando você pede. O app também guarda uma cópia no seu aparelho, para funcionar sem internet.',
        ],
      },
      {
        heading: 'Cookies',
        text: ['Só o cookie da sessão, que mantém você conectado. As preferências de som ficam no aparelho.'],
      },
      {
        heading: 'Por quanto tempo',
        text: [
          'Enquanto a conta existir. Ao excluir a conta, os dados são apagados na hora e seu cliente é removido da Stripe, que pode manter o registro de cobranças já feitas. O histórico técnico do provedor do banco pode manter uma cópia por até 6 horas.',
        ],
      },
      {
        heading: 'Seus direitos',
        text: [
          'Pela Lei Geral de Proteção de Dados, você pode acessar, corrigir, levar e excluir seus dados. No app, você corrige o que quiser, e em Ajustes pode exportar tudo e excluir a conta.',
          'Para qualquer outro pedido sobre seus dados, escreva para lucaspds9@hotmail.com.',
        ],
      },
    ],
  },
}
