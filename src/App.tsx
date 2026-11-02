import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { DayProvider } from './data/DayProvider'
import { persistOptions, resumeWrites, store } from './data/store'
import { AuthGate } from './ui/AuthGate'
import { Shell } from './ui/Shell'
import { Conquistas } from './screens/Conquistas'
import { Evolucao } from './screens/Evolucao'
import { Foco } from './screens/Foco'
import { Habitos } from './screens/Habitos'
import { Hoje } from './screens/Hoje'
import { Mais } from './screens/Mais'
import { Mes } from './screens/Mes'
import { Meta } from './screens/Meta'
import { Metas } from './screens/Metas'
import { Notas } from './screens/Notas'
import { Rotina } from './screens/Rotina'

export function App() {
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
                  <Route path="mais" element={<Mais />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DayProvider>
        </AuthGate>
      </PersistQueryClientProvider>
    </MotionConfig>
  )
}
