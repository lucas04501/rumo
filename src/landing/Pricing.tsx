import { Check, Minus, Plus } from 'lucide-react'

// Mesmas medidas da Landing, para a seção ter a voz do resto da página.
const WRAP = 'mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10'
const H2 = 'font-display text-[clamp(34px,5.4vw,56px)]/[1.05] font-semibold tracking-[-0.025em]'
const H3 = 'font-display text-[clamp(26px,3.4vw,36px)]/[1.1] font-semibold tracking-[-0.02em]'

/** Só aparece com VITE_SHOW_PRICING=true, que liga junto com BILLING_ENABLED no servidor. */
export const SHOW_PRICING = import.meta.env.VITE_SHOW_PRICING === 'true'

const FREE = [
  'Hábitos, até 3 ativos',
  'Hoje, com a visão geral dos seus hábitos e metas',
  'Metas, com marcos e vínculo aos hábitos',
  'Exportar seus dados quando quiser',
]

const PRO = [
  'Tudo do grátis',
  'Hábitos sem limite',
  'Plano completo (Mês, Semana, Quadro e tarefas), Foco, Rotina, Notas, Água, Evolução e Conquistas',
  'Treinos completos: fichas, biblioteca de exercícios, modo treino e recordes de carga',
]

const REASONS = [
  { title: 'Quando três hábitos não bastam.', text: 'Se a sua rotina pede mais de três, o Pro tira o teto.' },
  {
    title: 'O dia inteiro no mesmo lugar.',
    text: 'Tarefas, Quadro, Foco, Rotina, Água e Notas, ligados aos seus hábitos e metas.',
  },
  {
    title: 'Treino sem papel.',
    text: 'Ficha pronta, modo treino para usar com a mão ocupada, carga sugerida da série anterior e recorde de carga que vira XP.',
  },
  { title: 'Menos de 50 centavos por dia.', text: 'R$ 14,90 por mês.' },
  {
    title: 'Sem pegadinha.',
    text: 'Os 7 dias grátis são o seu prazo para decidir: cancele até o 7º dia, em Perfil, Plano, e você não paga nada. Se não cancelar, a primeira cobrança acontece quando os 7 dias acabam. Depois disso, cancelar impede as próximas cobranças e o Pro segue até o fim do período já pago, sem reembolso.',
  },
]

const QUESTIONS = [
  { q: 'Preciso de cartão para o plano grátis?', a: 'Não.' },
  {
    q: 'E o reembolso?',
    a: 'Os 7 dias grátis são o seu prazo: cancele até o 7º dia e você não paga nada. Depois da primeira cobrança, não há reembolso. Cancelando, você usa o Pro até o fim do período pago e não é cobrado de novo. Seus dados continuam guardados no plano grátis, e você pode exportá-los.',
  },
  { q: 'Como pago?', a: 'No cartão, pela Stripe. O Rumo não vê nem guarda os dados do cartão.' },
  { q: 'Onde cancelo?', a: 'No app, em Perfil, Plano.' },
]

function Item({ children, icon: Icon = Check }: { children: string; icon?: typeof Check }) {
  return (
    <li className="flex gap-3 py-2 text-[17px]/[1.5]">
      <Icon size={20} className="mt-0.5 shrink-0 text-mist" aria-hidden />
      <span>{children}</span>
    </li>
  )
}

export function Pricing({ start }: { start: string }) {
  return (
    <section id="planos" className={`${WRAP} landing-anchor py-20 sm:py-28`}>
      <h2 className={`${H2} max-w-[22ch]`}>Comece de graça. Leve o Rumo inteiro quando a rota pedir.</h2>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-line bg-sea-1 p-6 sm:p-8">
          <h3 className="font-display text-[24px] font-semibold">Grátis</h3>
          <p className="mt-2 font-display text-[44px]/[1.1] font-semibold tracking-[-0.02em]">R$ 0</p>
          <ul className="mt-6">
            {FREE.map((item) => (
              <Item key={item}>{item}</Item>
            ))}
          </ul>
          <p className="mt-4 flex gap-3 border-t border-line pt-4 text-[15px]/[1.5] text-mist">
            <Minus size={20} className="shrink-0" aria-hidden />
            <span>
              Não inclui: Plano (Mês, Semana e Quadro) e tarefas, Foco, Rotina, Notas, Água, Evolução, Conquistas e
              Treinos.
            </span>
          </p>
          <div className="mt-auto pt-8">
            <a href={start} className="ghost landing-cta">
              Começar de graça
            </a>
          </div>
        </article>

        <article className="flex flex-col rounded-2xl border border-line-strong bg-sea-1 p-6 sm:p-8">
          <h3 className="font-display text-[24px] font-semibold">Pro</h3>
          <p className="mt-2 font-display text-[44px]/[1.1] font-semibold tracking-[-0.02em]">
            R$ 14,90 <span className="font-sans text-[17px] font-normal tracking-normal text-mist">por mês</span>
          </p>
          <ul className="mt-6">
            {PRO.map((item) => (
              <Item key={item}>{item}</Item>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-4 text-[17px]/[1.5]">
            <strong className="font-semibold">7 dias grátis:</strong> você informa o cartão e só paga quando os 7 dias
            acabam.
          </p>
          <a href={start} className="action landing-cta mt-8 self-start">
            Começar 7 dias grátis
          </a>
          <p className="mt-3 text-[15px]/[1.5] text-mist">
            Cancelando antes do fim dos 7 dias, você não paga nada. O teste vale uma vez por conta.
          </p>
        </article>
      </div>

      <div className="mt-20 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <h3 className={H3}>Por que escolher o Pro</h3>
        <ol className="mt-6 lg:mt-0">
          {REASONS.map((item, index) => (
            <li key={item.title} className="flex gap-4 border-b border-line py-6 first:pt-0">
              <span className="w-6 shrink-0 text-[15px] font-medium text-mist">0{index + 1}</span>
              <div>
                <p className="text-[17px] font-medium">{item.title}</p>
                <p className="mt-1 max-w-[56ch] text-[15px]/[1.5] text-mist">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-20 max-w-3xl">
        <h3 className={H3}>Perguntas rápidas</h3>
        <div className="mt-6">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="landing-question border-b border-line">
              <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-4 text-[18px] font-medium">
                {item.q}
                <Plus size={20} className="landing-question-icon shrink-0 text-mist" aria-hidden />
              </summary>
              <p className="max-w-[56ch] pb-6 text-[17px]/[1.55] text-mist">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
