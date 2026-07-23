import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ApplyPage } from './app/ApplyPage'
import { MarketingLayout } from './marketing/MarketingLayout'
import { About, Faq, Landing } from './marketing/pages'
import { TexasPage } from './marketing/TexasPage'
import { txConfig } from './state-config/tx'
import PacketDevPage from './PacketDevPage'
import SmokePage from './SmokePage'

/**
 * Routes per SITE_STRUCTURE §2. Two shells: <MarketingLayout> for content pages,
 * <ApplyPage> (the rail) for /<state>/apply. A new state is a new config + two routes.
 *
 * Dev harnesses stay reachable by hash on any route: #smoke, #packet.
 */
export default function Root() {
  if (window.location.hash === '#smoke') return <SmokePage />
  if (window.location.hash === '#packet') return <PacketDevPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route index element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/texas" element={<TexasPage />} />
        </Route>
        <Route path="/texas/apply" element={<ApplyPage config={txConfig} />} />
      </Routes>
    </BrowserRouter>
  )
}
