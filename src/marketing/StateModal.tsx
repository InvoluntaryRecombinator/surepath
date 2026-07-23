/**
 * The state modal — "Find your state" opens this over the landing page. A floating
 * card (soft ambient shadow — modals float; buttons stamp), 1px warm grey edge, 4px
 * radius, three zones:
 *   cream header · "Choose your state" in ink, X at the title's optical center,
 *                  3px gold rule along the band's bottom edge
 *   map          · the flat continental map filling the band with modest margins,
 *                  drawn TEXAS leader label, the licensing sentence as its caption
 *   warm control · State select (Texas chosen, others disabled) + Get started,
 *                  together as the single decision
 *
 * The map is public-domain (Wikimedia "Blank US Map (states only)"); its styling and
 * the TEXAS label live in index.css (.us-map). Gold on the select is FOCUS ONLY —
 * gold at rest reads as focus or error.
 */
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { US_STATES } from '../app/lib/format'
import usStates from './us-states.svg?raw'

export function StateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="state-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose your state"
        onClick={(e) => e.stopPropagation()}
        className="state-modal-panel w-[min(560px,94vw)] overflow-hidden rounded-[4px] border border-[#d8d4cc] bg-paper shadow-[0_0_50px_12px_rgba(22,25,29,0.35)]"
      >
        {/* ── header — cream, ink title, gold rule as the designed edge ───────────── */}
        <div className="border-b-[3px] border-brass bg-[#f5f0e6]">
          <div className="flex items-center justify-between py-4 pl-6 pr-3">
            <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink">
              Choose your state
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center text-[24px] leading-none text-wet transition-colors duration-150 hover:text-ink"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── the map — filling its band with modest, even margins ────────────────── */}
        <div className="bg-[#f5f0e6] px-4 pb-4 pt-4">
          <div aria-hidden="true" className="us-map" dangerouslySetInnerHTML={{ __html: usStates }} />
          <p className="mt-3 px-2 text-center text-[13.5px] leading-relaxed text-wet">
            Licensing is state law. Every state has its own board and its own process.
          </p>
        </div>

        {/* ── control — a hair warmer than white; select + button, one decision ───── */}
        <div className="border-t border-[#e6e1d5] bg-[#fbf9f5] px-7 pb-8 pt-6">
          <label
            htmlFor="state-modal-select"
            className="mb-2 block text-[15px] font-bold text-ink"
          >
            State
          </label>
          <div className="relative">
            <select
              id="state-modal-select"
              value="Texas"
              onChange={() => {}}
              className="h-11 w-full cursor-pointer appearance-none rounded-[2px] border-[1.5px] border-[#d8d4cc] bg-paper px-3 pr-10 text-[15px] text-ink focus:border-brass focus:outline-none"
            >
              {US_STATES.map((state) => (
                <option key={state} value={state} disabled={state !== 'Texas'}>
                  {state}
                </option>
              ))}
            </select>
            {/* custom chevron — the native one doesn't speak the system's language */}
            <svg
              aria-hidden="true"
              viewBox="0 0 12 8"
              className="pointer-events-none absolute right-3.5 top-1/2 h-2 w-3 -translate-y-1/2"
            >
              <path
                d="M1 1.5 6 6.5 11 1.5"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              to="/texas"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-[2px] border-[1.5px] border-ink bg-brass px-[30px] text-[15px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
