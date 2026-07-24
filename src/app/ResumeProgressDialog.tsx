import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StateConfig } from '../state-config/types'
import type { AppState } from './store'
import {
  INVALID_PROGRESS_FILE_MESSAGE,
  restoreProgressFile,
} from './progressFile'

const MAX_PROGRESS_FILE_BYTES = 5 * 1024 * 1024

type ResumeProgressDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: StateConfig
  onRestore?: (state: AppState) => void
}

export function ResumeProgressDialog({
  open,
  onOpenChange,
  config,
  onRestore,
}: ResumeProgressDialogProps) {
  const navigate = useNavigate()
  const closeRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const close = useCallback(() => {
    setFile(null)
    setError(null)
    setReading(false)
    setDragging(false)
    onOpenChange(false)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, close])

  if (!open) return null

  const chooseFile = (nextFile: File | undefined) => {
    setError(null)
    if (!nextFile) return
    if (!nextFile.name.toLowerCase().endsWith('.json') || nextFile.size > MAX_PROGRESS_FILE_BYTES) {
      setFile(null)
      setError(INVALID_PROGRESS_FILE_MESSAGE)
      return
    }
    setFile(nextFile)
  }

  const restore = async () => {
    if (!file || reading) return
    setError(null)
    setReading(true)
    try {
      const result = restoreProgressFile(await file.text(), config)
      if (!result.ok) {
        setError(INVALID_PROGRESS_FILE_MESSAGE)
        return
      }

      // Validation finishes before either persistent or in-memory state is touched.
      // Both assignments replace the whole session; neither merges fields.
      onRestore?.(result.state)
      close()
      if (!onRestore) navigate(`${config.routeBase}/apply`)
    } catch {
      setError(INVALID_PROGRESS_FILE_MESSAGE)
    } finally {
      setReading(false)
    }
  }

  const dropFile = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setDragging(false)
    chooseFile(event.dataTransfer.files[0])
  }

  return (
    <div
      className="state-modal-overlay fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-6 backdrop-blur-[3px]"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-progress-title"
        className="state-modal-panel w-[min(728px,94vw)] overflow-hidden rounded-[5px] border-2 border-ink bg-paper shadow-[0_0_50px_12px_rgba(22,25,29,0.35)]"
      >
        <div className="border-b-4 border-brass bg-[#35322b]">
          <div className="flex items-center justify-between py-5 pl-8 pr-4">
            <h2
              id="resume-progress-title"
              className="font-display text-[28px] font-extrabold leading-tight text-paper"
            >
              Continue where you left off
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center text-[30px] leading-none text-paper/75 transition-colors duration-150 hover:text-paper"
            >
              ×
            </button>
          </div>
        </div>

        <div className="bg-[#fbf9f5] px-9 pb-9 pt-8">
          <p className="max-w-[60ch] text-[17px] leading-relaxed text-wet">
            If you saved a progress file from SurePath before, upload it here and you'll go
            back to where you left off.
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDragging(false)
              }
            }}
            onDrop={dropFile}
            className={`mt-7 flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-[3px] border-2 border-dashed px-6 text-center transition-colors duration-150 ${
              dragging
                ? 'border-brass bg-[#efe8d8]'
                : 'border-[#b8b4ab] bg-paper hover:border-ink/60 hover:bg-[#f7f3eb]'
            }`}
          >
            <span className="text-[17px] font-semibold text-ink">
              Drop your file here, or <span className="underline underline-offset-4">choose a file</span>.
            </span>
            <span className="mt-2 text-[13px] text-muted">JSON files only</span>
            {file && (
              <span className="mt-4 max-w-full truncate text-[14px] font-semibold text-wet">
                {file.name}
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Choose a SurePath progress file"
            onChange={(event) => {
              chooseFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />

          {error && (
            <p
              role="alert"
              className="mt-4 border-l-2 border-state pl-3 text-[14px] font-medium leading-relaxed text-state"
            >
              {INVALID_PROGRESS_FILE_MESSAGE}
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              disabled={!file || reading}
              onClick={restore}
              className="inline-flex h-14 items-center rounded-[2px] border-2 border-ink bg-brass px-[68px] text-[19px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow,opacity] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            >
              {reading ? 'Opening file…' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
