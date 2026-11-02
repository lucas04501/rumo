import type { ReactNode } from 'react'

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-10 lg:max-w-5xl lg:px-10 lg:pt-8">
      {children}
    </div>
  )
}

export function ComingSoon({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen>
      <h1 className="pt-10 font-display text-4xl font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mt-3 max-w-[46ch] text-lg text-mist">{children}</p>
    </Screen>
  )
}
