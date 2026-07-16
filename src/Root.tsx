import { useEffect, useState } from 'react'
import App from './App.tsx'
import PacketDevPage from './PacketDevPage.tsx'
import SmokePage from './SmokePage.tsx'

/**
 * The product is the default. Two DEV HARNESSES stay reachable by hash:
 *   #smoke   → the Phase 0 eleven-check smoke test
 *   #packet  → Phase 1 packet generation from the Marcus Rivera fixture
 */
export default function Root() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  if (hash === '#smoke') return <SmokePage />
  if (hash === '#packet') return <PacketDevPage />
  return <App />
}
