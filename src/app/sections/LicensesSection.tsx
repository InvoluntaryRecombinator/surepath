/**
 * Licenses — one flat checkbox list of every program the agency licenses, in the agency's
 * own order and the agency's own wording (stateConfig.programs ← data/, the single source
 * of truth). No grouping, no free text: the old custom input produced garbage packets
 * ("dd"), and the checked label writes VERBATIM into the license-type field of that
 * packet's form — so the only selectable values are the agency's real program names.
 *
 * No screening, no red lights, no recommendation (L2). The agency decides; we count the fee.
 */
import { useAppStore } from '../storeContext'

export function LicensesSection() {
  const { state, dispatch, config } = useAppStore()
  const licenses = state.draft.licenses

  const selectedIndex = (program: string) =>
    licenses.findIndex((l) => l.specificLicenseType === program)

  const toggle = (program: string) => {
    const index = selectedIndex(program)
    if (index >= 0) dispatch({ type: 'remove-license', index })
    else dispatch({ type: 'add-license', program, specificLicenseType: program })
  }

  return (
    <div className="flex flex-col gap-10">
      {/* ── the list — all 41, flat, visible at once ── */}
      <div>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
          {config.programs.map((program) => {
            const active = selectedIndex(program) >= 0
            return (
              <li key={program}>
                <label className="flex cursor-pointer items-start gap-3 rounded-[5px] px-2 py-[7px] transition-colors duration-150 hover:bg-ground">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(program)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  />
                  <span
                    className={`text-[14px] leading-snug ${active ? 'font-semibold text-ink' : 'text-ink/85'}`}
                  >
                    {program}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        <p className="mt-6 text-[13px] leading-relaxed text-muted">
          Don't see your trade? It may be licensed by a different board —{' '}
          <a
            href={config.links.agencySite.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            check {config.agency}'s site ↗
          </a>
        </p>
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
