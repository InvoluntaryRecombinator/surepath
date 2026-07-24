import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { eraseStoredData, useAppStore } from './storeContext'

export function DeleteDataDialog({
  open,
  onOpenChange,
  onSaveProgress,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveProgress: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { config, dispatch } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const close = () => onOpenChange(false)

  const saveFirst = () => {
    close()
    onSaveProgress()
  }

  const deleteInformation = () => {
    eraseStoredData(config)
    dispatch({ type: 'delete-everything' })
    close()
    navigate(config.routeBase)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-data-title"
      className="delete-data-dialog m-auto max-h-[calc(100dvh-32px)] w-[min(590px,calc(100vw-32px))] overflow-y-auto rounded-[10px] border border-line bg-surface p-0 text-ink"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClose={close}
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <div className="border-y-[4px] border-state">
        <header className="flex items-center gap-4 border-b border-line bg-ground/65 px-5 py-4 sm:px-7">
          <h2
            id="delete-data-title"
            className="min-w-0 flex-1 text-[25px] font-bold leading-tight tracking-[-0.015em] text-ink"
          >
            Delete your information?
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close delete information dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-line text-[22px] leading-none text-muted transition-colors duration-150 hover:border-ink/35 hover:text-ink"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="px-5 pb-8 pt-5 sm:px-7">
          <div className="rounded-[6px] border border-state/35 bg-state/[0.05] px-4 py-4">
            <p className="text-[15px] font-semibold leading-relaxed text-ink">
              Deleting permanently clears the information you entered from this browser.
            </p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink/80">
              Before deleting it, we recommend saving a progress file—even if you have
              already generated your packets.
            </p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink/80">
              That file lets you return later, continue where you left off, or explore
              more licensed opportunities.
            </p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink/80">
              Without it, SurePath cannot restore your work.
            </p>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
              Once your progress file is saved, you can safely delete the browser copy.
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              This will not delete progress files or packet PDFs already downloaded to
              your device.
            </p>
          </div>

          <div className="mt-5 flex flex-col items-center gap-[26px]">
            <button
              type="button"
              onClick={saveFirst}
              className="save-progress-action inline-flex h-11 w-full items-center justify-center rounded-[4px] bg-brand-gold px-5 text-[14.5px] font-semibold text-rail hover:bg-brand-gold-deep"
            >
              Save progress first — recommended
            </button>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={deleteInformation}
                className="inline-flex h-10 w-full max-w-[280px] items-center justify-center rounded-[4px] border border-state bg-surface px-4 text-[14px] font-semibold text-state transition-colors duration-150 hover:bg-state hover:text-field"
              >
                Delete from this browser
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
