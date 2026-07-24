/**
 * Licenses — one flat checkbox list of every program the agency licenses, in the agency's
 * own order and the agency's own wording (stateConfig.programs ← data/, the single source
 * of truth). No grouping, no free text: the old custom input produced garbage packets
 * ("dd"), and the checked label writes VERBATIM into the license-type field of that
 * packet's form — so the only selectable values are the agency's real program names.
 *
 * Findability, two mechanisms, browsing always primary:
 *   - COLUMN FLOW: the order runs DOWN the left column, then down the right — an
 *     alphabetical list you can actually scan (row-fill made the alphabet zigzag).
 *   - A QUIET TYPE-TO-FILTER with trade aliases, because the agency's names aren't what
 *     people call their jobs ("hvac" finds Air Conditioning and Refrigeration
 *     Contractors; "tow truck" finds Tow Trucks, Operators and VSFs). Empty filter =
 *     ALL programs visible; nothing is ever hidden by default, and clearing restores
 *     the full list. People who don't know what's offered must be able to see it all.
 *
 * No screening, no red lights, no recommendation (L2). The agency decides; we count the fee.
 */
import { useState } from 'react'
import { useAppStore } from '../storeContext'

export function LicensesSection() {
  const { state, dispatch, config } = useAppStore()
  const licenses = state.draft.licenses
  const [query, setQuery] = useState('')

  const selectedIndex = (name: string) =>
    licenses.findIndex((l) => l.specificLicenseType === name)

  const toggle = (name: string) => {
    const index = selectedIndex(name)
    if (index >= 0) dispatch({ type: 'remove-license', index })
    else dispatch({ type: 'add-license', program: name, specificLicenseType: name })
  }

  const q = query.trim().toLowerCase()
  const visible = q
    ? config.programs.filter(
        (p) => p.name.toLowerCase().includes(q) || p.aliases.some((a) => a.includes(q)),
      )
    : config.programs

  // Column flow: first half runs down the LEFT column, second half down the right —
  // the alphabet reads vertically instead of zigzagging across rows.
  const mid = Math.ceil(visible.length / 2)
  const columns = visible.length > 6 ? [visible.slice(0, mid), visible.slice(mid)] : [visible]

  const row = (p: { name: string }) => {
    const active = selectedIndex(p.name) >= 0
    return (
      <li key={p.name}>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-[5px] border px-2 py-[7px] transition-colors duration-150 ${
            active
              ? 'border-accent bg-accent/[0.08]'
              : 'border-line bg-field hover:border-muted/70'
          }`}
        >
          <input
            type="checkbox"
            checked={active}
            onChange={() => toggle(p.name)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
          />
          <span
            className={`text-[14px] leading-snug ${active ? 'font-semibold text-ink' : 'text-ink/85'}`}
          >
            {p.name}
          </span>
        </label>
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        {/* ── the quiet filter — a shortcut, never a gate: empty shows everything ── */}
        <div className="mb-5 flex items-baseline gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find your trade — start typing…"
            aria-label="Filter the program list"
            className="w-full max-w-[340px] rounded-[5px] border border-line bg-field px-3.5 py-2 text-[14px] text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-muted/70"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 text-[13px] font-medium text-accent hover:underline"
            >
              Show all {config.programs.length}
            </button>
          )}
        </div>

        {visible.length > 0 ? (
          <div className={`grid grid-cols-1 gap-x-8 ${columns.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {columns.map((col, i) => (
              <ul key={i} className="flex flex-col gap-y-1">
                {col.map(row)}
              </ul>
            ))}
          </div>
        ) : (
          /* usually just a wrong search word — the Show-all next to the bar is the way
             back, and the standing line below covers the genuinely-not-listed case */
          <p className="text-[14px] leading-relaxed text-muted">
            Nothing here matches "{query}".
          </p>
        )}

        {/* composed, not clamped: the lead-in stands alone and each sentence owns its
            line, so breaks land at sentence boundaries instead of wherever a width
            limit happens to cut */}
        <div className="mt-7 border-t border-line/70 pt-5 text-[13px] leading-relaxed text-muted">
          <p className="text-[13.5px] font-semibold text-ink/80">Don't see your trade?</p>
          <p className="mt-1.5">
            These are the trades currently licensed by the {config.agencyFullName}.
          </p>
          <p>
            Other licensed occupations may have their own pathways, not yet covered by
            SurePath —{' '}
            <a
              href={config.links.agencySite.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              check {config.agency}'s site ↗
            </a>{' '}
            for trades not listed here.
          </p>
        </div>
      </div>

      {/* ── your packets ── */}
      {licenses.length > 0 && (
        <div className="border-t border-line pt-7">
          <h2 className="text-[17px] font-bold text-ink">Your packets</h2>
          <ul className="mt-3 flex flex-col">
            {licenses.map((l, i) => (
              <li
                key={`${l.specificLicenseType}::${i}`}
                className="flex items-center justify-between gap-4 border-b border-line/60 py-3 first:pt-0"
              >
                <span className="text-[14.5px] font-semibold text-ink">
                  {l.specificLicenseType}
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
          <p className="mt-4 text-[14.5px] font-semibold text-ink">
            {licenses.length} {licenses.length === 1 ? 'license' : 'licenses'} →{' '}
            {licenses.length} {licenses.length === 1 ? 'packet' : 'packets'} → $
            {licenses.length * config.feeUsd} total
          </p>
          <p className="mt-1.5 text-[12.5px] text-muted">
            You'll need a check or money order for each packet. The cover sheet in each
            packet explains exactly how to fill it out.
          </p>
        </div>
      )}
    </div>
  )
}
