/**
 * The state modal — "Find your state" opens this over the landing page. It gets a
 * full-screen shot in the demo, and it is deliberately NOT a default dialog: ink
 * panel deeper than the chrome, sharp corners, hard offset shadow, one enormous map
 * where Texas is the only saturated shape, one statement at display scale, one
 * action. No cancel, no X — Esc and the overlay close it silently.
 *
 * The map is public-domain (Wikimedia "Blank US Map (states only)"), processed in
 * src/marketing/us-states.svg: Texas painted last so its hard shadow sits above
 * every border stroke. All styling lives in index.css (.us-map).
 */
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import usStates from './us-states.svg?raw'

export function StateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const actionRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return
    actionRef.current?.focus()
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
      className="state-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-[3vmin]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Where SurePath works"
        onClick={(e) => e.stopPropagation()}
        className="state-modal-panel flex max-h-[94vh] w-[min(960px,95vw)] flex-col overflow-y-auto bg-[#0e1114] shadow-[16px_16px_0_#000]"
      >
        {/* the map — an object, not an illustration. No label above it: the statement
            below says everything, and silence is what makes the shape land. */}
        <div
          aria-hidden="true"
          className="us-map mt-[clamp(16px,2.5vh,32px)] px-2"
          dangerouslySetInnerHTML={{ __html: usStates }}
        />

        <p className="max-w-[32ch] px-[clamp(28px,4.5vw,60px)] pb-[clamp(28px,4.5vh,52px)] pt-[clamp(16px,2.5vh,32px)] font-display text-[clamp(26px,3.4vw,42px)] font-extrabold leading-[1.14] tracking-[-0.01em] text-silica">
          Licensing is state law. Every state has its own board and its own process.{' '}
          <span className="text-brass">SurePath covers Texas.</span>
        </p>

        {/* the one action — the nav button's exact treatment, spanning the bottom */}
        <Link
          ref={actionRef}
          to="/texas"
          onClick={onClose}
          className="flex h-[66px] w-full shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-ink bg-brass text-[17px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Continue in Texas
        </Link>
      </div>
    </div>
  )
}
