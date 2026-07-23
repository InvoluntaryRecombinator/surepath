import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { StateModal } from './StateModal'
import type { MarketingOutletContext } from './stateModalContext'

export function MarketingLayout() {
  const [stateModalOpen, setStateModalOpen] = useState(false)
  return (
    <div className="flex min-h-screen flex-col bg-silica">
      <header className="relative z-20 border-b border-wet/20 bg-silica">
        <div className="flex min-h-[78px] items-center justify-between px-6">
          <Link to="/" aria-label="SurePath home" className="inline-flex">
            <img
              src="/assets/surepath_arrow_s_logo-2.svg"
              alt="SurePath"
              className="h-auto w-[197px]"
            />
          </Link>
          <nav className="flex items-center gap-7" aria-label="Main navigation">
            <Link
              to="/#how-it-works"
              className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline"
            >
              How it works
            </Link>
            <Link
              to="/about"
              className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline"
            >
              About
            </Link>
            <button
              type="button"
              onClick={() => setStateModalOpen(true)}
              className="inline-flex h-11 cursor-pointer items-center rounded-[2px] border-[1.5px] border-ink bg-brass px-[22px] text-[15px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Find your state
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet context={{ openStateModal: () => setStateModalOpen(true) } satisfies MarketingOutletContext} />
      </main>

      <StateModal open={stateModalOpen} onClose={() => setStateModalOpen(false)} />

      <footer className="bg-ink px-6 py-[68px] text-center">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-8">
          <img
            src="/assets/surepath_logo_white.svg"
            alt="SurePath"
            className="h-auto w-[252px]"
          />
          <Link
            to="/about"
            className="inline-flex h-12 items-center rounded-[2px] border-[1.5px] border-silica/70 px-8 text-[16px] font-semibold text-silica hover:bg-paper/10"
          >
            About SurePath
          </Link>
          <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-rail-muted">
            SurePath is not a law firm and does not provide legal advice. Determinations are
            issued by state licensing boards, not by SurePath.
          </p>
        </div>
      </footer>
    </div>
  )
}
