import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SmokePage from './SmokePage.tsx'

// PHASE 0. The app renders the smoke test and nothing else. The shell lands next.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SmokePage />
  </StrictMode>,
)
