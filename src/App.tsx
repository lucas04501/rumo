import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { LEGAL_PAGES } from './content/legal'
import { DayProvider } from './data/DayProvider'
import { persistOptions, resumeWrites, store } from './data/store'
import { AuthGate } from './ui/AuthGate'
import { Agua } from './screens/Agua'
import { Assinatura } from './screens/Assinatura'
import { Shell } from './ui/Shell'
import { Biblioteca } from './screens/Biblioteca'
import { Conquistas } from './screens/Conquistas'
import { Evolucao } from './screens/Evolucao'
import { Ficha } from './screens/Ficha'
import { Foco } from './screens/Foco'
import { Habitos } from './screens/Habitos'
import { Hoje } from './screens/Hoje'
import { Legal } from './screens/Legal'
import { Mais } from './screens/Mais'
import { Mes } from './screens/Mes'
import { Meta } from './screens/Meta'
import { Metas } from './screens/Metas'
import { Notas } from './screens/Notas'
import { Perfil } from './screens/Perfil'
import { Redefinir } from './screens/Redefinir'
import { Rotina } from './screens/Rotina'
import { Treino } from './screens/Treino'
import { Treinos } from './screens/Treinos'

export function App() {
  const legal = LEGAL_PAGES[window.location.pathname]
  if (legal) return <Legal page={legal} />
  if (window.location.pathname === '/redefinir') return <Redefinir />

  return (
    <MotionConfig reducedMotion="user">
      <PersistQueryClientProvider
        client={store}
        persistOptions={persistOptions}
        onSuccess={resumeWrites}
      >
        <AuthGate>
          <DayProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Shell />}>
                  <Route index element={<Hoje />} />
                  <Route path="habitos" element={<Habitos />} />
                  <Route path="metas" element={<Metas />} />
                  <Route path="metas/:id" element={<Meta />} />
                  <Route path="mes" element={<Mes />} />
                  <Route path="semana" element={<Mes />} />
                  <Route path="quadro" element={<Mes />} />
                  <Route path="notas" element={<Notas />} />
                  <Route path="rotina" element={<Rotina />} />
                  <Route path="evolucao" element={<Evolucao />} />
                  <Route path="conquistas" element={<Conquistas />} />
                  <Route path="foco" element={<Foco />} />
                  <Route path="treinos" element={<Treinos />} />
                  <Route path="treinos/biblioteca" element={<Biblioteca />} />
                  <Route path="treinos/:id" element={<Ficha />} />
                  <Route path="treino" element={<Treino />} />
                  <Route path="mais" element={<Mais />} />
                  <Route path="agua" element={<Agua />} />
                  <Route path="perfil" element={<Perfil />} />
                  <Route path="assinatura"element={<Assinatura />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DayProvider>
        </AuthGate>
      </PersistQueryClientProvider>
    </MotionConfig>
  )
}
