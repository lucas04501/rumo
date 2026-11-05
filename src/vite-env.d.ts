/** Data e hora do build, para conferir no aparelho qual versão está rodando. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** "true" mostra a seção de planos na landing. Liga junto com BILLING_ENABLED. */
  readonly VITE_SHOW_PRICING?: string
}
