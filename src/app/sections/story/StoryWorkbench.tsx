/**
 * The workbench (AGENT_SPEC §3) — a full panel takeover (focus mode), built as ONE
 * element, not floating strips:
 *
 *   ┌─ the card ────────────────────────────────────────────┐
 *   │ dark header band — date (long form), county, court,   │
 *   │   every charge as a chip                              │
 *   │ coverage sub-band (light) — only while an interview   │
 *   │   is actually running; meaningless circles never show │
 *   │ the conversation — agent turns with a left accent     │
 *   │   rule, user turns in tinted blocks                   │
 *   │ input footer — Send · Skip this · Write it now        │
 *   └───────────────────────────────────────────────────────┘
 *   below, once a draft exists: the account (auto-grown to its full length — nobody signs
 *   text they read through a six-line keyhole), the §7 affirmation, Back · Save and
 *   continue. Save always lands on the account list — seeing the set is the closure.
 *
 * The conversation IS the collection mechanism — the model judges what's thin and probes;
 * code renders and bounds. The manual path survives as "Skip the interview — I'll write it
 * myself," and auto-reveals when the assistant is unavailable. On a return visit the
 * conversation opens in revision mode: the account is the substrate (context.currentAccount)
 * and the intro says so.
 */
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../ui/Button'
import { ArrowLeft } from '../../../ui/icons'
import { Notice } from '../../../ui/Notice'
import type { StageKey, StageLevel } from '../../../agent/turns'
import { formatLongDate } from '../../lib/format'
import type { DraftIncident } from '../../draft'
import { useAppStore } from '../../storeContext'
import { useNarrativeAssistant } from './useNarrativeAssistant'

const STAGE_LABELS: { key: StageKey; label: string }[] = [
  { key: 'what', label: 'What happened' },
  { key: 'why', label: 'Why' },
  { key: 'changed', label: "What's changed" },
  { key: 'right', label: 'Making it right' },
]

function StageMarker({ label, level, skipped }: { label: string; level: StageLevel; skipped: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full border transition-colors duration-150 ${
          skipped
            ? 'border-muted/50 bg-transparent'
            : level === 'covered'
              ? 'border-accent bg-accent'
              : level === 'thin'
                ? 'border-accent bg-accent/30'
                : 'border-line bg-transparent'
        }`}
      />
      <span
        className={`text-[12px] font-medium transition-colors duration-150 ${
          skipped ? 'text-muted/60 line-through' : level === 'empty' ? 'text-muted' : 'text-ink'
        }`}
      >
        {label}
      </span>
      <span className="sr-only">
        {skipped ? '— skipped' : level === 'covered' ? '— covered' : level === 'thin' ? '— needs detail' : '— not yet discussed'}
      </span>
    </span>
  )
}

export function StoryWorkbench({
  incident,
  onBack,
}: {
  incident: DraftIncident
  onBack: () => void
}) {
  const { config } = useAppStore()
  const a = useNarrativeAssistant(incident)
  const [message, setMessage] = useState('')
  const [manualRevealed, setManualRevealed] = useState(incident.narrative.draft.trim().length > 0)
  const endOfThread = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLTextAreaElement>(null)

  const started = a.state.messages.length > 0
  const hasDraft = a.state.account.trim().length > 0
  const showAccount = hasDraft || manualRevealed || a.network === 'unavailable'
  // The circles mean nothing outside a live interview — on a return visit they'd all sit
  // empty next to a finished account. Structure that lies gets hidden, not explained.
  const showCoverage = a.state.turnCount > 0 && a.state.status === 'gathering'

  useEffect(() => {
    endOfThread.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [a.state.messages.length, a.network])

  // The account grows to its content: what they affirm is what they can SEE, whole.
  useEffect(() => {
    const el = accountRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight + 2}px`
    }
  }, [a.state.account, showAccount])

  const sendCurrent = () => {
    if (!message.trim() || a.network === 'working') return
    a.send(message.trim())
    setMessage('')
  }

  const save = () => {
    a.commit()
    onBack()
  }

  return (
    <div>
      {/* ── THE CARD — facts, coverage, conversation, input: one object ─────────────── */}
      <div className="overflow-hidden rounded-[10px] border border-line bg-field">
        {/* header band — chrome material, part of the card */}
        <div className="bg-rail px-6 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-rail-muted">
            {/* both dates, labeled — the account narrates the events date while the court
                record carries the disposition date; showing one reads as a mismatch */}
            {[
              incident.dateCrimeCommitted &&
              incident.dateCrimeCommitted !== incident.dateOfConviction
                ? `events ${formatLongDate(incident.dateCrimeCommitted)}`
                : null,
              incident.dateOfConviction && `resolved ${formatLongDate(incident.dateOfConviction)}`,
              incident.county && `${incident.county} County`,
              incident.court,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {incident.charges.map((c) => (
              <li
                key={c.id}
                className="rounded-[5px] border border-rail-line bg-rail-inset px-2.5 py-0.5 text-[13px] font-medium text-rail-ink"
              >
                {c.exactOffense || 'Untitled charge'}
              </li>
            ))}
          </ul>
        </div>

        {/* coverage sub-band — light ground, legible, only while the interview runs */}
        {showCoverage && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-ground px-6 py-2.5">
            {STAGE_LABELS.map((s) => (
              <StageMarker
                key={s.key}
                label={s.label}
                level={a.state.stages[s.key]}
                skipped={a.state.skippedStages.includes(s.key)}
              />
            ))}
          </div>
        )}

        {/* the conversation */}
        <div className="px-6 py-6">
          <div className="mx-auto max-w-[72ch]">
            {!started &&
              (hasDraft ? (
                <p className="text-[15px] leading-relaxed text-ink/80">
                  Your account is below. Tell me what you'd like changed — or edit it
                  yourself, it's yours.
                </p>
              ) : (
                <p className="text-[15px] leading-relaxed text-ink/80">
                  Tell what happened that day, in your own words — rough is fine. A few short
                  questions may follow, one at a time; skip any of them. When there's enough,
                  the account gets written below, and it stays yours to edit.
                </p>
              ))}

            <div className={`flex flex-col gap-5 ${started ? '' : 'mt-5'}`}>
              {a.state.messages.map((m, i) =>
                m.role === 'assistant' ? (
                  <div key={i} className="border-l-2 border-accent/50 py-0.5 pl-4">
                    {m.content.split('\n\n').map((para, j) => {
                      const isQuestion =
                        a.state.pendingFollowUp !== null &&
                        i === a.state.messages.length - 1 &&
                        para.startsWith(a.state.pendingFollowUp.question)
                      return isQuestion ? (
                        <div key={j} className={j > 0 ? 'mt-3' : ''}>
                          <p className="text-[15px] font-semibold leading-relaxed text-ink">
                            {a.state.pendingFollowUp!.question}
                          </p>
                          {a.state.pendingFollowUp!.reason && (
                            <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted">
                              {a.state.pendingFollowUp!.reason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p
                          key={j}
                          className={`whitespace-pre-line text-[14.5px] leading-relaxed text-ink/85 ${j > 0 ? 'mt-3' : ''}`}
                        >
                          {para}
                        </p>
                      )
                    })}
                  </div>
                ) : (
                  <div key={i} className="rounded-[8px] bg-ground px-4 py-3">
                    <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink">
                      {m.content}
                    </p>
                  </div>
                ),
              )}

              {a.network === 'working' && (
                <p className="text-[13px] italic text-muted">Working on it…</p>
              )}
              {a.network === 'unavailable' && (
                <Notice variant="info">
                  The assistant isn't available right now — your account editor is open
                  below; keep writing yourself.{' '}
                  <button type="button" onClick={a.retry} className="font-medium text-accent hover:underline">
                    Try again
                  </button>
                </Notice>
              )}
              <div ref={endOfThread} />
            </div>
          </div>
        </div>

        {/* the input — the card's footer */}
        {a.state.status !== 'committed' && a.network !== 'unavailable' && (
          <div className="border-t border-line bg-ground/60 px-6 py-4">
            <div className="mx-auto max-w-[72ch]">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendCurrent()
                  }
                }}
                rows={started ? 3 : 5}
                placeholder={
                  started
                    ? 'Your answer…'
                    : hasDraft
                      ? 'Tell me what you’d like changed…'
                      : 'Start here, in your own words…'
                }
                className="w-full resize-y rounded-[8px] border border-line bg-field px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-muted/70"
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Button variant="primary" onClick={sendCurrent} disabled={a.network === 'working' || !message.trim()}>
                  Send
                </Button>
                {a.state.pendingFollowUp && (
                  <button
                    type="button"
                    onClick={a.skip}
                    disabled={a.network === 'working'}
                    className="text-[13.5px] font-medium text-muted underline underline-offset-2 hover:text-ink disabled:opacity-40"
                  >
                    Skip this
                  </button>
                )}
                {started && !hasDraft && (
                  <button
                    type="button"
                    onClick={a.writeItNow}
                    disabled={a.network === 'working'}
                    className="text-[13.5px] font-medium text-accent hover:underline disabled:opacity-40"
                  >
                    Write it now from what I've given →
                  </button>
                )}
                <span className="ml-auto hidden text-[11.5px] text-muted sm:block">⏎ to send</span>
              </div>
              {!showAccount && (
                <button
                  type="button"
                  onClick={() => setManualRevealed(true)}
                  className="mt-3 text-[13px] font-medium text-muted underline underline-offset-2 hover:text-ink"
                >
                  Skip the interview — I'll write it myself
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── the account — nothing here until a draft exists (or the manual path) ─────── */}
      {showAccount && (
        <div className="mx-auto mt-10 max-w-[72ch] border-t-2 border-line pt-8">
          <h2 className="text-[17px] font-bold text-ink">Your account of this incident</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            This exact text goes onto the continuation sheet attached to this incident's
            forms, word for word. Edit it freely — it's yours.
          </p>

          {a.pendingReplacement && (
            <div className="mt-4 rounded-[8px] border border-line bg-ground px-4 py-3.5">
              <p className="text-[13.5px] leading-relaxed text-ink/85">
                Here's a revised account. Replace the current version? Your current text is
                kept until you choose.
              </p>
              <div className="mt-2.5 flex gap-2">
                <Button variant="secondary" onClick={a.acceptReplacement}>
                  Replace with the new draft
                </Button>
                <Button variant="ghost" onClick={a.declineReplacement}>
                  Keep mine
                </Button>
              </div>
            </div>
          )}

          <textarea
            ref={accountRef}
            value={a.state.account}
            onChange={(e) => a.editAccount(e.target.value)}
            placeholder="Write your account here, in your own words."
            className="mt-4 min-h-[280px] w-full resize-none overflow-hidden rounded-[8px] border border-line bg-field p-4 text-[15px] leading-[1.7] text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-muted/70"
          />

          {/* §7 — the affirmation. The one layer a clever prompt cannot game. */}
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[8px] border border-line bg-ground px-4 py-3.5">
            <input
              type="checkbox"
              checked={a.state.affirmed}
              disabled={!hasDraft}
              onChange={(e) => a.setAffirmed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-accent"
            />
            <span className="text-[13.5px] leading-relaxed text-ink/85">
              This account goes on the forms sent to the licensing board. Read it and
              confirm it's accurate — when you sign the printed forms, you're affirming
              this is your own true account.
            </span>
          </label>
        </div>
      )}

      {/* ── exits — the workbench owns them; Save always lands on the account list ──── */}
      <div className="mx-auto mt-8 flex max-w-[72ch] items-center justify-end gap-2.5 border-t border-line/70 pt-6">
        <p className="mr-auto text-[12.5px] text-muted">Saved on this computer as you type.</p>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
        {showAccount && (
          <Button variant="primary" onClick={save} disabled={!a.canCommit}>
            Save and continue
          </Button>
        )}
      </div>
      <span className="sr-only">{config.agency}</span>
    </div>
  )
}
