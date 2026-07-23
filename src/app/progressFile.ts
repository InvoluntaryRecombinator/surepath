import { z } from 'zod'
import type { StateConfig } from '../state-config/types'
import type { AppState } from './store'
import { emptyRawAnswers, type DraftApplicant, type DraftCase, type DraftIncident } from './draft'
import { validateSection } from './sectionValidation'
import { storageKey } from './storeContext'

const optionalText = z.string().optional().default('')

const applicantSchema = z.object({
  lastName: optionalText,
  firstName: optionalText,
  middleName: optionalText,
  suffix: optionalText,
  allKnownNames: optionalText,
  dob: optionalText,
  gender: z.enum(['male', 'female', '']).optional().default(''),
  addressStreet: optionalText,
  addressCity: optionalText,
  addressState: optionalText,
  addressZip: optionalText,
  phone: optionalText,
  email: optionalText,
  isControllingPerson: z.boolean().optional().default(false),
  businessName: optionalText,
  businessDba: optionalText,
  businessTaxId: optionalText,
  businessOwnership: z
    .enum(['general_partnership', 'sole_proprietor', 'llc', 'llp', 'corporation', ''])
    .optional()
    .default(''),
  onParole: z.boolean().optional().default(false),
  paroleOfficerName: optionalText,
  paroleOfficerPhone: optionalText,
  onProbation: z.boolean().optional().default(false),
  probationOfficerName: optionalText,
  probationOfficerPhone: optionalText,
})

const chargeSchema = z.object({
  id: z.string().min(1),
  exactOffense: optionalText,
  sentence: optionalText,
  disposition: z.enum(['conviction', 'deferred_adjudication', '']).optional().default(''),
})

const rawAnswersSchema = z.object({
  facts: optionalText,
  why: optionalText,
  whatChanged: optionalText,
  madeItRight: optionalText,
})

const narrativeSchema = z.object({
  rawAnswers: rawAnswersSchema.optional().default({ ...emptyRawAnswers }),
  draft: optionalText,
  affirmed: z.boolean().optional().default(false),
})

const incidentSchema = z
  .object({
    id: z.string().min(1),
    county: optionalText,
    state: optionalText,
    court: optionalText,
    dateCrimeCommitted: optionalText,
    dateOfConviction: optionalText,
    charges: z.array(chargeSchema).optional().default([]),
    narrative: narrativeSchema.optional(),
    narrativeDraft: z.string().optional(),
  })
  .transform(
    (incident): DraftIncident => ({
      id: incident.id,
      county: incident.county,
      state: incident.state,
      court: incident.court,
      dateCrimeCommitted: incident.dateCrimeCommitted,
      dateOfConviction: incident.dateOfConviction,
      charges: incident.charges,
      narrative:
        incident.narrative ?? {
          rawAnswers: { ...emptyRawAnswers },
          draft: incident.narrativeDraft ?? '',
          affirmed: false,
        },
    }),
  )

const draftSchema = z
  .object({
    applicant: applicantSchema,
    incidents: z.array(incidentSchema).optional().default([]),
    licenses: z
      .array(z.object({ program: z.string(), specificLicenseType: z.string() }))
      .optional()
      .default([]),
    version: z.literal(1),
  })
  .transform(
    (draft): DraftCase => ({
      applicant: draft.applicant as DraftApplicant,
      incidents: draft.incidents,
      licenses: draft.licenses,
      version: 1,
    }),
  )

const storedProgressSchema = z.object({
  draft: draftSchema,
  sectionId: z.string(),
  maxReachedIndex: z.number().int().nonnegative(),
})

const progressFileSchema = storedProgressSchema.extend({
  format: z.literal('surepath-progress'),
  formatVersion: z.literal(1),
  stateCode: z.string(),
  savedAt: z.string(),
})

export type ProgressImportResult =
  | { ok: true; state: AppState }
  | { ok: false; message: string }

function normalizePosition(
  draft: DraftCase,
  sectionId: string,
  maxReachedIndex: number,
  config: StateConfig,
): AppState {
  const sectionIndex = config.sections.findIndex((section) => section.id === sectionId)
  const safeIndex = sectionIndex >= 0 ? sectionIndex : 0
  return {
    draft,
    sectionId: config.sections[safeIndex].id,
    maxReachedIndex: Math.max(
      safeIndex,
      Math.min(maxReachedIndex, config.sections.length - 1),
    ),
  }
}

function positionLegacyDraft(draft: DraftCase, config: StateConfig): AppState {
  const firstIncomplete = config.sections.findIndex(
    (section) =>
      !validateSection(section.id, draft, {
        agency: config.agency,
        narrativeItemLabel: config.copy.narrativeItemLabel,
      }).complete,
  )
  const index = firstIncomplete >= 0 ? firstIncomplete : config.sections.length - 1
  return {
    draft,
    sectionId: config.sections[index].id,
    maxReachedIndex: index,
  }
}

export function serializeProgressFile(state: AppState, config: StateConfig): string {
  return JSON.stringify(
    {
      format: 'surepath-progress',
      formatVersion: 1,
      stateCode: config.code,
      savedAt: new Date().toISOString(),
      draft: state.draft,
      sectionId: state.sectionId,
      maxReachedIndex: state.maxReachedIndex,
    },
    null,
    2,
  )
}

export function parseProgressFile(text: string, config: StateConfig): ProgressImportResult {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, message: 'That file is not a valid SurePath progress file.' }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, message: 'That file is not a valid SurePath progress file.' }
  }

  if ('format' in value) {
    const result = progressFileSchema.safeParse(value)
    if (!result.success) {
      return {
        ok: false,
        message: 'This progress file is damaged or was created by an unsupported version of SurePath.',
      }
    }
    if (result.data.stateCode.toUpperCase() !== config.code.toUpperCase()) {
      return {
        ok: false,
        message: `This file belongs to a different state. Choose a ${config.stateName} SurePath progress file.`,
      }
    }
    return {
      ok: true,
      state: normalizePosition(
        result.data.draft,
        result.data.sectionId,
        result.data.maxReachedIndex,
        config,
      ),
    }
  }

  const stored = storedProgressSchema.safeParse(value)
  if (stored.success) {
    return {
      ok: true,
      state: normalizePosition(
        stored.data.draft,
        stored.data.sectionId,
        stored.data.maxReachedIndex,
        config,
      ),
    }
  }

  // Files downloaded by the first Save Progress implementation contained only the draft.
  const legacy = draftSchema.safeParse(value)
  if (legacy.success) return { ok: true, state: positionLegacyDraft(legacy.data, config) }

  return { ok: false, message: 'That file is not a valid SurePath progress file.' }
}

export function downloadProgressFile(state: AppState, config: StateConfig): void {
  const url = URL.createObjectURL(
    new Blob([serializeProgressFile(state, config)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `surepath-progress-${config.code.toLowerCase()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function storeImportedProgress(state: AppState, config: StateConfig): void {
  localStorage.setItem(
    storageKey(config),
    JSON.stringify({ ...state, savedAt: new Date().toISOString() }),
  )
}
