/**
 * Licenses — the one real selection in the flow (the old "Your trade" step was only a
 * guard; it lives on the state intro page now).
 *
 * Everything the state publishes is DATA, displayed and attributed — the catalog comes
 * from the config (verify-flagged in data/), the honesty banner is the agency's own
 * caveats (H1/H2), and the guidelines are an attributed LINK, not a paraphrase: quoting
 * crime categories waits for a reviewed data task, because a wrong quoted category on the
 * screen where we promise to quote the state is the one failure we can't have (L2, S3).
 *
 * No screening, no red lights, no recommendation. The agency decides; we count the fee.
 */
import { useState } from 'react'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/Field'
import { FieldGroup } from '../../ui/FieldGroup'
import { useAppStore } from '../storeContext'

function ProgramRow({ program, examples }: { program: string; examples: string[] }) {
  const { state, dispatch } = useAppStore()
  const [custom, setCustom] = useState('')

  const isSelected = (type: string) =>
    state.draft.licenses.some((l) => l.program === program && l.specificLicenseType === type)

  const toggle = (type: string) => {
    const index = state.draft.licenses.findIndex(
      (l) => l.program === program && l.specificLicenseType === type,
    )
    if (index >= 0) dispatch({ type: 'remove-license', index })
    else dispatch({ type: 'add-license', program, specificLicenseType: type })
  }

  const addCustom = () => {
    if (!custom.trim()) return
    dispatch({ type: 'add-license', program, specificLicenseType: custom.trim() })
    setCustom('')
  }

  return (
    <div className="rounded-[8px] border border-line bg-field px-5 py-4">
      <h3 className="text-[15px] font-semibold text-ink">{program}</h3>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {examples.map((type) => {
          const active = isSelected(type)
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => toggle(type)}
                aria-pressed={active}
                className={`inline-flex h-9 items-center gap-1.5 rounded-[5px] border px-3 text-[13.5px] transition-colors duration-150 ${
                  active
                    ? 'border-accent bg-accent/5 font-semibold text-accent'
                    : 'border-line bg-surface text-ink hover:border-muted/70'
                }`}
              >
                {active && <span aria-hidden="true">✓</span>}
                {type}
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex items-end gap-2">
        <div className="max-w-[300px] flex-1">
          <TextField
            label="A different license type in this program"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
            placeholder="Type it as the license names it"
          />
        </div>
        <Button variant="secondary" onClick={addCustom} disabled={!custom.trim()}>
          Add
        </Button>
      </div>
    </div>
  )
}

export function LicensesSection() {
  const { state, dispatch, config } = useAppStore()
  const licenses = state.draft.licenses
  const demo = config.catalog.filter((p) => p.demo)
  const rest = config.catalog.filter((p) => !p.demo)
  const total = licenses.length * config.feeUsd

  return (
    <div className="flex flex-col gap-8">
      <FieldGroup
        heading="Choose your license types"
        description={`Every license type you pick becomes its own complete packet with its own $${config.feeUsd} fee — ${config.agency} answers each one separately. Pick as many as you're considering.`}
      >
        {demo.map((p) => (
          <ProgramRow key={p.program} program={p.program} examples={p.examples} />
        ))}
        <details className="group">
          <summary className="cursor-pointer list-none text-[14px] font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show all {config.agency} programs ({rest.length} more) →</span>
            <span className="hidden group-open:inline">Hide the full program list</span>
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            {rest.map((p) => (
              <ProgramRow key={p.program} program={p.program} examples={p.examples} />
            ))}
          </div>
        </details>
        <p className="text-[13px] leading-relaxed text-muted">
          Don't see your trade? It may be licensed by a different board, not {config.agency} —{' '}
          <a
            href={config.links.agencySite.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            check {config.agency}'s site ↗
          </a>{' '}
          before spending time here.
        </p>
      </FieldGroup>

      {/* ── H1/H2 — the agency's own caveats, prominent, not a footnote ── */}
      <aside className="border-l-2 border-accent/60 py-1 pl-5">
        <p className="max-w-[62ch] text-[14px] leading-relaxed text-ink/85">{config.honestyBanner}</p>
        <a
          href={config.links.guidelines.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-[13px] font-medium text-accent hover:underline"
        >
          {config.links.guidelines.label} ↗
        </a>
      </aside>

      <FieldGroup
        heading="Your packets"
        description="One packet, one money order, per license type."
        last
      >
        {licenses.length === 0 ? (
          <p className="text-[14px] text-muted">
            Nothing chosen yet — pick a license type above to build your first packet.
          </p>
        ) : (
          <>
            <ul className="flex flex-col">
              {licenses.map((l, i) => (
                <li
                  key={`${l.program}::${l.specificLicenseType}`}
                  className="flex items-center justify-between gap-4 border-b border-line/60 py-3 first:pt-0"
                >
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold text-ink">
                      {l.specificLicenseType}
                    </span>
                    <span className="block text-[12.5px] text-muted">{l.program}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'remove-license', index: i })}
                    className="shrink-0 text-[12.5px] font-medium text-muted underline underline-offset-2 hover:text-ink"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-[14.5px] font-semibold text-ink">
              {licenses.length} license {licenses.length === 1 ? 'type' : 'types'} →{' '}
              {licenses.length} {licenses.length === 1 ? 'packet' : 'packets'} → {licenses.length}{' '}
              separate ${config.feeUsd} money {licenses.length === 1 ? 'order' : 'orders'} → $
              {total} total
            </p>
            <p className="-mt-3 text-[12.5px] text-muted">
              Each money order payable to {config.agency}. Not cash — the mailing checklist in
              your packet spells it out.
            </p>
          </>
        )}
      </FieldGroup>
    </div>
  )
}
