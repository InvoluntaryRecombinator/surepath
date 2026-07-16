/**
 * The stepper. DESIGN_SYSTEM §5.5 — the single biggest lever on whether this feels premium.
 *
 * Three states that differ in FORM, not just color:
 *   done    — filled pen disc with a hairline check, label at full weight
 *   current — pen RING, unfilled, slightly larger, label at full weight
 *   ahead   — hollow rule-colored dot, label at 50%
 *
 * The connector fills behind you: pen where you've been, rule ahead. A record of work
 * done, not decoration. Completed steps are clickable; future ones are not.
 * 150ms color transition. That is the ENTIRE animation budget.
 */
import { Fragment } from 'react'
import { STAGES, stageIndex, type StageId } from '../types/stages'

type Props = {
  current: StageId
  /** Highest stage the user has reached. Steps at or before it are revisitable. */
  maxReached: StageId
  onNavigate: (id: StageId) => void
}

function Dot({ state }: { state: 'done' | 'current' | 'ahead' }) {
  if (state === 'done') {
    return (
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-pen transition-colors duration-150">
        <svg width="9" height="7" viewBox="0 0 9 7" aria-hidden="true">
          <path d="M1 3.4 L3.4 5.7 L8 1" fill="none" stroke="var(--color-card)" strokeWidth="1.4" />
        </svg>
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className="h-[22px] w-[22px] rounded-full border-2 border-pen bg-transparent transition-colors duration-150" />
    )
  }
  return (
    <span className="h-[18px] w-[18px] rounded-full border border-rule bg-transparent transition-colors duration-150" />
  )
}

export function Stepper({ current, maxReached, onNavigate }: Props) {
  const currentIdx = stageIndex(current)
  const reachedIdx = stageIndex(maxReached)

  return (
    <nav aria-label="Progress" className="flex items-start">
      {STAGES.map((stage, i) => {
        const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'ahead'
        const clickable = i <= reachedIdx && i !== currentIdx

        return (
          <Fragment key={stage.id}>
            {i > 0 && (
              <div
                aria-hidden="true"
                className={`mt-[11px] h-px min-w-7 flex-1 transition-colors duration-150 ${
                  i <= currentIdx ? 'bg-pen' : 'bg-rule'
                }`}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onNavigate(stage.id)}
              aria-current={state === 'current' ? 'step' : undefined}
              className={`group flex flex-col items-center gap-1.5 px-1 ${
                clickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className="flex h-[22px] items-center">
                <Dot state={state} />
              </span>
              <span
                className={`text-[10px] font-semibold uppercase leading-tight tracking-[0.09em] whitespace-nowrap transition-colors duration-150 ${
                  state === 'ahead' ? 'text-ink/50' : 'text-ink'
                } ${clickable ? 'group-hover:text-pen' : ''}`}
              >
                {stage.rail}
              </span>
            </button>
          </Fragment>
        )
      })}
    </nav>
  )
}
