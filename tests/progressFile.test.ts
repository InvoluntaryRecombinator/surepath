import { describe, expect, it, vi } from 'vitest'
import { emptyDraft } from '../src/app/draft'
import {
  INVALID_PROGRESS_FILE_MESSAGE,
  parseProgressFile,
  restoreProgressFile,
  serializeProgressFile,
} from '../src/app/progressFile'
import type { AppState } from '../src/app/store'
import { txConfig } from '../src/states/texas/config'

describe('SurePath progress files', () => {
  it('preserves the draft, current section, and reached steps', () => {
    const draft = emptyDraft()
    draft.applicant.firstName = 'Marcus'
    draft.applicant.lastName = 'Rivera'
    const state: AppState = { draft, sectionId: 'record', maxReachedIndex: 2 }

    const result = parseProgressFile(serializeProgressFile(state, txConfig), txConfig)

    expect(result).toEqual({ ok: true, state })
  })

  it('rejects legacy files that do not carry the versioned envelope', () => {
    const draft = emptyDraft()
    draft.applicant.firstName = 'Marcus'

    const result = parseProgressFile(JSON.stringify(draft), txConfig)

    expect(result).toEqual({ ok: false, message: INVALID_PROGRESS_FILE_MESSAGE })
  })

  it('rejects an unversioned stored application-state envelope', () => {
    const state: AppState = {
      draft: emptyDraft(),
      sectionId: 'licenses',
      maxReachedIndex: 4,
    }

    expect(parseProgressFile(JSON.stringify({ ...state, savedAt: 'earlier' }), txConfig)).toEqual({
      ok: false,
      message: INVALID_PROGRESS_FILE_MESSAGE,
    })
  })

  it('rejects files for another state', () => {
    const state: AppState = { draft: emptyDraft(), sectionId: 'info', maxReachedIndex: 0 }
    const file = JSON.parse(serializeProgressFile(state, txConfig)) as Record<string, unknown>
    file.stateCode = 'CA'

    expect(parseProgressFile(JSON.stringify(file), txConfig)).toEqual({
      ok: false,
      message: INVALID_PROGRESS_FILE_MESSAGE,
    })
  })

  it('rejects unsupported format versions without partially reading the draft', () => {
    const state: AppState = { draft: emptyDraft(), sectionId: 'record', maxReachedIndex: 1 }
    const file = JSON.parse(serializeProgressFile(state, txConfig)) as Record<string, unknown>
    file.formatVersion = 99

    expect(parseProgressFile(JSON.stringify(file), txConfig)).toEqual({
      ok: false,
      message: INVALID_PROGRESS_FILE_MESSAGE,
    })
  })

  it('returns to the first step when a valid current file has no section id', () => {
    const state: AppState = { draft: emptyDraft(), sectionId: 'record', maxReachedIndex: 1 }
    const file = JSON.parse(serializeProgressFile(state, txConfig)) as Record<string, unknown>
    delete file.sectionId

    expect(parseProgressFile(JSON.stringify(file), txConfig)).toMatchObject({
      ok: true,
      state: { sectionId: 'info', maxReachedIndex: 1 },
    })
  })

  it('rejects malformed and unrelated JSON', () => {
    expect(parseProgressFile('not json', txConfig).ok).toBe(false)
    expect(parseProgressFile('{"hello":"world"}', txConfig).ok).toBe(false)
  })

  it('does not touch stored state when restore validation fails', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem })

    const result = restoreProgressFile('{"draft":{"partial":true}}', txConfig)

    expect(result).toEqual({ ok: false, message: INVALID_PROGRESS_FILE_MESSAGE })
    expect(setItem).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('replaces stored state with the complete validated session in one write', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem })
    const state: AppState = { draft: emptyDraft(), sectionId: 'licenses', maxReachedIndex: 3 }
    state.draft.applicant.firstName = 'Restored'

    const result = restoreProgressFile(serializeProgressFile(state, txConfig), txConfig)

    expect(result).toEqual({ ok: true, state })
    expect(setItem).toHaveBeenCalledTimes(1)
    const stored = JSON.parse(setItem.mock.calls[0][1] as string)
    expect(stored).toMatchObject({
      draft: { applicant: { firstName: 'Restored' } },
      sectionId: 'licenses',
      maxReachedIndex: 3,
    })
    vi.unstubAllGlobals()
  })
})
