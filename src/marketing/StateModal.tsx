/**
 * The state modal — "Find your state" opens this over the landing page. A small,
 * clean, light card on a dimmed page: clearly a dialog, not a takeover. Header row
 * (eyebrow + X over a hairline rule), a flat continental map confirming the
 * selection, a State select already showing Texas (other states listed but
 * disabled), one line of body text, Get started.
 *
 * The map is public-domain (Wikimedia "Blank US Map (states only)"), styled flat in
 * index.css (.us-map): warm grey states, hairline strokes, Texas filled gold,
 * AK/HI insets hidden — continental only.
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
      className="state-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select your state"
        onClick={(e) => e.stopPropagation()}
        className="state-modal-panel w-[min(480px,94vw)] bg-paper shadow-[8px_8px_0_#16191d]"
      >
        {/* ── header — the card's top edge: eyebrow + X on one line, rule beneath ── */}
        <div className="flex items-center justify-between border-b border-line/80 py-4 pl-7 pr-3">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-ink">
            Select your state
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center text-[22px] leading-none text-wet transition-colors duration-150 hover:text-ink"
          >
            ×
          </button>
        </div>

        <div className="px-7 pb-9 pt-7">
          {/* a small flat illustration confirming the selection — continental only */}
          <div
            aria-hidden="true"
            className="us-map mx-auto max-w-[330px]"
            dangerouslySetInnerHTML={{ __html: usStates }}
          />

          <div className="mt-7">
            <label
              htmlFor="state-modal-select"
              className="mb-1.5 block text-[13px] font-semibold text-ink"
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
          </div>

          <p className="mt-7 text-[15px] leading-[1.6] text-wet">
            Licensing is state law. Every state has its own board and its own process.
          </p>

          <div className="mt-9 flex justify-end">
            <Link
              to="/texas"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-[2px] border-[1.5px] border-ink bg-brass px-[26px] text-[15px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
