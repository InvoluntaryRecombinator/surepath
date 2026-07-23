import { useEffect, useRef, useState } from 'react'
import { downloadProgressFile } from './progressFile'
import { useAppStore } from './storeContext'

export function SaveProgressDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { state, config } = useAppStore()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [email, setEmail] = useState(state.draft.applicant.email)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setEmail(state.draft.applicant.email)
      setDownloaded(false)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, state.draft.applicant.email])

  const close = () => onOpenChange(false)

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="save-progress-title"
      className="save-progress-dialog m-auto max-h-[calc(100dvh-32px)] w-[min(590px,calc(100vw-32px))] overflow-y-auto rounded-[10px] border border-line bg-surface p-0 text-ink"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClose={close}
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <div className="border-t-[4px] border-brand-gold">
        <header className="flex items-center gap-4 border-b border-line bg-ground/65 px-5 py-4 sm:px-7">
          <div className="min-w-0 flex-1">
            <h2
              id="save-progress-title"
              className="text-[25px] font-bold leading-tight tracking-[-0.015em] text-ink"
            >
              Save your progress
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close save progress dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-line text-[22px] leading-none text-muted transition-colors duration-150 hover:border-ink/35 hover:text-ink"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="px-5 pb-6 pt-5 sm:px-7">
          <div className="max-w-[61ch] text-[15px] leading-relaxed text-ink/80">
            <p>
              SurePath{' '}
              <strong className="text-[16px] font-bold italic tracking-[-0.01em] text-ink">
                never
              </strong>{' '}
              stores your sensitive personal information.
            </p>
            <p className="mt-2">
              Save a progress file and upload it from the SurePath home page whenever you’re
              ready to continue or explore another licensed opportunity.
            </p>
            <p className="mt-3 text-[13.5px] text-muted">
              Keep the file somewhere you can find it. SurePath cannot recover it if it is lost.
            </p>
          </div>

          <div className="mt-6 border-t border-line">
            <section className="py-5">
              <h3 className="text-[18px] font-semibold text-ink">Download to this device</h3>
              <p className="mt-1.5 max-w-[54ch] text-[14.5px] leading-relaxed text-muted">
                Choose this if the device belongs to you and you’ll be able to access the file
                later.
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  autoFocus
                  onClick={() => {
                    downloadProgressFile(state, config)
                    setDownloaded(true)
                  }}
                  className="save-progress-action inline-flex h-11 w-full max-w-[280px] items-center justify-center rounded-[4px] bg-brand-gold px-5 text-[15px] font-semibold text-rail hover:bg-brand-gold-deep"
                >
                  {downloaded ? 'Download again' : 'Download progress file'}
                </button>
              </div>
              {downloaded && (
                <p className="mt-2 text-center text-[13px] leading-snug text-muted" role="status">
                  Progress file downloaded.
                </p>
              )}
            </section>

            <section className="border-t border-line py-5">
              <h3 className="text-[18px] font-semibold text-ink">Send it to your email</h3>
              <p className="mt-1.5 max-w-[54ch] text-[14.5px] leading-relaxed text-muted">
                <span className="block">Using a shared, public, or borrowed device?</span>
                <span className="mt-1 block">
                  Send the progress file to an email address of your choice so you can easily
                  access it later from your inbox.
                </span>
              </p>
              <div className="mx-auto mt-4 max-w-[360px]">
                <label className="block text-[13px] font-medium text-ink" htmlFor="progress-email">
                  Email address
                </label>
                <input
                  id="progress-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 h-10 w-full rounded-[4px] border border-line bg-field px-3 text-[15px] text-ink placeholder:text-muted/65"
                />
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    disabled
                    aria-describedby="email-unavailable"
                    className="inline-flex h-11 w-full max-w-[280px] cursor-not-allowed items-center justify-center rounded-[4px] border border-line bg-ground px-5 text-[15px] font-medium text-muted opacity-70"
                  >
                    Send progress file
                  </button>
                </div>
                <p
                  id="email-unavailable"
                  className="mt-2 text-center text-[12.5px] leading-snug text-muted"
                >
                  Email delivery is not available yet.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </dialog>
  )
}
