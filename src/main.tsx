import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SmokePage from './SmokePage.tsx'
import PacketDevPage from './PacketDevPage.tsx'

// PHASES 0–1. Two dev harnesses, no product UI yet. The shell lands next.
//   /          → generate the Marcus Rivera packet  (Phase 1)
//   /#smoke    → the eleven-check smoke test        (Phase 0)
const smoke = window.location.hash === '#smoke'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{smoke ? <SmokePage /> : <PacketDevPage />}</StrictMode>,
)
