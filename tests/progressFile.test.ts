import { describe, expect, it } from 'vitest'
import { emptyDraft } from '../src/app/draft'
import { parseProgressFile, serializeProgressFile } from '../src/app/progressFile'
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

  it('accepts legacy files that contain only the draft', () => {
    const draft = emptyDraft()
    draft.applicant.firstName = 'Marcus'

    const result = parseProgressFile(JSON.stringify(draft), txConfig)

    expect(result).toMatchObject({
      ok: true,
      state: {
        draft: { applicant: { firstName: 'Marcus' } },
        sectionId: 'info',
        maxReachedIndex: 0,
      },
    })
  })

  it('accepts a previously stored application-state envelope', () => {
    const state: AppState = {
      draft: emptyDraft(),
      sectionId: 'licenses',
      maxReachedIndex: 4,
    }

    expect(parseProgressFile(JSON.stringify({ ...state, savedAt: 'earlier' }), txConfig)).toEqual({
      ok: true,
      state,
    })
  })

  it('rejects files for another state', () => {
    const state: AppState = { draft: emptyDraft(), sectionId: 'info', maxReachedIndex: 0 }
    const file = JSON.parse(serializeProgressFile(state, txConfig)) as Record<string, unknown>
    file.stateCode = 'CA'

    expect(parseProgressFile(JSON.stringify(file), txConfig)).toEqual({
      ok: false,
      message: 'This file belongs to a different state. Choose a Texas SurePath progress file.',
    })
  })

  it('rejects malformed and unrelated JSON', () => {
    expect(parseProgressFile('not json', txConfig).ok).toBe(false)
    expect(parseProgressFile('{"hello":"world"}', txConfig).ok).toBe(false)
  })
})
