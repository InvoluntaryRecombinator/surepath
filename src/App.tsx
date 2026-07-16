/**
 * The stage router. The stepper IS the navigation — no react-router, no URLs. Six stages,
 * each currently a heading-only stub so the rail can be walked end to end. Stage content
 * lands one stage per prompt (SETUP.md Part 2).
 *
 * The case is the Marcus Rivera fixture for now, so the counter shows real derived counts.
 * Phase 2 replaces this constant with the case reducer + sessionStorage.
 */
import { useMemo, useState } from 'react'
import { marcusRivera } from './fixtures/marcusRivera'
import { deriveCounts } from './state/derived'
import { STAGES, stageIndex, type StageId } from './types/stages'
import { AppShell } from './ui/AppShell'

function downloadProgress(json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'surepath-progress.json'
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [current, setCurrent] = useState<StageId>('trade')
  const [maxReached, setMaxReached] = useState<StageId>('trade')

  const caseData = marcusRivera
  const counts = useMemo(() => deriveCounts(caseData), [caseData])

  const go = (id: StageId) => {
    setCurrent(id)
    if (stageIndex(id) > stageIndex(maxReached)) setMaxReached(id)
  }

  const idx = stageIndex(current)
  const stage = STAGES[idx]

  return (
    <AppShell
      current={current}
      maxReached={maxReached}
      counts={counts}
      onNavigate={go}
      onBack={() => idx > 0 && go(STAGES[idx - 1].id)}
      onContinue={() => idx < STAGES.length - 1 && go(STAGES[idx + 1].id)}
      onSave={() => downloadProgress(JSON.stringify(caseData, null, 2))}
      onClear={() => {
        // The real Clear (Phase 2) wipes the reducer + sessionStorage. The fixture is a
        // constant, so for now this just proves the affordance exists on every screen.
        if (window.confirm('Clear everything you have entered and leave?')) {
          sessionStorage.clear()
          window.location.reload()
        }
      }}
    >
      {/* Heading-only stubs. Content starts at a fixed offset and grows downward. */}
      <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">{stage.title}</h1>
    </AppShell>
  )
}
