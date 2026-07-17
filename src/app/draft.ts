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

export type DraftIncident = {
  id: string
  county: string
  state: string
  court: string
  dateCrimeCommitted: string // MM/DD/YYYY
  dateOfConviction: string // MM/DD/YYYY
  charges: DraftCharge[]
  /** One story per incident — authored later, at the story step. */
  narrativeDraft: string
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
  addressState: 'Texas',
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
  narrativeDraft: '',
})

/** Counts for the rail. Records = convictions + deferred adjudications; never filtered. */
export function draftCounts(d: DraftCase) {
  const records = d.incidents.reduce((n, i) => n + i.charges.length, 0)
  const deferrals = d.incidents
    .flatMap((i) => i.charges)
    .filter((c) => c.disposition === 'deferred_adjudication').length
  return { incidents: d.incidents.length, records, deferrals }
}
