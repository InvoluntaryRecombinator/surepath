/**
 * <AppLayout> — the application's frame (SITE_STRUCTURE §1).
 *
 * Two materials: graphite CHROME (the rail and the page ground — what the app is made of)
 * and one PAPER PANEL (what the work sits on), genuinely inset from the chrome with a real
 * edge. The panel scrolls internally; the chrome never moves. Depth comes from the material
 * split and the edge — there is not a shadow anywhere.
 *
 * No top bar. The rail carries identity and process; the panel carries the work; the
 * actions live at the end of the content, aligned to the content's own edge.
 */
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { ArrowLeft, ArrowRight, CheckSmall } from '../ui/icons'
import { SectionBriefing } from '../ui/SectionIntro'
import { useAppStore } from './storeContext'
import { MobileRail } from './MobileRail'
import { Rail } from './Rail'
import { validateSection } from './sectionValidation'

export function AppLayout({ children }: { children: ReactNode }) {
  const { state, dispatch, config } = useAppStore()
  const idx = config.sections.findIndex((s) => s.id === state.sectionId)
  const stage = config.sections[idx]
  const isFirst = idx === 0
  const isLast = idx === config.sections.length - 1
  const [attemptedSectionId, setAttemptedSectionId] = useState<string | null>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const validation = validateSection(stage.id, state.draft, {
    agency: config.agency,
    narrativeItemLabel: config.copy.narrativeItemLabel,
  })
  const showValidation = attemptedSectionId === stage.id && !validation.complete

  const go = (i: number) => {
    setAttemptedSectionId(null)
    dispatch({ type: 'go', sectionId: config.sections[i].id, index: i })
  }

  const continueForward = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validation.complete) {
      setAttemptedSectionId(stage.id)
      requestAnimationFrame(() => errorSummaryRef.current?.focus())
      return
    }
    go(idx + 1)
  }

  return (
    /* fixed inset-0: the app owns the viewport. Only the panel scrolls. */
    <div className="fixed inset-0 flex flex-col bg-rail lg:flex-row">
      <Rail />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileRail />

        {/* ── THE PANEL — one paper object on graphite ground, real margins, real edge ── */}
        <main className="min-h-0 flex-1 p-2.5 sm:p-3 lg:p-4">
          <div className="h-full overflow-y-auto rounded-[12px] border border-rail-line bg-surface">
            <div className="mx-auto max-w-[920px] px-6 pb-14 pt-9 sm:px-10 lg:px-12 lg:pt-11">
              <SectionBriefing section={stage} />

              {state.resumed && (
                <p className="mb-9 flex items-baseline justify-between gap-4 rounded-[6px] bg-ground px-4 py-3 text-[13px] text-muted">
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

              <form
                id="apply-section-form"
                data-validation-attempted={showValidation || undefined}
                onInvalidCapture={() => setAttemptedSectionId(stage.id)}
                onSubmit={continueForward}
              >
                {showValidation && (
                  <div
                    ref={errorSummaryRef}
                    role="alert"
                    tabIndex={-1}
                    className="mb-9 border-l-2 border-state py-0.5 pl-4 outline-none"
                  >
                    <p className="text-[14px] font-semibold text-ink">Complete this section</p>
                    <p className="mt-1 max-w-[62ch] text-[13.5px] leading-[1.55] text-muted">
                      {validation.issues.length}{' '}
                      {validation.issues.length === 1 ? 'answer needs' : 'answers need'}{' '}
                      attention. {validation.issues[0]?.message}
                    </p>
                  </div>
                )}

                {children}

                {/* ── actions — at the end of the work, on the content's own edge ──────── */}
                <div className="mt-14 flex items-center justify-end gap-2.5 border-t border-line/70 pt-7">
                  <p className="mr-auto flex items-center gap-1.5 text-[12.5px] text-muted">
                    <span className="text-accent">
                      <CheckSmall size={9} />
                    </span>
                    Saved on this computer
                  </p>
                  {!isFirst && (
                    <Button variant="ghost" onClick={() => go(idx - 1)}>
                      <ArrowLeft />
                      Back
                    </Button>
                  )}
                  {isLast ? (
                    <Button variant="primary" disabled title="The review step is being built.">
                      Generate my packet
                    </Button>
                  ) : (
                    <Button variant="primary" type="submit">
                      Continue
                      <ArrowRight />
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
