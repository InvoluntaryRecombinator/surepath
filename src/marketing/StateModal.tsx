/**
 * The state modal — "Find your state" opens this over the landing page. A small,
 * clean, light card on a dimmed page: clearly a dialog, not a takeover. A flat map
 * confirming the selection, a State select already showing Texas (other states
 * listed but disabled), one line of body text, Get started.
 *
 * The map is public-domain (Wikimedia "Blank US Map (states only)"), styled flat in
 * index.css (.us-map): light grey states, hairline strokes, Texas filled gold.
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
        aria-label="Choose your state"
        onClick={(e) => e.stopPropagation()}
        className="state-modal-panel relative w-[min(480px,94vw)] bg-paper p-8 shadow-paper"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-[22px] leading-none text-wet transition-colors duration-150 hover:text-ink"
        >
          ×
        </button>

        {/* a small flat illustration confirming the selection — not a background */}
        <div
          aria-hidden="true"
          className="us-map mx-auto mt-2 max-w-[380px]"
          dangerouslySetInnerHTML={{ __html: usStates }}
        />

        <div className="mt-6">
          <label
            htmlFor="state-modal-select"
            className="mb-1.5 block text-[13px] font-semibold text-ink"
          >
            State
          </label>
          <select
            id="state-modal-select"
            value="Texas"
            onChange={() => {}}
            className="h-11 w-full cursor-pointer rounded-[2px] border-[1.5px] border-wet/40 bg-paper px-3 text-[15px] text-ink"
          >
            {US_STATES.map((state) => (
              <option key={state} value={state} disabled={state !== 'Texas'}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-5 text-[15px] leading-[1.6] text-wet">
          Licensing is state law. Every state has its own board and its own process.
        </p>

        <div className="mt-7 flex justify-end">
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
  )
}
