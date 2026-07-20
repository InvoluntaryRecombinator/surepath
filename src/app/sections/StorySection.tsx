/**
 * Your story — the account LIST IS THE HUB. Each card opens the workbench (full panel
 * takeover via focus mode); "Save and continue" in the workbench always lands back here —
 * seeing the finished set is the closure, and the next unfinished card is unmissable.
 * When every account is written and affirmed, the confirmation notice says so plainly and
 * the section's own Continue advances to Licenses.
 *
 * One story per INCIDENT, never per charge — a person tells the story of a night, not of
 * a statute. An account counts when it is written AND affirmed (§7).
 */
import { useState } from 'react'
import { CheckSmall } from '../../ui/icons'
import { Notice } from '../../ui/Notice'
import { formatLongDate } from '../lib/format'
import type { DraftIncident } from '../draft'
import { useHoldFocus } from '../focusModeContext'
import { useAppStore } from '../storeContext'
import { StoryWorkbench } from './story/StoryWorkbench'

function incidentSummary(i: DraftIncident) {
  return [formatLongDate(i.dateOfConviction), i.county && `${i.county} County`, i.court]
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
  const written = incident.narrative.draft.trim().length > 0
  const confirmed = written && incident.narrative.affirmed
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-4 rounded-[8px] border border-line bg-field px-5 py-4 text-left transition-colors duration-150 hover:border-accent ${
        confirmed ? '' : 'border-l-[3px] border-l-accent'
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          confirmed ? 'bg-accent text-field' : 'border border-line bg-surface'
        }`}
        aria-hidden="true"
      >
        {confirmed && <CheckSmall size={9} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold uppercase tracking-[0.05em] text-muted">
          {incidentSummary(incident) || `Incident ${ordinal}`}
        </span>
        <span
          className={`mt-1 block truncate text-[14.5px] font-medium ${confirmed ? 'text-ink/70' : 'text-ink'}`}
        >
          {incident.charges.map((c) => c.exactOffense || 'Untitled charge').join(' · ')}
        </span>
        <span className="mt-0.5 block text-[12.5px] text-muted">
          {incident.charges.length === 1 ? '1 record' : `${incident.charges.length} records`}
          {confirmed ? ' · confirmed' : written ? ' · needs your confirmation' : ' · still to write'}
        </span>
      </span>
      <span
        className={`shrink-0 text-[14px] font-semibold ${confirmed ? 'text-muted' : 'text-accent'}`}
      >
        {confirmed ? 'Edit' : written ? 'Review & confirm →' : 'Write this account →'}
      </span>
    </button>
  )
}

export function StorySection() {
  const { state } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const incidents = state.draft.incidents
  const confirmed = incidents.filter(
    (i) => i.narrative.draft.trim().length > 0 && i.narrative.affirmed,
  ).length
  const allDone = incidents.length > 0 && confirmed === incidents.length

  const editing = incidents.find((i) => i.id === editingId)
  useHoldFocus(editing !== undefined)
  if (editing) return <StoryWorkbench incident={editing} onBack={() => setEditingId(null)} />

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
      {allDone ? (
        <Notice variant="success" className="mt-2">
          {incidents.length === 1
            ? 'Your account is written and confirmed.'
            : `All ${incidents.length} accounts are written and confirmed.`}{' '}
          Continue when you're ready.
        </Notice>
      ) : (
        <p className="mt-2 text-right text-[13px] font-medium text-muted">
          {confirmed} of {incidents.length} {incidents.length === 1 ? 'account' : 'accounts'}{' '}
          written and confirmed
        </p>
      )}
    </div>
  )
}
