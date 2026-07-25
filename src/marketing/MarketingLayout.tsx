import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ResumeProgressDialog } from '../app/ResumeProgressDialog'
import { txConfig } from '../states/texas/config'
import { StateModal } from './StateModal'
import type { MarketingOutletContext } from './stateModalContext'

export function MarketingLayout() {
  const [stateModalOpen, setStateModalOpen] = useState(false)
  const [resumeProgressOpen, setResumeProgressOpen] = useState(false)
  const isLandingPage = useLocation().pathname === '/'
  return (
    <div className="flex min-h-screen flex-col bg-silica">
      <header className="relative z-20 border-b border-wet/20 bg-silica">
        <div className="flex min-h-[78px] items-center justify-between px-6">
          <Link
            to="/"
            aria-label="SurePath home"
            className="inline-flex origin-left transition-transform duration-150 hover:-translate-y-px hover:scale-[1.015] focus-visible:-translate-y-px focus-visible:scale-[1.015]"
          >
            <img
              src="/assets/surepath_arrow_s_logo-2.svg"
              alt="SurePath"
              className="h-auto w-[197px]"
            />
          </Link>
          <nav className="flex items-center gap-3" aria-label="Main navigation">
            <button
              type="button"
              onClick={() => setResumeProgressOpen(true)}
              className="inline-flex h-11 cursor-pointer items-center rounded-[2px] border-[1.5px] border-ink bg-transparent px-[22px] text-[15px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow,background-color] duration-150 hover:-translate-x-px hover:-translate-y-px hover:bg-paper hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Continue where you left off
            </button>
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
      <ResumeProgressDialog
        open={resumeProgressOpen}
        onOpenChange={setResumeProgressOpen}
        config={txConfig}
      />

      {isLandingPage ? (
        <footer className="bg-ink px-6 py-7 text-center">
          <div className="mx-auto flex max-w-[760px] flex-col items-center gap-3.5">
            <img
              src="/assets/surepath_logo_white.svg"
              alt="SurePath"
              className="mb-0.5 h-auto w-[84px]"
            />
            <nav aria-label="Footer navigation" className="flex items-center justify-center gap-2 text-[13px] text-silica">
              <Link to="/about" className="underline-offset-4 hover:underline">
                About
              </Link>
              <span aria-hidden="true" className="text-rail-muted">·</span>
              <a href="mailto:jwalb90@gmail.com" className="underline-offset-4 hover:underline">
                Contact
              </a>
            </nav>
            <p className="max-w-[72ch] text-[12.5px] leading-relaxed text-rail-muted">
              SurePath is not a law firm and does not provide legal advice. Determinations are
              issued by state licensing boards, not by SurePath.
            </p>
            <p className="text-[12px] text-rail-muted">© 2026 SurePath</p>
          </div>
        </footer>
      ) : (
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
      )}
    </div>
  )
}
