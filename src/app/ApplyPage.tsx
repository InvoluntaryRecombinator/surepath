/**
 * /<state>/apply — THE APP (SITE_STRUCTURE §2). Renders the shared chassis with a state's
 * config. Section components are the reusable skeleton, keyed by section id; nothing in
 * them is state-specific.
 */
import type { StateConfig } from '../state-config/types'
import { AppLayout } from './AppLayout'
import { AppStoreProvider } from './store'
import { useAppStore } from './storeContext'
import { AboutYouSection } from './sections/AboutYouSection'
import { RecordSection } from './sections/RecordSection'
import { StorySection } from './sections/StorySection'
import { LicensesSection } from './sections/LicensesSection'
import { ReviewSection } from './sections/ReviewSection'
import { StubSection } from './sections/StubSection'

function CurrentSection() {
  const { state } = useAppStore()
  switch (state.sectionId) {
    case 'info':
      return <AboutYouSection />
    case 'record':
      return <RecordSection />
    case 'story':
      return <StorySection />
    case 'licenses':
      return <LicensesSection />
    case 'review':
      return <ReviewSection />
    default:
      return <StubSection />
  }
}

export function ApplyPage({ config }: { config: StateConfig }) {
  return (
    <AppStoreProvider config={config}>
      <AppLayout>
        <CurrentSection />
      </AppLayout>
    </AppStoreProvider>
  )
}
