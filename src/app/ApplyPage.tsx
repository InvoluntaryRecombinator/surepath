/**
 * /<state>/apply — THE APP (SITE_STRUCTURE §2). Renders the shared chassis with a state's
 * config. Section components are the reusable skeleton, keyed by section id; nothing in
 * them is state-specific.
 */
import type { StateConfig } from '../state-config/types'
import { AppLayout } from './AppLayout'
import { AppStoreProvider, useAppStore } from './store'
import { RecordSection } from './sections/RecordSection'
import { StubSection } from './sections/StubSection'

function CurrentSection() {
  const { state } = useAppStore()
  switch (state.sectionId) {
    case 'record':
      return <RecordSection />
    default:
      return <StubSection sectionId={state.sectionId} />
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
