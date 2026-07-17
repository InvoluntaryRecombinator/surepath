/**
 * The rail — the app's left nav and progress indicator, driven entirely by the state
 * config's section list (a different state = a different list; SITE_STRUCTURE §3).
 *
 * The rail is its own REGION: the deepest tone on screen, so the light active chip
 * reads instantly (inverted contrast — a light chip on a deep rail, not a gray tint).
 * One continuous dashed connector runs the length of the steps; the traveled portion
 * is accent — a record of work done, not decoration. Completed steps are clickable;
 * future ones are not.
 */
import { useNavigate } from 'react-router-dom'
import { draftCounts } from './draft'
import { eraseStoredData, useAppStore } from './storeContext'
import { CheckSmall, Icon, Mark } from '../ui/icons'

function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const DELETE_CONFIRM =
  'We never store your information on our servers — it stays on this computer while ' +
  'you work.\n\nThis will remove everything you have entered from this computer, so ' +
  'nothing is left behind.\n\nIf you want to pick up where you left off later, download ' +
  'your progress file first (Cancel, then "Save my progress").\n\nDelete everything from ' +
  'this computer?'

const ROW_H = 46 // px — one nav row. The connector geometry derives from this.

export function Rail() {
  const { state, dispatch, config } = useAppStore()
  const navigate = useNavigate()
  const counts = draftCounts(state.draft)
  const currentIdx = config.sections.findIndex((s) => s.id === state.sectionId)
  const n = config.sections.length

  const recordsLabel =
    counts.records === 1
      ? counts.deferrals === 1
        ? 'deferred adjudication'
        : 'conviction'
      : counts.deferrals > 0
        ? 'convictions & deferrals'
        : 'convictions'
  const counterText =
    `${counts.incidents} ${counts.incidents === 1 ? 'incident' : 'incidents'} · ` +
    `${counts.records} ${recordsLabel}`

  return (
    <aside className="flex w-[276px] shrink-0 flex-col overflow-y-auto border-r border-line bg-rail">
      {/* ── identity ── */}
      <div className="px-6 pb-1 pt-7">
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[17px] font-extrabold tracking-tight text-ink">SurePath</span>
        </div>
        <p className="mt-1.5 pl-[34px] text-[12px] font-medium text-muted">{config.railTag}</p>
      </div>

      {/* ── sections. The connector is ONE continuous line behind all the dots. ── */}
      <nav aria-label="Application steps" className="relative mt-7 px-4">
        {/* the full run, quiet */}
        <span
          aria-hidden="true"
          className="absolute left-[35px] border-l border-dashed border-ink/20"
          style={{ top: ROW_H / 2, height: (n - 1) * ROW_H }}
        />
        {/* the traveled portion — a record of work done */}
        {currentIdx > 0 && (
          <span
            aria-hidden="true"
            className="absolute left-[35px] border-l border-dashed border-accent/60"
            style={{ top: ROW_H / 2, height: currentIdx * ROW_H }}
          />
        )}

        {config.sections.map((section, i) => {
          const status = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'ahead'
          const clickable = i <= state.maxReachedIndex && i !== currentIdx

          return (
            <button
              key={section.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && dispatch({ type: 'go', sectionId: section.id, index: i })}
              aria-current={status === 'current' ? 'step' : undefined}
              style={{ height: ROW_H }}
              className={`relative flex w-full items-center gap-3 rounded-[6px] px-2.5 text-left transition-colors duration-150 ${
                status === 'current'
                  ? 'border border-line/70 bg-surface text-ink'
                  : clickable
                    ? 'text-ink/85 hover:bg-surface/45'
                    : 'text-muted'
              }`}
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                {status === 'done' ? (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-surface">
                    <CheckSmall size={8} />
                  </span>
                ) : status === 'current' ? (
                  <span className="h-[18px] w-[18px] rounded-full border-2 border-accent bg-field" />
                ) : (
                  <span className="h-[13px] w-[13px] rounded-full border border-ink/25 bg-rail" />
                )}
              </span>
              <Icon
                name={section.icon}
                size={17}
                className={status === 'current' ? 'text-accent' : 'text-muted'}
              />
              <span
                className={`text-[14px] ${status === 'current' ? 'font-semibold' : 'font-medium'}`}
              >
                {section.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* ── the counter — the promise, rendered ── */}
      <div className="mx-6 border-t border-ink/10 pt-5">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-ink">
          {counterText}
        </p>
      </div>

      {/* ── data controls ── */}
      <div className="flex flex-col gap-2.5 px-6 pb-6 pt-4">
        <button
          type="button"
          onClick={() =>
            downloadJson(`surepath-progress-${config.code.toLowerCase()}.json`, state.draft)
          }
          className="h-9 rounded-[4px] border border-line bg-surface text-[13px] font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
        >
          Save my progress
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(DELETE_CONFIRM)) {
              eraseStoredData(config)
              dispatch({ type: 'delete-everything' })
              navigate(config.routeBase)
            }
          }}
          className="text-[12px] font-medium text-muted underline underline-offset-2 transition-colors duration-150 hover:text-ink"
        >
          Delete my information from this computer
        </button>
      </div>
    </aside>
  )
}
