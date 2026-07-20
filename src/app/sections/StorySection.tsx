/**
 * Your story — STORY-LITE. One honest account per incident, written by hand.
 *
 * No API, no model. This is the manual seam the narrative assistant (AGENT_SPEC) later
 * replaces the innards of: the card list, the per-incident writing screen, and the
 * narrativeDraft it saves are all shapes the agent build keeps.
 *
 * Invariants in force: the account is the user's own words, period (L3 — nothing here can
 * add any). The coaching copy is STATIC and CITED — the §53.025(a) factors are quoted from
 * the statute via data/tdlr_links.json, and the general guidance is marked as general (L5).
 * One story per INCIDENT, never per charge — a person tells the story of a night, not of
 * a statute. No outcome language anywhere (L1).
 */
import { useState } from 'react'
import { Button } from '../../ui/Button'
import { CheckSmall, ArrowLeft } from '../../ui/icons'
import type { DraftIncident } from '../draft'
import { useAppStore } from '../storeContext'

function incidentSummary(i: DraftIncident) {
  return [i.dateOfConviction, i.county && `${i.county} County`, i.court]
    .filter(Boolean)
    .join(' · ')
}

function AccountCard({
  incident,
  ordinal,
  onOpen,
}: {
  incident: DraftIncident
  ordinal: number
  onOpen: () => void
}) {
  const written = incident.narrativeDraft.trim().length > 0
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-[8px] border border-line bg-field px-5 py-4 text-left transition-colors duration-150 hover:border-accent"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          written ? 'bg-accent text-field' : 'border border-line bg-surface'
        }`}
        aria-hidden="true"
      >
        {written && <CheckSmall size={9} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold uppercase tracking-[0.05em] text-muted">
          {incidentSummary(incident) || `Incident ${ordinal}`}
        </span>
        <span className="mt-1 block truncate text-[14.5px] font-medium text-ink">
          {incident.charges.map((c) => c.exactOffense || 'Untitled charge').join(' · ')}
        </span>
        <span className="mt-0.5 block text-[12.5px] text-muted">
          {incident.charges.length === 1 ? '1 record' : `${incident.charges.length} records`}
          {written && ' · account written'}
        </span>
      </span>
      <span className="shrink-0 text-[14px] font-semibold text-accent">
        {written ? 'Edit' : 'Write this account →'}
      </span>
    </button>
  )
}

function WritingScreen({ incident, onBack }: { incident: DraftIncident; onBack: () => void }) {
  const { dispatch, config } = useAppStore()
  const factors = config.storyFactors

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

      {/* The fact strip — every charge from that night, on screen while they write.
          That's what makes one honest account possible instead of amputated fragments. */}
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

      <div className="mt-8 grid grid-cols-1 gap-x-12 xl:grid-cols-[264px_minmax(0,1fr)]">
        {/* ── guidance — static, cited, and marked for what it is (L5) ── */}
        <aside className="flex flex-col gap-5">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">What {config.agency} asks for</h2>
            <p className="mt-1.5 text-[13.5px] leading-[1.6] text-muted">
              What exactly you did, and why — in your own words, not the offense name. One
              account covering everything from this arrest, together.
            </p>
          </div>
          <div className="rounded-[8px] border border-line bg-ground px-4 py-3.5">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              What the law says boards weigh
            </h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-ink/80">{factors.quote}</p>
            <p className="mt-1.5 text-[12px] font-medium text-muted">— {factors.cite}</p>
          </div>
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Worth covering, if true for you
            </h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-[13.5px] leading-[1.55] text-muted">
              {[
                'What happened',
                'Why things went the way they did',
                'What has changed since',
                'What you did to make it right',
              ].map((q) => (
                <li key={q} className="flex gap-2">
                  <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
                  {q}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] leading-[1.55] text-muted">
              In general, licensing boards look for an account that takes responsibility.
              This is your account to write — there is no required script.
            </p>
          </div>
        </aside>

        {/* ── the account — their words, a real writing surface ── */}
        <div className="mt-6 flex flex-col xl:mt-0">
          <label
            htmlFor={`account-${incident.id}`}
            className="text-[13px] font-medium tracking-[0.01em] text-muted"
          >
            Your account of this incident
            <span className="ml-0.5 text-state/80" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id={`account-${incident.id}`}
            value={incident.narrativeDraft}
            onChange={(e) =>
              dispatch({ type: 'update-incident', id: incident.id, patch: { narrativeDraft: e.target.value } })
            }
            placeholder="Start with what happened, in your own words."
            className="mt-1.5 min-h-[340px] w-full resize-y rounded-[6px] border border-line bg-field p-4 text-[15px] leading-[1.7] text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-muted/70"
          />
          <p className="mt-2 text-[12.5px] text-muted">
            Saved as you type. This goes onto the continuation sheet attached to this
            incident's forms, word for word.
          </p>
          <div className="mt-5 flex justify-end">
            <Button variant="primary" onClick={onBack}>
              Done with this account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StorySection() {
  const { state } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const incidents = state.draft.incidents
  const written = incidents.filter((i) => i.narrativeDraft.trim().length > 0).length

  const editing = incidents.find((i) => i.id === editingId)
  if (editing) return <WritingScreen incident={editing} onBack={() => setEditingId(null)} />

  if (incidents.length === 0) {
    return (
      <p className="text-[14.5px] text-muted">
        Nothing to write yet — your record has no incidents. Go back to Your record and add
        them first; each incident gets one account.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {incidents.map((incident, i) => (
        <AccountCard
          key={incident.id}
          incident={incident}
          ordinal={i + 1}
          onOpen={() => setEditingId(incident.id)}
        />
      ))}
      <p className="mt-2 text-right text-[13px] font-medium text-muted">
        {written} of {incidents.length} {incidents.length === 1 ? 'account' : 'accounts'} written
      </p>
    </div>
  )
}
