import * as Popover from '@radix-ui/react-popover'
import { useNavigate } from 'react-router-dom'
import { CheckSmall, Icon, Mark, Menu } from '../ui/icons'
import { draftCounts } from './draft'
import { DELETE_CONFIRM, downloadJson, formatCounter } from './railShared'
import { eraseStoredData, useAppStore } from './storeContext'

export function MobileRail() {
  const { state, dispatch, config } = useAppStore()
  const navigate = useNavigate()
  const counts = draftCounts(state.draft)
  const currentIdx = config.sections.findIndex((s) => s.id === state.sectionId)
  const current = config.sections[currentIdx]

  return (
    <div className="shrink-0 lg:hidden">
      <div className="flex h-14 items-center border-b border-line/70 px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Mark size={20} />
          <span className="text-[16px] font-[750] text-ink">SurePath</span>
        </div>
        <p className="ml-auto mr-3 flex items-center gap-1.5 text-[11.5px] font-medium text-muted">
          <span className="text-accent">
            <CheckSmall size={8} />
          </span>
          Saved
        </p>

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Open application menu"
              title="Application menu"
              className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-line bg-field text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
            >
              <Menu />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="z-50 w-[min(320px,calc(100vw-24px))] rounded-[6px] border border-line bg-field p-3"
            >
              <p className="px-2 pb-2 text-[12px] font-medium leading-[1.5] text-muted">
                {config.processName}
                <span className="mt-1 block text-[11.5px] font-normal">
                  Saved on this computer. Never sent to our servers.
                </span>
              </p>
              <nav aria-label="Application steps" className="border-y border-line/70 py-2">
                {config.sections.map((section, i) => {
                  const status =
                    i === currentIdx ? 'current' : i <= state.maxReachedIndex ? 'done' : 'ahead'
                  const clickable = i <= state.maxReachedIndex && i !== currentIdx

                  return (
                    <Popover.Close asChild key={section.id}>
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() =>
                          clickable && dispatch({ type: 'go', sectionId: section.id, index: i })
                        }
                        aria-current={status === 'current' ? 'step' : undefined}
                        className={`flex h-11 w-full items-center gap-3 rounded-[4px] px-2 text-left ${
                          status === 'current'
                            ? 'cursor-default bg-ground/60 text-ink'
                            : clickable
                              ? 'cursor-pointer text-ink/80 hover:bg-ground/35'
                              : 'cursor-default text-muted'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            status === 'done'
                              ? 'border-accent bg-accent text-field'
                              : status === 'current'
                                ? 'border-2 border-accent bg-field text-accent'
                                : 'border-ink/20 text-muted'
                          }`}
                        >
                          {status === 'done' ? (
                            <CheckSmall size={8} />
                          ) : (
                            <Icon name={section.icon} size={13} />
                          )}
                        </span>
                        <span
                          className={`text-[14px] ${status === 'current' ? 'font-semibold' : 'font-medium'}`}
                        >
                          {section.label}
                        </span>
                        <span className="ml-auto text-[11.5px] text-muted">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </button>
                    </Popover.Close>
                  )
                })}
              </nav>

              <div className="px-2 pb-1 pt-3">
                <p className="mb-3 text-[12px] font-semibold uppercase text-ink">
                  {formatCounter(counts)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    downloadJson(`surepath-progress-${config.code.toLowerCase()}.json`, state.draft)
                  }
                  className="h-10 w-full rounded-[4px] border border-line bg-field text-[13px] font-medium text-ink transition-colors duration-150 hover:border-accent hover:text-accent"
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
                  className="mt-3 w-full text-[12px] font-medium text-muted underline underline-offset-2 transition-colors duration-150 hover:text-ink"
                >
                  Delete my information from this computer
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className="flex items-center justify-between border-b-2 border-line bg-rail px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-field text-accent">
            <Icon name={current.icon} size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold uppercase text-muted">
              Step {currentIdx + 1} of {config.sections.length}
            </p>
            <p className="truncate text-[15px] font-semibold leading-tight text-ink">
              {current.label}
            </p>
          </div>
        </div>
        <p className="ml-4 max-w-[150px] shrink-0 text-right text-[11.5px] font-medium uppercase leading-[1.45] text-muted">
          {formatCounter(counts)}
        </p>
      </div>
    </div>
  )
}
