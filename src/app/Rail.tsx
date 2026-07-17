/**
 * The rail — the app's left nav and progress indicator (DESIGN_SYSTEM "The rail",
 * SITE_STRUCTURE §1). Driven entirely by the state config's section list: a different
 * state shows a different list, and that is the whole per-state mechanism.
 *
 * Three states, differing in form: done (filled accent dot + check, clickable) ·
 * current (accent ring, row tinted) · ahead (hollow, muted, not clickable).
 * A dashed connector between dots — friendlier than bare gaps.
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

export function Rail() {
  const { state, dispatch, config } = useAppStore()
  const navigate = useNavigate()
  const counts = draftCounts(state.draft)
  const currentIdx = config.sections.findIndex((s) => s.id === state.sectionId)

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
    <aside className="flex w-[272px] shrink-0 flex-col overflow-y-auto border-r border-line bg-rail">
      {/* ── identity ── */}
      <div className="px-6 pb-2 pt-7">
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[17px] font-extrabold tracking-tight text-ink">SurePath</span>
        </div>
        <p className="mt-1.5 pl-[34px] text-[12px] font-medium text-muted">{config.railTag}</p>
      </div>

      {/* ── sections ── */}
      <nav aria-label="Application steps" className="mt-6 flex flex-col px-4">
        {config.sections.map((section, i) => {
          const status = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'ahead'
          const clickable = i <= state.maxReachedIndex && i !== currentIdx
          const last = i === config.sections.length - 1

          return (
            <div key={section.id} className="relative">
              {/* dashed connector, behind the dots */}
              {!last && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[27px] top-[30px] h-[26px] border-l border-dashed ${
                    i < currentIdx ? 'border-accent/50' : 'border-line'
                  }`}
                />
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && dispatch({ type: 'go', sectionId: section.id, index: i })}
                aria-current={status === 'current' ? 'step' : undefined}
                className={`relative flex h-11 w-full items-center gap-3 rounded-[6px] px-2.5 text-left transition-colors duration-150 ${
                  status === 'current'
                    ? 'bg-accent/8 text-ink'
                    : clickable
                      ? 'text-ink hover:bg-accent/5'
                      : 'text-muted'
                }`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {status === 'done' ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-field">
                      <CheckSmall size={8} />
                    </span>
                  ) : status === 'current' ? (
                    <span className="h-4 w-4 rounded-full border-2 border-accent bg-field" />
                  ) : (
                    <span className="h-[14px] w-[14px] rounded-full border border-line bg-transparent" />
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
            </div>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* ── the counter — the promise, rendered ── */}
      <div className="mx-6 border-t border-line pt-5">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-ink">
          {counterText}
        </p>
      </div>

      {/* ── data controls ── */}
      <div className="flex flex-col gap-2 px-6 pb-6 pt-4">
        <button
          type="button"
          onClick={() =>
            downloadJson(`surepath-progress-${config.code.toLowerCase()}.json`, state.draft)
          }
          className="h-9 rounded-[4px] border border-line bg-field text-[13px] font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
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
