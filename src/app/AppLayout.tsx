/**
 * <AppLayout> — the application's shell (SITE_STRUCTURE §1): the rail on the left, a
 * continuous light SHEET on the right. The rail↔sheet seam is the strongest structural
 * contrast on screen — that seam, not decoration, is what makes the nav read as its own
 * place and the content read as a canvas.
 *
 * The sheet is anchored top and bottom: a content header bar (step position left, the
 * saved-state whisper right) and the action bar. Nothing floats.
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
  const validation = validateSection(stage.id, state.draft)
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
    /* fixed inset-0: the app owns the viewport. The document can never scroll the frame —
       only the content pane scrolls. Modal-feel, page-mechanics (SITE_STRUCTURE §2). */
    <div className="fixed inset-0 flex bg-surface">
      <Rail />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileRail />
        {/* ── the content header bar — the pane's top edge. The rail already says where
            you are; this bar carries the one thing nothing else says: the formal name of
            the legal artifact being assembled. ─────────────────────────────────────────── */}
        <header className="hidden h-[60px] shrink-0 items-center justify-between border-b border-line/70 px-14 lg:flex">
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
          <SectionBriefing section={stage} />
          <div className="px-5 pb-16 pt-7 sm:px-8 sm:pb-20 sm:pt-9 lg:px-14">
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
            <form
              id="apply-section-form"
              className="max-w-[960px]"
              data-validation-attempted={showValidation || undefined}
              onInvalidCapture={() => setAttemptedSectionId(stage.id)}
              onSubmit={continueForward}
            >
              {showValidation && (
                <div
                  ref={errorSummaryRef}
                  role="alert"
                  tabIndex={-1}
                  className="mb-8 border-l-2 border-state py-0.5 pl-4 outline-none"
                >
                  <p className="text-[14px] font-semibold text-ink">Complete this section</p>
                  <p className="mt-1 max-w-[62ch] text-[13.5px] leading-[1.55] text-muted">
                    {validation.issues.length}{' '}
                    {validation.issues.length === 1 ? 'answer needs' : 'answers need'} attention.{' '}
                    {validation.issues[0]?.message}
                  </p>
                </div>
              )}
              {children}
            </form>
          </div>
        </main>

        {/* ── the action bar — the pane's bottom edge ──────────────────────────────── */}
        <footer className="shrink-0 border-t border-line/70">
          <div className="px-5 sm:px-8 lg:px-14">
            <div className="flex h-[68px] max-w-[960px] items-center justify-between">
              <Button variant="ghost" disabled={isFirst} onClick={() => go(idx - 1)}>
                <ArrowLeft />
                Back
              </Button>
              {isLast ? (
                <Button variant="primary" disabled title="The review step is being built.">
                  Generate my packet
                </Button>
              ) : (
                <Button variant="primary" type="submit" form="apply-section-form">
                  Continue
                  <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
