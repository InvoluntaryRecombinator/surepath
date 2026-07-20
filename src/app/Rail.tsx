/**
 * The rail — the app's left nav and progress indicator, driven entirely by the state
 * config's section list (a different state = a different list; SITE_STRUCTURE §3).
 *
 * The rail is its own REGION: the deepest tone on screen, so the light active chip
 * reads instantly (inverted contrast — a light chip on a deep rail, not a gray tint).
 * Completed steps are clickable; future ones are not. Status lives in marker form and
 * type weight — there is no connector competing with the icons.
 */
import { useNavigate } from 'react-router-dom'
import { draftCounts } from './draft'
import { DELETE_CONFIRM, downloadJson, formatCounter } from './railShared'
import { validateSection } from './sectionValidation'
import { eraseStoredData, useAppStore } from './storeContext'
import { CheckSmall, Icon, Mark } from '../ui/icons'

const ROW_H = 50 // px — one nav row. The connector geometry derives from this.

export function Rail() {
  const { state, dispatch, config } = useAppStore()
  const navigate = useNavigate()
  const counts = draftCounts(state.draft)
  const currentIdx = config.sections.findIndex((s) => s.id === state.sectionId)
  const counterText = formatCounter(counts)

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col overflow-y-auto bg-rail lg:flex">
      {/* ── identity — the rail carries what the dead header used to: the product AND the
          formal name of the legal artifact being assembled. ── */}
      <div className="border-b border-rail-line px-5 pb-5 pt-6">
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[18px] font-[750] text-rail-ink">SurePath</span>
        </div>
        <p className="mt-3 text-[12px] font-medium leading-[1.5] text-rail-muted">
          {config.processName}
          <span className="mt-0.5 block text-[11.5px] text-rail-muted/80">{config.railTag}</span>
        </p>
      </div>

      {/* ── sections ── */}
      <nav aria-label="Application steps" className="mt-4 px-3">
        {config.sections.map((section, i) => {
          const visited = i <= state.maxReachedIndex
          const complete = validateSection(section.id, state.draft, { agency: config.agency }).complete
          const status =
            i === currentIdx ? 'current' : !visited ? 'ahead' : complete ? 'done' : 'visited'
          const clickable = i <= state.maxReachedIndex && i !== currentIdx

          return (
            <button
              key={section.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && dispatch({ type: 'go', sectionId: section.id, index: i })}
              aria-current={status === 'current' ? 'step' : undefined}
              style={{ height: ROW_H }}
              className={`relative flex w-full items-center gap-3 rounded-[2px] border-l-2 px-2.5 text-left transition-colors duration-150 ${
                status === 'current'
                  ? 'cursor-default border-rail-ink bg-rail-inset text-rail-ink'
                  : clickable
                    ? 'cursor-pointer border-transparent text-rail-ink/85 hover:bg-rail-inset'
                    : 'cursor-default border-transparent text-rail-muted'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                {status === 'done' ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rail-ink text-rail">
                    <CheckSmall size={10} />
                  </span>
                ) : status === 'current' ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-rail-ink text-rail-ink">
                    <Icon name={section.icon} size={15} />
                  </span>
                ) : status === 'visited' ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-rail-muted text-rail-ink">
                    <Icon name={section.icon} size={15} />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-rail-line text-rail-muted">
                    <Icon name={section.icon} size={15} />
                  </span>
                )}
              </span>
              <span
                className={`text-[14px] ${status === 'current' ? 'font-semibold' : 'font-medium'}`}
              >
                {section.label}
                <span className="sr-only">
                  {status === 'done'
                    ? ' — complete'
                    : status === 'visited'
                      ? ' — needs attention'
                      : ''}
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* ── the counter — the promise, rendered ── */}
      <div className="mx-5 border-t border-rail-line pt-5">
        <p className="flex flex-col gap-0.5 text-[12px] font-semibold uppercase leading-[1.45] text-rail-ink">
          {counterText.split(' · ').map((part) => (
            <span key={part}>{part}</span>
          ))}
        </p>
      </div>

      {/* ── data controls ── */}
      <div className="flex flex-col gap-2.5 px-5 pb-6 pt-4">
        <button
          type="button"
          onClick={() =>
            downloadJson(`surepath-progress-${config.code.toLowerCase()}.json`, state.draft)
          }
          className="h-9 rounded-[2px] border border-rail-line bg-transparent text-[13px] font-medium text-rail-ink transition-colors duration-150 hover:border-rail-muted hover:bg-rail-inset"
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
          className="text-[12px] font-medium text-rail-muted underline underline-offset-2 transition-colors duration-150 hover:text-rail-ink"
        >
          Delete my information from this computer
        </button>
      </div>
    </aside>
  )
}
