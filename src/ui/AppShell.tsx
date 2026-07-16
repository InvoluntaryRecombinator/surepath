/**
 * The frame. DESIGN_SYSTEM §4.5, §12.
 *
 * Header (sticky, 80px, two rows) → THE SHEET (one continuous --color-card surface; the
 * khaki ground shows only as side margins) → sticky bottom action bar. Content starts at a
 * fixed offset and grows downward. NEVER vertically centered. Nothing floats.
 */
import type { ReactNode } from 'react'
import { STAGES, stageIndex, type StageId } from '../types/stages'
import type { Counts } from '../state/derived'
import { counterLine } from '../state/derived'
import { Stepper } from './Stepper'

type Props = {
  current: StageId
  maxReached: StageId
  counts: Counts
  onNavigate: (id: StageId) => void
  onBack: () => void
  onContinue: () => void
  onSave: () => void
  onClear: () => void
  children: ReactNode
}

export function AppShell(p: Props) {
  const idx = stageIndex(p.current)
  const stage = STAGES[idx]
  const isFirst = idx === 0
  const isLast = idx === STAGES.length - 1

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* ── HEADER — sticky, 80px, 1px rule below, NO SHADOW ─────────────────────────── */}
      <header className="sticky top-0 z-10 h-20 border-b border-rule bg-card">
        <div className="mx-auto flex h-[52px] max-w-6xl items-center gap-10 px-6">
          <span className="select-none text-[15px] font-extrabold tracking-tight">
            SUREPATH
          </span>

          <div className="flex flex-1 justify-center">
            <Stepper current={p.current} maxReached={p.maxReached} onNavigate={p.onNavigate} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={p.onSave}
              className="h-8 rounded-xs border border-rule bg-transparent px-3 text-[13px] font-medium transition-colors duration-150 hover:border-pen hover:text-pen"
            >
              Save progress
            </button>
            <button
              type="button"
              onClick={p.onClear}
              className="h-8 rounded-xs border border-rule bg-transparent px-3 text-[13px] font-medium transition-colors duration-150 hover:border-ink"
            >
              Clear my data
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-6">
          <span className="text-[12px] text-muted">
            Step {idx + 1} of {STAGES.length} · {stage.title}
          </span>
          <span className="font-mono text-[11px] tracking-[0.06em] text-ink">
            {counterLine(p.counts)}
          </span>
        </div>
      </header>

      {/* ── THE SHEET — one surface. Nothing else on the screen is a card. ──────────── */}
      <main className="flex flex-1 justify-center">
        <div className="min-h-full w-full max-w-5xl border-x border-rule bg-card">
          {/* ~640px, left-ish (§12) — anchored to the sheet's left edge, not floating. */}
          <div className="max-w-[640px] pb-24 pl-14 pr-6 pt-12">{p.children}</div>
        </div>
      </main>

      {/* ── ACTION BAR — sticky bottom. Every screen has a bottom edge. ─────────────── */}
      <footer className="sticky bottom-0 z-10 border-t border-rule bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <button
            type="button"
            onClick={p.onBack}
            disabled={isFirst}
            className="h-10 rounded-xs border border-rule bg-transparent px-4 text-[14px] font-medium transition-colors duration-150 enabled:hover:border-pen enabled:hover:text-pen disabled:opacity-40"
          >
            ← Back
          </button>

          <span className="hidden text-[12px] text-muted sm:block">
            Nothing leaves this browser. No account, no database — your information stays on
            this computer.
          </span>

          {isLast ? (
            <button
              type="button"
              disabled
              title="The review stage isn't built yet."
              className="h-10 rounded-xs bg-pen px-5 text-[14px] font-semibold text-card opacity-40"
            >
              Generate my packet
            </button>
          ) : (
            <button
              type="button"
              onClick={p.onContinue}
              className="h-10 rounded-xs bg-pen px-5 text-[14px] font-semibold text-card transition-opacity duration-150 hover:opacity-90"
            >
              Continue →
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
