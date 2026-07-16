/**
 * <AppLayout> — the application's shell (SITE_STRUCTURE §1): the rail on the left, a
 * generous scrollable content pane on the right, no marketing header. Modal-feel,
 * page-mechanics: its own full-screen route, a real URL, refresh keeps progress.
 */
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { useAppStore } from './storeContext'
import { Rail } from './Rail'

export function AppLayout({ children }: { children: ReactNode }) {
  const { state, dispatch, config } = useAppStore()
  const idx = config.sections.findIndex((s) => s.id === state.sectionId)
  const isFirst = idx === 0
  const isLast = idx === config.sections.length - 1

  const go = (i: number) => dispatch({ type: 'go', sectionId: config.sections[i].id, index: i })

  return (
    <div className="flex h-screen bg-ground">
      <Rail />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Content scrolls; the rail and the action bar stay put. Never vertically centered. */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-[760px] flex-col gap-8 px-10 pb-16 pt-10">
            {state.resumed && (
              <p className="flex items-baseline justify-between gap-4 rounded-[6px] border border-line bg-surface px-4 py-2.5 text-[13px] text-muted">
                Welcome back — everything you entered is right where you left it.
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'dismiss-resumed' })}
                  className="font-medium text-accent hover:underline"
                >
                  ✕
                </button>
              </p>
            )}
            {children}
          </div>
        </main>

        <footer className="border-t border-line bg-ground">
          <div className="mx-auto flex h-[68px] max-w-[760px] items-center justify-between px-10">
            <Button variant="ghost" disabled={isFirst} onClick={() => go(idx - 1)}>
              ← Back
            </Button>
            {isLast ? (
              <Button variant="primary" disabled title="The review step is being built.">
                Generate my packet
              </Button>
            ) : (
              <Button variant="primary" onClick={() => go(idx + 1)}>
                Continue →
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
