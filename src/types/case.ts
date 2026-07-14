/**
 * The case tree. ARCHITECTURE.md §4.
 *
 * This is the whole product. Get it right and everything else follows.
 */

export type Case = {
  applicant: Applicant
  incidents: Incident[] // one per ARREST EVENT
  licenses: LicenseSelection[] // late-binding; chosen AFTER the record
  supportingEvidence?: SupportingEvidence // ⚠️ NO UI YET. Field exists now so Q1's answer is a screen, not a migration.
  version: 1
}

export type Officer = { name: string; phone: string }

export type OwnershipType =
  | 'general_partnership'
  | 'sole_proprietor'
  | 'llc'
  | 'llp'
  | 'corporation'

export type Business = {
  companyName: string
  dba: string
  federalTaxId: string
  ownershipType: OwnershipType
}

export type Applicant = {
  lastName: string
  firstName: string
  middleName: string
  suffix: string
  allKnownNames: string // maiden, alias, nickname
  dob: string // MM/DD/YYYY
  gender: 'male' | 'female' // the form offers exactly these two. Not our choice to make.
  mailingAddress: string
  phone: string
  email: string

  // SSN IS ABSENT BY DESIGN. There is no field. Do not add one. (D3)

  isControllingPerson: boolean // default FALSE → business branch hidden, written N/A (A9)
  business?: Business

  onParole: boolean
  paroleOfficer?: Officer
  onProbation: boolean
  probationOfficer?: Officer
}

export type Incident = {
  id: string
  county: string // "Harris"   ENF006 SPLITS county/state. ENF003 COMBINES them. (F9)
  state: string // "Texas"
  court: string // "178th District Court"  — may be "court unknown". Precision is SOFT.
  dateCrimeCommitted: string // MM/DD/YYYY
  dateOfConviction: string // MM/DD/YYYY — or of deferred adjudication
  narrative: Narrative // ONE story per event (NARRATIVE_AUTHORING = 'per_incident')
  charges: Charge[] // 1..n records from this single event
}

/**
 * `disposition` — READ THIS BEFORE YOU USE IT.
 *
 * It exists for UI COPY ONLY: so the counter can say "9 CONVICTIONS & DEFERRALS" instead of
 * calling a deferred adjudication a conviction on the exact screen where the user reconciles
 * against their rap sheet. TDLR itself distinguishes them (FAQ #8) and both form fields read
 * "conviction or deferred adjudication".
 *
 * IT IS NEVER A FILTER.
 * It is NEVER a reason to omit, hide, dim, de-emphasise, or make optional a record. (D1, D2)
 * It is NEVER written to a PDF field that did not ask for it.
 *
 * A deferred adjudication is reported EXACTLY like a conviction. It gets its own ENF003,
 * its own narrative, its own line on the review wall. The moment this field exists, the
 * temptation to branch on it exists. There is no branch. There is no lookback. Ever.
 */
export type Charge = {
  id: string
  exactOffense: string // REQUIRED. No default. No pre-fill. No inherit. (A12)
  sentence: string // REQUIRED. Same.
  disposition: 'conviction' | 'deferred_adjudication' // UI COPY ONLY. See above.
}

export type ProvenanceFlag = {
  sentence: string
  mapsTo: string | null // null → this sentence is NOT in the user's own words. Flag it. (L3)
}

export type Narrative = {
  rawAnswers: { facts: string; why: string; whatChanged: string; madeItRight: string }
  draft: string // model output OR the user's own writing
  edited: boolean
  provenance: ProvenanceFlag[]
}

/** One packet + one $10 money order, each. (F3) */
export type LicenseSelection = {
  program: string // ENF006 item 1
  specificLicenseType: string // ENF006 item 2 · ENF003 item 2
}

/** ⚠️ OPTIONAL. NO UI IN THE MVP. Behind FEATURE_SUPPORTING_EVIDENCE, pending OPEN_QUESTIONS Q1. */
export type SupportingEvidence = {
  employmentProof?: string[]
  recommendationLetters?: string[]
  restitutionPaid?: boolean
  programCompletions?: string[]
}

/** Every charge in the case, flattened, with its incident. The packet is built from this order. */
export function allCharges(c: Case): { incident: Incident; charge: Charge; incidentIndex: number }[] {
  return c.incidents.flatMap((incident, incidentIndex) =>
    incident.charges.map((charge) => ({ incident, charge, incidentIndex })),
  )
}
