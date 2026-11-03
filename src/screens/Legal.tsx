import { ArrowLeft } from 'lucide-react'
import type { LegalPage } from '../content/legal'

/** Fora do login e do roteador: precisa abrir para quem ainda não tem conta. */
export function Legal({ page }: { page: LegalPage }) {
  return (
    <div className="h-dvh overflow-y-auto">
      <main className="mx-auto max-w-2xl px-5 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-[calc(env(safe-area-inset-bottom,0px)+40px)]">
        <a href="/" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 text-[15px] text-mist">
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
          Rumo
        </a>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em]">{page.title}</h1>
        <p className="mt-1 text-[15px] text-mist">{page.updated}</p>

        {page.sections.map(({ heading, text }) => (
          <section key={heading} className="mt-7">
            <h2 className="font-display text-xl font-semibold">{heading}</h2>
            {text.map((paragraph) => (
              <p key={paragraph} className="mt-2 max-w-[62ch] text-[17px]/snug">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  )
}
