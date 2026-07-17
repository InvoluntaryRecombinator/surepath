/**
 * <AppLayout> — the application's shell (SITE_STRUCTURE §1): the rail on the left, a
 * continuous light SHEET on the right. The rail↔sheet seam is the strongest structural
 * contrast on screen — that seam, not decoration, is what makes the nav read as its own
 * place and the content read as a canvas.
 *
 * The sheet is anchored top and bottom: a content header bar (step position left, the
 * saved-state whisper right) and the action bar. Nothing floats.
 */
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { ArrowLeft, ArrowRight, CheckSmall } from '../ui/icons'
import { SectionBriefing } from '../ui/SectionIntro'
import { useAppStore } from './storeContext'
import { Rail } from './Rail'

export function AppLayout({ children }: { children: ReactNode }) {
  const { state, dispatch, config } = useAppStore()
  const idx = config.sections.findIndex((s) => s.id === state.sectionId)
  const stage = config.sections[idx]
  const isFirst = idx === 0
  const isLast = idx === config.sections.length - 1

  const go = (i: number) => dispatch({ type: 'go', sectionId: config.sections[i].id, index: i })

  return (
    /* fixed inset-0: the app owns the viewport. The document can never scroll the frame —
       only the content pane scrolls. Modal-feel, page-mechanics (SITE_STRUCTURE §2). */
    <div className="fixed inset-0 flex bg-surface">
      <Rail />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── the content header bar — the pane's top edge. The rail already says where
            you are; this bar carries the one thing nothing else says: the formal name of
            the legal artifact being assembled. ─────────────────────────────────────────── */}
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-line/70 px-14">
          <p className="text-[13.5px] font-semibold text-ink/70">{config.processName}</p>
          <p className="flex items-center gap-2.5 text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-field text-accent">
              <CheckSmall size={9} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[12.5px] font-medium text-ink/70">Saved on this computer</span>
              <span className="mt-0.5 text-[11.5px]">Never sent to our servers</span>
            </span>
          </p>
        </header>

        {/* ── the sheet — content scrolls; the frame stays put. The briefing band rides
            at the top of the scroll: explanation above the seal, work below it. ────────── */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <SectionBriefing section={stage} index={idx} total={config.sections.length} />
          <div className="px-14 pb-20 pt-9">
            {state.resumed && (
              <p className="mb-8 flex max-w-[760px] items-baseline justify-between gap-4 rounded-[4px] border border-line/70 bg-ground/40 px-4 py-2.5 text-[13px] text-muted">
                Welcome back — everything you entered is right where you left it.
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'dismiss-resumed' })}
                  className="font-medium text-accent hover:underline"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </p>
            )}
            <div className="max-w-[760px]">{children}</div>
          </div>
        </main>

        {/* ── the action bar — the pane's bottom edge ──────────────────────────────── */}
        <footer className="shrink-0 border-t border-line/70">
          <div className="flex h-[68px] items-center justify-between px-14">
            <Button variant="ghost" disabled={isFirst} onClick={() => go(idx - 1)}>
              <ArrowLeft />
              Back
            </Button>
            {isLast ? (
              <Button variant="primary" disabled title="The review step is being built.">
                Generate my packet
              </Button>
            ) : (
              <Button variant="primary" onClick={() => go(idx + 1)}>
                Continue
                <ArrowRight />
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
