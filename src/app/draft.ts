/**
 * The DRAFT case — what the application collects, mid-flight. Looser than the document
 * service's Case (fields may still be empty while the user works); it converts to a full
 * Case at generate time, where completeness is enforced (the wall — Stage Review).
 *
 * NO SSN FIELD EXISTS HERE, and never will (D3). That is what makes on-device storage
 * defensible at all (D4, as amended).
 */

export type DraftCharge = {
  id: string
  exactOffense: string // REQUIRED before generate. No default. No pre-fill. No inherit. (A12)
  sentence: string // REQUIRED before generate. Same.
  /** UI copy only — NEVER a filter, NEVER a reason to omit, NEVER written to a PDF field
   *  that didn't ask (D1, D2). Empty until the user chooses; both are reported identically. */
  disposition: 'conviction' | 'deferred_adjudication' | ''
}

/** The four structured answers the assistant gathers. Persisted. */
export type RawAnswers = {
  facts: string
  why: string
  whatChanged: string
  madeItRight: string
}

export const emptyRawAnswers: RawAnswers = { facts: '', why: '', whatChanged: '', madeItRight: '' }

/**
 * The persisted narrative (AGENT_SPEC §2, as decided): rawAnswers, the draft (THE artifact),
 * the model's self-reported assumptions, and the §7 affirmation. The conversation
 * transcript is DELIBERATELY absent — messages[] are session-only, because the interview is
 * the most sensitive text in the app and does not sit on a shared computer's disk.
 *
 * Keyed by INCIDENT, never by charge. If you find yourself writing charge.narrative, stop —
 * you are about to make someone write the same story four times.
 */
export type DraftNarrative = {
  rawAnswers: RawAnswers
  draft: string
  assumptions: string[]
  /** §7: the user confirmed this is their own true account. Reset by ANY change to draft. */
  affirmed: boolean
}

export const emptyNarrative = (): DraftNarrative => ({
  rawAnswers: { ...emptyRawAnswers },
  draft: '',
  assumptions: [],
  affirmed: false,
})

export type DraftIncident = {
  id: string
  county: string
  state: string
  court: string
  dateCrimeCommitted: string // MM/DD/YYYY
  dateOfConviction: string // MM/DD/YYYY
  charges: DraftCharge[]
  /** One story per incident — authored at the story step. */
  narrative: DraftNarrative
}

export type DraftApplicant = {
  lastName: string
  firstName: string
  middleName: string
  suffix: string
  allKnownNames: string
  dob: string
  gender: 'male' | 'female' | ''
  // The address is collected structured (street/city/state/zip) and composed into the
  // form's single mailing-address line at fill time.
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  phone: string
  email: string
  isControllingPerson: boolean
  // The business branch — hidden in the UI unless isControllingPerson; written N/A in the
  // PDF otherwise, with the ownership radio CLEARED, never selected (A9, F11).
  businessName: string
  businessDba: string
  businessTaxId: string
  businessOwnership:
    | 'general_partnership'
    | 'sole_proprietor'
    | 'llc'
    | 'llp'
    | 'corporation'
    | ''
  onParole: boolean
  paroleOfficerName: string
  paroleOfficerPhone: string
  onProbation: boolean
  probationOfficerName: string
  probationOfficerPhone: string
}

export type DraftCase = {
  applicant: DraftApplicant
  incidents: DraftIncident[]
  licenses: { program: string; specificLicenseType: string }[]
  version: 1
}

export const emptyApplicant: DraftApplicant = {
  lastName: '',
  firstName: '',
  middleName: '',
  suffix: '',
  allKnownNames: '',
  dob: '',
  gender: '',
  addressStreet: '',
  addressCity: '',
  addressState: '', // state default applied from stateConfig at store init — never hardcoded here
  addressZip: '',
  phone: '',
  email: '',
  isControllingPerson: false,
  businessName: '',
  businessDba: '',
  businessTaxId: '',
  businessOwnership: '',
  onParole: false,
  paroleOfficerName: '',
  paroleOfficerPhone: '',
  onProbation: false,
  probationOfficerName: '',
  probationOfficerPhone: '',
}

export const emptyDraft = (): DraftCase => ({
  applicant: { ...emptyApplicant },
  incidents: [],
  licenses: [],
  version: 1,
})

let counter = 0
export const newId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

export const newCharge = (): DraftCharge => ({
  id: newId('chg'),
  exactOffense: '',
  sentence: '',
  disposition: '',
})

export const newIncident = (defaultState: string): DraftIncident => ({
  id: newId('inc'),
  county: '',
  state: defaultState,
  court: '',
  dateCrimeCommitted: '',
  dateOfConviction: '',
  charges: [newCharge()],
  narrative: emptyNarrative(),
})

/**
 * Migration: normalize an incident from any older stored shape. The legacy field was
 * `narrativeDraft: string`; it becomes narrative.draft with affirmed=false — the user never
 * affirmed under the old scheme, and §7 says they must, so the section honestly re-gates.
 */
export function normalizeIncident(raw: DraftIncident & { narrativeDraft?: string }): DraftIncident {
  const legacyDraft = typeof raw.narrativeDraft === 'string' ? raw.narrativeDraft : ''
  const narrative: DraftNarrative = {
    ...emptyNarrative(),
    ...(raw.narrative ?? {}),
    rawAnswers: { ...emptyRawAnswers, ...(raw.narrative?.rawAnswers ?? {}) },
  }
  if (!narrative.draft && legacyDraft) narrative.draft = legacyDraft
  const { narrativeDraft: _legacy, ...rest } = raw
  void _legacy
  return { ...rest, narrative }
}

/** Counts for the rail. Records = convictions + deferred adjudications; never filtered. */
export function draftCounts(d: DraftCase) {
  const records = d.incidents.reduce((n, i) => n + i.charges.length, 0)
  const deferrals = d.incidents
    .flatMap((i) => i.charges)
    .filter((c) => c.disposition === 'deferred_adjudication').length
  return { incidents: d.incidents.length, records, deferrals }
}
