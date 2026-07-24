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
import { Notice } from '../ui/Notice'
import { SectionBriefing } from '../ui/SectionIntro'
import { useFocusMode } from './focusModeContext'
import { useAppStore } from './storeContext'
import { DeleteDataDialog } from './DeleteDataDialog'
import { MobileRail } from './MobileRail'
import { Rail } from './Rail'
import { SaveProgressDialog } from './SaveProgressDialog'
import { validateSection } from './sectionValidation'

export function AppLayout({ children }: { children: ReactNode }) {
  const { state, dispatch, config } = useAppStore()
  // Focus mode (the story workbench): the focused view owns the panel — no briefing,
  // no section Back/Continue, no validation notice. Its exits are its own.
  const focused = useFocusMode()
  const idx = config.sections.findIndex((s) => s.id === state.sectionId)
  const stage = config.sections[idx]
  const isFirst = idx === 0
  const isLast = idx === config.sections.length - 1
  const [attemptedSectionId, setAttemptedSectionId] = useState<string | null>(null)
  const [saveProgressOpen, setSaveProgressOpen] = useState(false)
  const [deleteDataOpen, setDeleteDataOpen] = useState(false)
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
      <Rail
        onSaveProgress={() => setSaveProgressOpen(true)}
        onDeleteData={() => setDeleteDataOpen(true)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileRail
          onSaveProgress={() => setSaveProgressOpen(true)}
          onDeleteData={() => setDeleteDataOpen(true)}
        />

        {/* ── THE PANEL — one paper object on graphite ground, real margins, real edge ── */}
        <main className="min-h-0 flex-1 p-2.5 sm:p-3 lg:p-4">
          <div className="h-full overflow-y-auto rounded-[12px] border border-rail-line bg-surface">
            {!focused && <SectionBriefing section={stage} />}

            <div
              className={`mx-auto max-w-[920px] px-6 pb-14 sm:px-10 lg:px-12 ${focused ? 'pt-9 lg:pt-11' : 'pt-10 lg:pt-12'}`}
            >
              <form
                id="apply-section-form"
                data-validation-attempted={showValidation || undefined}
                onInvalidCapture={() => setAttemptedSectionId(stage.id)}
                onSubmit={continueForward}
              >
                {children}

                {/* ── the validation notice lives WITH the button that raised it — a warning
                       rendered a screen away from the click is a warning nobody sees ──── */}
                {!focused && showValidation && (
                  <Notice
                    ref={errorSummaryRef}
                    tabIndex={-1}
                    variant="attention"
                    title="Before you continue"
                    className="mt-14"
                  >
                    {validation.issues[0]?.message}
                    {validation.issues.length > 1 && (
                      <> And {validation.issues.length - 1} more like it above.</>
                    )}
                  </Notice>
                )}

                {/* ── actions — at the end of the work, on the content's own edge ──────── */}
                {!focused && (
                <div
                  className={`flex items-center justify-end gap-2.5 border-t border-line/70 pt-7 ${showValidation ? 'mt-5 border-t-0 pt-0' : 'mt-14'}`}
                >
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
                  {/* The last section owns its own primary action (Generate lives inside
                      Review, at the wall). The cluster keeps Back + the saved whisper. */}
                  {!isLast && (
                    <Button variant="primary" type="submit">
                      Continue
                      <ArrowRight />
                    </Button>
                  )}
                </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
      <DeleteDataDialog
        open={deleteDataOpen}
        onOpenChange={setDeleteDataOpen}
        onSaveProgress={() => setSaveProgressOpen(true)}
      />
      <SaveProgressDialog open={saveProgressOpen} onOpenChange={setSaveProgressOpen} />
    </div>
  )
}
