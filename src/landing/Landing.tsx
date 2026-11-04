import {
  CalendarDays,
  GlassWater,
  MonitorSmartphone,
  NotebookPen,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Undo2,
  WifiOff,
} from 'lucide-react'
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Route } from '../voyage/Route'
import { SunGlow } from '../voyage/SunGlow'
import { Tide } from '../voyage/Tide'
import {
  BoardDemo,
  ConsistencyDemo,
  FocusDemo,
  HERO_ROWS,
  HeroPhone,
  MedalsDemo,
  QuickAddDemo,
  TodayDemo,
  VoyagePanel,
  WorkoutDemo,
} from './demos'
import './landing.css'

// Sem preço e sem "grátis" até a cobrança existir: os termos e a hospedagem mudam junto.
const START = '/?conta=criar'
const SIGN_IN = '/?conta=entrar'

const NAV = [
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'funcoes', label: 'Funções' },
  { id: 'treinos', label: 'Treinos' },
]

const WRAP = 'mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10'
const H2 = 'font-display text-[clamp(34px,5.4vw,56px)]/[1.05] font-semibold tracking-[-0.025em]'
const H3 = 'font-display text-[clamp(26px,3.4vw,36px)]/[1.1] font-semibold tracking-[-0.02em]'
const LEAD = 'text-[17px]/[1.55] text-mist sm:text-[19px]/[1.55]'
const EASE_OUT = [0.23, 1, 0.32, 1] as const

/** Lê um valor do scroll em passos, para a maré não renderizar a cada pixel. */
function useStepped(value: MotionValue<number>, step = 0.02) {
  const round = (x: number) => Math.round(x / step) * step
  const [current, setCurrent] = useState(() => round(value.get()))
  useMotionValueEvent(value, 'change', (x) => setCurrent(round(x)))
  return current
}

/** Só as demonstrações entram. Títulos e texto ficam parados, para ler na hora. */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

export function Landing() {
  useEffect(() => {
    // O app é uma tela fixa. Só a landing deixa a página rolar.
    document.documentElement.classList.add('landing-page')
    return () => document.documentElement.classList.remove('landing-page')
  }, [])

  return (
    <div className="landing">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Voyage />
        <TryIt />
        <Features />
        <Workouts />
        <Everyday />
        <Questions />
        <FinalCall />
      </main>
      <Footer />
    </div>
  )
}

function Nav() {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
          else setActive((current) => (current === entry.target.id ? null : current))
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    NAV.forEach(({ id }) => {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <header className="landing-nav">
      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
        <a href="#topo" className="mr-auto flex min-h-11 items-center px-3 font-display text-[22px] font-semibold tracking-[-0.02em]">
          Rumo
        </a>
        <ul className="hidden items-center md:flex">
          {NAV.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="landing-nav-link" aria-current={active === item.id ? 'true' : undefined}>
                {item.label}
                {active === item.id && (
                  <motion.span layoutId="landing-nav-mark" className="landing-nav-mark" transition={{ duration: 0.25, ease: EASE_OUT }} />
                )}
              </a>
            </li>
          ))}
        </ul>
        <a href={SIGN_IN} className="landing-nav-link">
          Entrar
        </a>
        <a href={START} className="action">
          Começar
        </a>
      </nav>
    </header>
  )
}

const HERO_START = 2
const HERO_CHECK_MS = 900

function Hero() {
  const reduceMotion = useReducedMotion()
  const [done, setDone] = useState(reduceMotion ? HERO_START + 1 : HERO_START)
  const [arrived, setArrived] = useState(false)

  // A página abre com o dia pela metade e conclui um item: a mecânica do app no primeiro segundo.
  useEffect(() => {
    setArrived(true)
    if (reduceMotion) return
    const timer = setTimeout(() => setDone(HERO_START + 1), HERO_CHECK_MS)
    return () => clearTimeout(timer)
  }, [reduceMotion])

  // Uma maré só: o mar do fundo e o sol seguem o dia do celular.
  const level = done / HERO_ROWS.length

  return (
    <section id="topo" className="landing-hero">
      <SunGlow level={level} />
      <div className={`${WRAP} relative z-10 grid items-center gap-10 pt-24 pb-20 sm:pt-32 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:pt-36 lg:pb-[22svh]`}>
        <div>
          <h1 className="font-display text-[clamp(44px,9vw,96px)]/[0.98] font-semibold tracking-[-0.035em]">
            Sua vida tem um rumo.
          </h1>
          <p className={`mt-5 max-w-[46ch] sm:mt-6 ${LEAD}`}>
            Metas, hábitos, tarefas e treinos em um lugar só, vividos como uma viagem. A meta é a rota, cada marco é uma
            estação e o seu dia é uma maré que sobe.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-9">
            <a href={START} className="action landing-cta">
              Começar a viagem
            </a>
            <a href={SIGN_IN} className="ghost landing-cta">
              Já tenho conta
            </a>
          </div>
        </div>
        <HeroPhone done={done} />
      </div>
      <div className="landing-hero-sea" aria-hidden>
        <Tide level={reduceMotion || arrived ? level : 0} />
      </div>
    </section>
  )
}

const PROBLEM = ['Metas em um app.', 'Hábitos em outro.', 'Tarefas no papel.', 'Treino no caderno.']

function Problem() {
  return (
    <section className={`${WRAP} py-20 sm:py-28`} aria-label="Por que o Rumo">
      {PROBLEM.map((line) => (
        <Reveal key={line}>
          <p className="font-display text-[clamp(32px,6vw,64px)]/[1.15] font-semibold tracking-[-0.03em] text-haze">{line}</p>
        </Reveal>
      ))}
      <Reveal className="mt-8">
        <p className="font-display text-[clamp(38px,7.4vw,84px)]/[1.02] font-semibold tracking-[-0.035em]">
          No Rumo, tudo vira uma viagem só.
        </p>
      </Reveal>
    </section>
  )
}

const STEPS = [
  {
    title: 'A meta é a rota.',
    text: 'Escolha um destino e um prazo. Ele vira uma rota, com o barco no porto de partida.',
  },
  {
    title: 'Cada marco é uma estação.',
    text: 'Divida o destino em etapas. O barco só anda quando você conclui de verdade.',
  },
  {
    title: 'O dia é uma maré que sobe.',
    text: 'Cada hábito e cada tarefa feitos sobem a água. Sem anel, sem porcentagem: você vê acontecer.',
  },
]

function stateFor(progress: number) {
  const step = progress < 0.36 ? 0 : progress < 0.68 ? 1 : 2
  const reached = progress < 0.36 ? 0 : Math.min(3, 1 + Math.floor((progress - 0.36) / 0.1))
  const tide = progress < 0.68 ? 0.1 : 0.1 + Math.min(1, (progress - 0.68) / 0.28) * 0.8
  return { step, reached, tide }
}

function Voyage() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start center', 'end center'] })
  const progress = useStepped(scrollYProgress, 0.01)
  const { step, reached, tide } = stateFor(progress)

  return (
    <section ref={ref} id="como-funciona" className="landing-anchor py-20 lg:py-0">
      <div className={`${WRAP} lg:grid lg:grid-cols-2 lg:gap-16`}>
        <div>
          <h2 className={`${H2} lg:pt-24`}>A vida como viagem.</h2>
          {STEPS.map((item, index) => (
            <div key={item.title} className="py-12 lg:flex lg:min-h-[80svh] lg:items-center lg:py-0">
              <div>
                <p className={`text-[15px] font-medium transition-colors duration-300 ${step === index ? 'text-tide' : 'text-mist'}`}>
                  0{index + 1}
                </p>
                <h3 className={`mt-2 ${H3}`}>{item.title}</h3>
                <p className={`mt-4 max-w-[42ch] ${LEAD}`}>{item.text}</p>
                <div className="mt-8 lg:hidden">
                  <MobileStep index={index} />
                </div>
              </div>
            </div>
          ))}
          <p className="max-w-[40ch] pb-4 font-display text-[clamp(24px,3vw,30px)]/[1.25] font-semibold lg:pb-28">
            Um dia ruim não afunda a viagem. A âncora perdoa uma falta isolada na sequência, e você pode pausar um hábito
            nas férias.
          </p>
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-0 flex h-svh items-center">
            <VoyagePanel reached={reached} tide={tide} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** No celular não há painel fixo: cada passo mostra só a sua parte e anima quando aparece. */
function MobileStep({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.7 })
  return (
    <div ref={ref}>
      {index === 0 && <VoyagePanel show="route" reached={0} tide={0} />}
      {index === 1 && <VoyagePanel show="route" reached={seen ? 2 : 0} tide={0} />}
      {index === 2 && <VoyagePanel show="tide" reached={0} tide={seen ? 0.85 : 0.1} />}
    </div>
  )
}

function TryIt() {
  return (
    <section className={`${WRAP} grid items-center gap-10 py-24 sm:py-32 lg:grid-cols-2 lg:gap-16`}>
      <div>
        <h2 className={H2}>Experimente a maré.</h2>
        <p className={`mt-5 max-w-[40ch] ${LEAD}`}>Toque para concluir. Quando tudo estiver feito, é dia perfeito.</p>
      </div>
      <Reveal>
        <TodayDemo />
      </Reveal>
    </section>
  )
}

type FeatureProps = { title: string; children: ReactNode; visual: ReactNode; flip?: boolean; wide?: boolean }

function Feature({ title, children, visual, flip = false, wide = false }: FeatureProps) {
  return (
    <div className={`grid items-center gap-8 py-14 sm:py-20 ${wide ? '' : 'lg:grid-cols-2 lg:gap-16'}`}>
      <div className={flip ? 'lg:order-2' : undefined}>
        <h3 className={H3}>{title}</h3>
        <div className={`mt-4 grid max-w-[44ch] gap-4 ${LEAD} ${wide ? 'lg:max-w-[60ch]' : ''}`}>{children}</div>
      </div>
      <Reveal>{visual}</Reveal>
    </div>
  )
}

const ROUTINE = [
  { time: '07:00', step: 'Acordar e alongar' },
  { time: '07:30', step: 'Treino', now: true },
  { time: '09:00', step: 'Trabalho' },
]

const SMALL = [
  {
    icon: GlassWater,
    title: 'Água',
    text: 'Defina sua meta ou calcule pelo peso, registre cada copo com um toque na Hoje e, ao bater a meta, o hábito se marca sozinho.',
  },
  {
    icon: CalendarDays,
    title: 'Relatório do dia',
    text: 'No calendário, cada dia mostra o que foi feito: hábitos, tarefas, foco e a nota.',
  },
  { icon: NotebookPen, title: 'Notas e registro do dia', text: 'Uma nota por dia, e notas livres com busca e fixar.' },
  { icon: Search, title: 'Busca em tudo', text: 'Tarefas, hábitos, metas, fichas e notas, sem se preocupar com acento.' },
  { icon: Plus, title: 'Criar de qualquer tela', text: 'Um botão, ou a tecla N no computador.' },
  { icon: Undo2, title: 'Desfazer', text: 'Excluiu, pulou ou adiou sem querer? Um toque volta.' },
]

function Features() {
  return (
    <section id="funcoes" className={`${WRAP} landing-anchor py-16`}>
      <h2 className={`${H2} max-w-[18ch]`}>Tudo o que o dia pede, em um lugar.</h2>

      <Feature title="Escreva do seu jeito." visual={<QuickAddDemo />}>
        <p>
          “pagar luz sexta !alta” vira uma tarefa com data e prioridade. Ela pode repetir, ter subtarefas e ser deslizada
          para concluir ou adiar.
        </p>
      </Feature>

      <Feature title="O mês de relance." visual={<BoardDemo />} wide>
        <p>
          Mês, Semana e Quadro com A fazer, Fazendo e Feito, separados por dia. O que ficou para trás volta para hoje com
          um toque.
        </p>
      </Feature>

      <Feature title="Uma tarefa, um relógio." visual={<FocusDemo />}>
        <p>No Foco, com ritmos de 25+5 e 50+10, a maré mede o bloco. A Rotina guia o dia do acordar ao dormir.</p>
        <ul className="text-[16px]">
          {ROUTINE.map((item) => (
            <li key={item.time} className="flex min-h-11 items-center gap-4 border-b border-line last:border-0">
              <span className={`w-12 ${item.now ? 'text-tide' : 'text-mist'}`}>{item.time}</span>
              <span className="text-foam">{item.step}</span>
            </li>
          ))}
        </ul>
      </Feature>

      <Feature title="Veja o quanto já navegou." visual={<ConsistencyDemo />} flip>
        <p>
          Evolução de 7, 30 e 90 dias, consistência de 13 semanas e padrões que só aparecem quando há dias suficientes
          para dizer algo.
        </p>
      </Feature>

      <Feature title="Recompensa por concluir." visual={<MedalsDemo />}>
        <p>
          XP, dez patentes de Grumete a Lenda dos Mares, vento a favor e 25 medalhas. Nada premia só abrir o app.
        </p>
      </Feature>

      <ul className="grid gap-x-12 border-t border-line pt-10 sm:grid-cols-2">
        {SMALL.map((item) => (
          <li key={item.title} className="flex gap-4 border-b border-line py-6">
            <item.icon size={22} className="mt-0.5 shrink-0 text-mist" aria-hidden />
            <div>
              <p className="text-[17px] font-medium">{item.title}</p>
              <p className="mt-1 text-[15px]/[1.5] text-mist">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Workouts() {
  return (
    <section id="treinos" className={`${WRAP} landing-anchor grid items-center gap-10 py-24 sm:py-32 lg:grid-cols-2 lg:gap-16`}>
      <div>
        <h2 className={H2}>Treino sem caderno.</h2>
        <p className={`mt-5 max-w-[42ch] ${LEAD}`}>
          Monte a ficha, use a biblioteca de 46 exercícios com instruções e registre cada série com uma mão. O descanso
          conta sozinho.
        </p>
        <p className={`mt-4 max-w-[42ch] ${LEAD}`}>
          O calendário mostra o planejado e o feito, e o gráfico de carga mostra a evolução. Finalizar o treino marca o
          hábito ligado a ele. Bater a sua maior carga vira recorde.
        </p>
      </div>
      <Reveal>
        <WorkoutDemo />
      </Reveal>
    </section>
  )
}

const EVERYDAY = [
  { icon: WifiOff, title: 'Sem internet', text: 'Marque no metrô. O app sincroniza quando a conexão voltar.' },
  { icon: MonitorSmartphone, title: 'Celular e computador', text: 'Os mesmos dados nos dois, sempre.' },
  { icon: Smartphone, title: 'Na tela de início', text: 'Instale como um app, no iPhone e no Android.' },
  {
    icon: ShieldCheck,
    title: 'Seus dados são seus',
    text: 'Exporte tudo quando quiser e exclua a conta em Ajustes. Sem anúncios, e nada é vendido.',
  },
]

function Everyday() {
  return (
    <section className={`${WRAP} py-20 sm:py-28`}>
      <h2 className={H2}>Feito para o dia a dia.</h2>
      <ul className="mt-10 grid gap-x-12 sm:grid-cols-2">
        {EVERYDAY.map((item) => (
          <li key={item.title} className="flex gap-4 border-b border-line py-6">
            <item.icon size={22} className="mt-0.5 shrink-0 text-mist" aria-hidden />
            <div>
              <p className="text-[17px] font-medium">{item.title}</p>
              <p className="mt-1 text-[15px]/[1.5] text-mist">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

const QUESTIONS = [
  { q: 'Funciona no iPhone?', a: 'Sim. No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.' },
  {
    q: 'Preciso de internet?',
    a: 'Só para entrar pela primeira vez. Depois, o app abre e marca sem internet, e sincroniza quando ela volta.',
  },
  { q: 'Posso levar meus dados?', a: 'Sim. Em Ajustes, você exporta tudo em JSON, a qualquer momento.' },
  {
    q: 'Serve só para treino, ou só para metas?',
    a: 'Para as duas coisas. E o treino marca o hábito ligado a ele, sem registrar duas vezes.',
  },
]

function Questions() {
  return (
    <section className={`${WRAP} max-w-3xl py-20 sm:py-28`}>
      <h2 className={H2}>Perguntas.</h2>
      <div className="mt-8">
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
    </section>
  )
}

function FinalCall() {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const seen = useInView(ref, { once: true, amount: 0.5 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const scrolled = useStepped(useTransform(scrollYProgress, [0, 1], [0.1, 0.9]))

  return (
    <section ref={ref} className="landing-final">
      <div className={`${WRAP} relative z-10 pt-24 sm:pt-32`}>
        <h2 className={`${H2} max-w-[14ch] text-[clamp(40px,7vw,80px)]`}>Defina o primeiro destino.</h2>
        <a href={START} className="action landing-cta mt-8">
          Começar a viagem
        </a>
        <div className="mt-12 max-w-md" aria-hidden>
          <Route milestones={3} reached={seen ? 3 : 0} label="" />
        </div>
      </div>
      <div className="landing-final-sea" aria-hidden>
        <Tide level={reduceMotion ? 0.6 : scrolled} />
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-water-3">
      <div className={`${WRAP} flex flex-wrap items-center gap-x-6 gap-y-2 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]`}>
        <p className="mr-auto font-display text-[20px] font-semibold">Rumo</p>
        <a href="/termos" className="landing-footer-link">
          Termos
        </a>
        <a href="/privacidade" className="landing-footer-link">
          Privacidade
        </a>
        <a href={SIGN_IN} className="landing-footer-link">
          Entrar
        </a>
      </div>
    </footer>
  )
}
