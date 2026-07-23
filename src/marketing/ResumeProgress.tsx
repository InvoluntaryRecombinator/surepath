import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StateConfig } from '../state-config/types'
import { parseProgressFile, storeImportedProgress } from '../app/progressFile'

const MAX_PROGRESS_FILE_BYTES = 5 * 1024 * 1024

export function ResumeProgress({ config }: { config: StateConfig }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    if (file.size > MAX_PROGRESS_FILE_BYTES) {
      setError('That file is too large to be a SurePath progress file.')
      return
    }

    setReading(true)
    try {
      const result = parseProgressFile(await file.text(), config)
      if (!result.ok) {
        setError(result.message)
        return
      }
      storeImportedProgress(result.state, config)
      navigate(`${config.routeBase}/apply`)
    } catch {
      setError('SurePath could not read that file. Choose a progress file you saved earlier.')
    } finally {
      setReading(false)
    }
  }

  return (
    <section className="max-w-[780px] border-[1.5px] border-paper-border bg-paper px-8 py-7 shadow-paper">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-wet">
        Saved progress
      </p>
      <div className="mt-2 flex items-end justify-between gap-10">
        <div>
          <h2 className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.01em] text-ink">
            Continue from a saved file
          </h2>
          <p className="mt-3 max-w-[48ch] text-[17px] leading-[1.6] text-wet">
            Upload the SurePath progress file you downloaded or received by email. We’ll
            restore your information and take you back to where you left off.
          </p>
        </div>
        <button
          type="button"
          disabled={reading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-ink bg-brass px-5 text-[15px] font-bold text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover disabled:opacity-55"
        >
          {reading ? 'Opening file…' : 'Upload saved progress'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={upload}
          aria-label="Choose a SurePath progress file"
        />
      </div>
      {error && (
        <p className="mt-4 border-l-2 border-state pl-3 text-[14px] leading-relaxed text-state" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
