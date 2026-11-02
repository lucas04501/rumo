import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/figtree'
import './styles/tokens.css'
import './styles/voyage.css'
import { App } from './App'
import { startUpdates } from './pwa'

startUpdates()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
