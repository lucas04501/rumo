import type { ReactNode } from 'react'
import { SunGlow } from './SunGlow'
import { Tide } from './Tide'

const BAND_CREST = 16

/** O mar do dia. Fica nesta faixa, e não atrás da tela inteira, para a lista ter fundo limpo. */
export function TideBand({ level, children }: { level: number; children: ReactNode }) {
  return (
    <div className="tide-band">
      <Tide level={level} crest={BAND_CREST} />
      <SunGlow level={level} />
      <div className="tide-band-text">{children}</div>
    </div>
  )
}
