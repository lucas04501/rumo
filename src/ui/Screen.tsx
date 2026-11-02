import type { ReactNode } from 'react'

export function Screen({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`mx-auto max-w-xl pt-[calc(env(safe-area-inset-top,0px)+16px)] pr-[max(20px,env(safe-area-inset-right,0px))] pb-24 pl-[max(20px,env(safe-area-inset-left,0px))] lg:px-10 lg:pt-8 lg:pb-10 ${
        wide ? 'lg:max-w-7xl' : 'lg:max-w-5xl'
      }`}
    >
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
