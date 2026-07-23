/**
 * The state modal — "Find your state" opens this over the landing page. A defined
 * object, not white rectangles on the hero: 2px ink border, hard ink offset shadow,
 * three tonal bands edge to edge —
 *   ink header   · "Choose your state" in the display face, X in the band
 *   cream map    · the flat continental map, larger, with a drawn TEXAS leader label
 *   white control· State select (Texas chosen, others disabled), one sentence, button
 *
 * The map is public-domain (Wikimedia "Blank US Map (states only)"); all its styling
 * and the TEXAS label live in index.css (.us-map).
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
        className="state-modal-panel w-[min(520px,94vw)] border-2 border-ink bg-paper shadow-[10px_10px_0_#16191d]"
      >
        {/* ── band 1 · header — ink, edge to edge ─────────────────────────────────── */}
        <div className="flex items-center justify-between bg-ink py-4 pl-6 pr-3">
          <h2 className="font-display text-[22px] font-extrabold leading-tight text-paper">
            Choose your state
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center text-[24px] leading-none text-paper/70 transition-colors duration-150 hover:text-paper"
          >
            ×
          </button>
        </div>

        {/* ── band 2 · the map — warm cream, the map sits IN something ────────────── */}
        <div className="border-y border-ink bg-[#f5f0e6] px-5 py-5">
          <div aria-hidden="true" className="us-map" dangerouslySetInnerHTML={{ __html: usStates }} />
        </div>

        {/* ── band 3 · control — white ────────────────────────────────────────────── */}
        <div className="px-7 pb-8 pt-6">
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

          <p className="mt-6 text-[17px] leading-[1.6] text-ink">
            Licensing is state law. Every state has its own board and its own process.
          </p>

          <div className="mt-8 flex justify-center">
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
