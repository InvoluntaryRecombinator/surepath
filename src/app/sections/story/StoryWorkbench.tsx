/**
 * The workbench (AGENT_SPEC §3) — a workspace, NOT a chatbot. Three regions:
 *
 *   A. the fact strip — every charge from that night, pinned while they write
 *   B. the exchange — a written interview: typeset prompts and answers. No bubbles, no
 *      avatars, no timestamps, no typing dots, no paper-plane.
 *   C. the account — the only thing that ever reaches the packet, editable, with the
 *      model's self-reported assumptions ("worth checking" — transparency, not
 *      verification) and the §7 affirmation.
 *
 * The manual path is first-class: type into C and save, zero model involvement. When the
 * assistant is unavailable, that path is the degradation — nothing locks.
 */
import { Button } from '../../../ui/Button'
import { ArrowLeft } from '../../../ui/icons'
import { InfoBubble } from '../../../ui/InfoBubble'
import type { DraftIncident, RawAnswers } from '../../draft'
import { useAppStore } from '../../storeContext'
import { useNarrativeAssistant } from './useNarrativeAssistant'
import { useState } from 'react'

const RAW_PROMPTS: { key: keyof RawAnswers; label: string }[] = [
  { key: 'facts', label: 'What happened?' },
  { key: 'why', label: 'Why did things go the way they did?' },
  { key: 'whatChanged', label: 'What has changed since then?' },
  { key: 'madeItRight', label: 'What have you done to make it right?' },
]

function incidentSummary(i: DraftIncident) {
  return [i.dateOfConviction, i.county && `${i.county} County`, i.court].filter(Boolean).join(' · ')
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
  const started = a.state.messages.length > 0

  const sendCurrent = () => {
    if (!message.trim()) return
    a.send(message.trim())
    setMessage('')
  }

  const save = () => {
    a.commit()
    onBack()
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent hover:underline"
      >
        <ArrowLeft size={14} />
        Back to your accounts
      </button>

      {/* ── A · the fact strip — pinned; every charge from that night ── */}
      <div className="mt-5 rounded-[8px] border border-line bg-ground px-5 py-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted">
          {incidentSummary(incident)}
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {incident.charges.map((c) => (
            <li
              key={c.id}
              className="rounded-[5px] border border-line bg-field px-2.5 py-1 text-[13px] font-medium text-ink"
            >
              {c.exactOffense || 'Untitled charge'}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── B · the exchange — a written interview ── */}
        <section aria-label="The interview">
          <h2 className="text-[15px] font-semibold text-ink">Tell it in pieces</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Answer what you can — rough words are fine. Or skip all of this and write your
            account directly on the right.
          </p>

          <div className="mt-4 flex flex-col gap-3.5">
            {RAW_PROMPTS.map((p) => (
              <div key={p.key}>
                <label
                  htmlFor={`raw-${incident.id}-${p.key}`}
                  className="text-[13px] font-medium text-muted"
                >
                  {p.label}
                </label>
                <textarea
                  id={`raw-${incident.id}-${p.key}`}
                  value={incident.narrative.rawAnswers[p.key]}
                  onChange={(e) => a.updateRawAnswers({ [p.key]: e.target.value })}
                  rows={2}
                  className="mt-1 w-full resize-y rounded-[6px] border border-line bg-field px-3 py-2 text-[14px] leading-relaxed text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-muted/70"
                />
              </div>
            ))}
          </div>

          {/* the exchange thread — typeset, not bubbled */}
          {a.state.messages.length > 0 && (
            <div className="mt-6 flex flex-col gap-4 border-t border-line/60 pt-5">
              {a.state.messages.map((m, i) =>
                m.role === 'assistant' ? (
                  <div key={i} className="border-l-2 border-accent/50 pl-3.5">
                    <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink/85">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <p key={i} className="text-[14px] leading-relaxed text-ink">
                    {m.content}
                  </p>
                ),
              )}
            </div>
          )}

          {a.network === 'working' && (
            <p className="mt-4 text-[13px] italic text-muted">Working on it…</p>
          )}
          {a.network === 'unavailable' && (
            <div className="mt-4 rounded-[6px] bg-ground px-4 py-3">
              <p className="text-[13px] leading-relaxed text-muted">
                The assistant isn't available right now — you can keep writing your account
                yourself on the right.{' '}
                <button
                  type="button"
                  onClick={a.retry}
                  className="font-medium text-accent hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          )}

          {a.state.status !== 'committed' && a.network !== 'unavailable' && (
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="flex items-end gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendCurrent()
                    }
                  }}
                  rows={2}
                  placeholder={
                    started ? 'Reply here…' : 'Or just tell it here, in your own words…'
                  }
                  className="w-full resize-y rounded-[6px] border border-line bg-field px-3 py-2 text-[14px] leading-relaxed text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-muted/70"
                />
                <Button
                  variant="secondary"
                  onClick={sendCurrent}
                  disabled={a.network === 'working' || !message.trim()}
                >
                  {started ? 'Send' : 'Help me with this'}
                </Button>
              </div>
              {/* Write it now — the escape hatch, visible from turn 1. Gather, never gate. */}
              <button
                type="button"
                onClick={a.writeItNow}
                disabled={a.network === 'working'}
                className="self-start text-[13px] font-medium text-accent hover:underline disabled:opacity-40"
              >
                Write it now from what I've given →
              </button>
            </div>
          )}
        </section>

        {/* ── C · the account — the artifact ── */}
        <section aria-label="Your account">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[15px] font-semibold text-ink">Your account of this incident</h2>
            <InfoBubble label="Your account">
              This exact text goes onto the continuation sheet attached to this incident's
              forms, word for word. Edit it freely — it is yours, and nothing is sent to
              {' '}{config.agency} until you print and mail.
            </InfoBubble>
          </div>

          {a.pendingReplacement && (
            <div className="mt-3 rounded-[6px] border border-line bg-ground px-4 py-3">
              <p className="text-[13.5px] leading-relaxed text-ink/85">
                The assistant wrote a new draft, but you've edited this account by hand.
                Replace your version?
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
            value={a.state.account}
            onChange={(e) => a.editAccount(e.target.value)}
            placeholder="Start with what happened, in your own words."
            className="mt-3 min-h-[300px] w-full resize-y rounded-[6px] border border-line bg-field p-4 text-[15px] leading-[1.7] text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-muted/70"
          />

          {a.state.accountSource === 'model' && a.state.assumptions.length > 0 && (
            <div className="mt-3 rounded-[6px] border border-line bg-ground px-4 py-3">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-muted">
                Worth checking
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                The assistant filled these in — reported by it, not verified. Make sure
                they're right:
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {a.state.assumptions.map((s) => (
                  <li key={s} className="flex gap-2 text-[13px] leading-snug text-ink/80">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-state/70" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* §7 — the affirmation. The one layer a clever prompt cannot game. */}
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[8px] border border-line bg-ground px-4 py-3.5">
            <input
              type="checkbox"
              checked={a.state.affirmed}
              disabled={a.state.account.trim().length === 0}
              onChange={(e) => a.setAffirmed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-accent"
            />
            <span className="text-[13.5px] leading-relaxed text-ink/85">
              This is the account that goes on your forms. Read it and confirm it's accurate —
              you're signing that this is your own true account.
            </span>
          </label>

          <div className="mt-4 flex items-center justify-end gap-3">
            <p className="mr-auto text-[12.5px] text-muted">Saved on this computer as you type.</p>
            <Button variant="primary" onClick={save} disabled={!a.canCommit}>
              Save this account
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
