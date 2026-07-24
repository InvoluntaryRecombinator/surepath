/**
 * The state modal — "Find your state" opens this over the landing page. A floating
 * card (soft ambient shadow — modals float; buttons stamp) behind a 2px ink edge,
 * 5px radius, reading as three distinct steps top to bottom:
 *   dark header  · warm dark grey (a step off ink), "Choose your state" in white,
 *                  white X, 4px gold rule along the band's bottom edge
 *   warm map     · the flat continental map filling the band, the licensing sentence
 *                  as its caption. The gold fill IS the indicator — no labels.
 *   near-white   · State select (Texas chosen, others disabled) + Get started,
 *                  together as the single decision
 *
 * The map is public-domain (Wikimedia "Blank US Map (states only)"); its styling
 * lives in index.css (.us-map). The tx path is the mainland only — the barrier-island
 * subpath left lagoon slivers where gold never met the outline. Gold on the select is
 * FOCUS ONLY — gold at rest reads as focus or error.
 */
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import states from '../../data/states.json'
import usStates from './us-states.svg?raw'

const determinationStates = [...states].sort((a, b) => a.name.localeCompare(b.name))

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
        className="state-modal-panel w-[min(728px,94vw)] overflow-hidden rounded-[5px] border-2 border-ink bg-paper shadow-[0_0_50px_12px_rgba(22,25,29,0.35)]"
      >
        {/* ── header — warm dark grey (a step off ink), white title, gold rule ────── */}
        <div className="border-b-4 border-brass bg-[#35322b]">
          <div className="flex items-center justify-between py-5 pl-8 pr-4">
            <h2 className="font-display text-[28px] font-extrabold leading-tight text-paper">
              Choose your state
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center text-[30px] leading-none text-paper/75 transition-colors duration-150 hover:text-paper"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── the map — a clearly warmer, darker step than the control band ───────── */}
        <div className="bg-[#efe8d8] px-5 pb-5 pt-5">
          <div aria-hidden="true" className="us-map" dangerouslySetInnerHTML={{ __html: usStates }} />
          <p className="mt-4 px-2 text-center text-[17px] leading-relaxed text-wet">
            These states let you ask a licensing board about your record before you apply.
            SurePath covers Texas today.
          </p>
          <p className="mt-1 text-center text-[14px] text-muted">More states are coming soon.</p>
        </div>

        {/* ── control — a hair warmer than white; select + button, one decision ───── */}
        <div className="border-t border-[#d8d2c2] bg-[#fbf9f5] px-9 pb-9 pt-9">
          <label
            htmlFor="state-modal-select"
            className="mb-2.5 block text-[19px] font-bold text-ink"
          >
            State
          </label>
          <div className="relative">
            <select
              id="state-modal-select"
              value="Texas"
              onChange={() => {}}
              className="h-14 w-full cursor-pointer appearance-none rounded-[2px] border-2 border-[#d8d4cc] bg-paper px-4 pr-12 text-[19px] text-ink focus:border-brass focus:outline-none"
            >
              {determinationStates.map((state) => (
                <option key={state.code} value={state.name} disabled={state.status !== 'live'}>
                  {state.name}
                </option>
              ))}
            </select>
            {/* custom chevron — the native one doesn't speak the system's language */}
            <svg
              aria-hidden="true"
              viewBox="0 0 12 8"
              className="pointer-events-none absolute right-4 top-1/2 h-2.5 w-3.5 -translate-y-1/2"
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

          <div className="mt-8 flex justify-center">
            <Link
              to="/texas"
              onClick={onClose}
              className="inline-flex h-14 items-center rounded-[2px] border-2 border-ink bg-brass px-[68px] text-[19px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
