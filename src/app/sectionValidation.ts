import type { DraftCase } from './draft'
import { dateOnOrAfter, dateProblem } from './lib/format'

/** State-specific message context. Optional: without it, messages stay generic — no agency
 *  name or form-item label is ever hardcoded here. */
export type ValidationContext = { agency?: string; narrativeItemLabel?: string }

export type ValidationIssue = {
  field: string
  message: string
}

export type SectionValidation = {
  complete: boolean
  issues: ValidationIssue[]
}

const DATE = /^\d{2}\/\d{2}\/\d{4}$/
const ZIP = /^\d{5}(?:-\d{4})?$/
const EMAIL = /^[^\s@]+@[^\s@]+$/

const hasText = (value: string) => value.trim().length > 0
const hasPhone = (value: string) => value.replace(/\D/g, '').length === 10

function applicantValidation(draft: DraftCase): SectionValidation {
  const a = draft.applicant
  const issues: ValidationIssue[] = []
  const requireText = (field: keyof typeof a, message: string) => {
    if (!hasText(String(a[field]))) issues.push({ field: `applicant.${field}`, message })
  }

  requireText('lastName', 'Enter your last name as it appears on your ID.')
  requireText('firstName', 'Enter your first name as it appears on your ID.')

  if (!DATE.test(a.dob)) {
    issues.push({ field: 'applicant.dob', message: 'Enter your date of birth as MM/DD/YYYY.' })
  } else {
    const problem = dateProblem(a.dob)
    if (problem) issues.push({ field: 'applicant.dob', message: problem })
  }
  if (!a.gender) issues.push({ field: 'applicant.gender', message: 'Choose a gender.' })

  requireText('addressStreet', 'Enter a mailing address.')
  requireText('addressCity', 'Enter a city.')
  requireText('addressState', 'Choose a state.')
  if (!ZIP.test(a.addressZip)) {
    issues.push({ field: 'applicant.addressZip', message: 'Enter a 5-digit or ZIP+4 code.' })
  }
  if (!hasPhone(a.phone)) {
    issues.push({ field: 'applicant.phone', message: 'Enter a 10-digit phone number.' })
  }
  if (!EMAIL.test(a.email)) {
    issues.push({ field: 'applicant.email', message: 'Enter an email address.' })
  }

  if (a.onParole) {
    requireText('paroleOfficerName', "Enter your parole officer's name.")
    if (!hasPhone(a.paroleOfficerPhone)) {
      issues.push({
        field: 'applicant.paroleOfficerPhone',
        message: "Enter your parole officer's 10-digit phone number.",
      })
    }
  }

  if (a.onProbation) {
    requireText('probationOfficerName', "Enter your probation officer's name.")
    if (!hasPhone(a.probationOfficerPhone)) {
      issues.push({
        field: 'applicant.probationOfficerPhone',
        message: "Enter your probation officer's 10-digit phone number.",
      })
    }
  }

  if (a.isControllingPerson) {
    requireText('businessName', 'Enter the company name.')
    requireText('businessTaxId', 'Enter the federal tax ID.')
    if (!a.businessOwnership) {
      issues.push({
        field: 'applicant.businessOwnership',
        message: 'Choose the type of company ownership.',
      })
    }
  }

  return { complete: issues.length === 0, issues }
}

function recordValidation(draft: DraftCase): SectionValidation {
  const issues: ValidationIssue[] = []

  if (draft.incidents.length === 0) {
    issues.push({ field: 'incidents', message: 'Add at least one incident or conviction.' })
  }

  draft.incidents.forEach((incident, incidentIndex) => {
    const prefix = `incidents.${incident.id}`
    const label = `Incident ${incidentIndex + 1}`
    const required = [
      ['county', incident.county, `${label}: enter the county.`],
      ['state', incident.state, `${label}: enter the state.`],
      ['court', incident.court, `${label}: enter the court.`],
      ['dateCrimeCommitted', incident.dateCrimeCommitted, `${label}: enter the date committed.`],
      ['dateOfConviction', incident.dateOfConviction, `${label}: enter the disposition date.`],
    ] as const

    required.forEach(([field, value, message]) => {
      if (!hasText(value)) issues.push({ field: `${prefix}.${field}`, message })
    })

    // Real date validation at the step — not just "not empty" caught at Review.
    for (const field of ['dateCrimeCommitted', 'dateOfConviction'] as const) {
      const problem = hasText(incident[field]) ? dateProblem(incident[field]) : null
      if (problem) issues.push({ field: `${prefix}.${field}`, message: `${label}: ${problem}` })
    }
    if (
      !dateProblem(incident.dateCrimeCommitted) &&
      !dateProblem(incident.dateOfConviction) &&
      hasText(incident.dateCrimeCommitted) &&
      hasText(incident.dateOfConviction) &&
      !dateOnOrAfter(incident.dateOfConviction, incident.dateCrimeCommitted)
    ) {
      issues.push({
        field: `${prefix}.dateOfConviction`,
        message: `${label}: the disposition date is before the date the crime was committed.`,
      })
    }

    if (incident.charges.length === 0) {
      issues.push({ field: `${prefix}.charges`, message: `${label}: add at least one record.` })
    }

    incident.charges.forEach((charge, chargeIndex) => {
      const chargePrefix = `${prefix}.charges.${charge.id}`
      const chargeLabel = `${label}, record ${chargeIndex + 1}`
      if (!hasText(charge.exactOffense)) {
        issues.push({ field: `${chargePrefix}.exactOffense`, message: `${chargeLabel}: enter the offense.` })
      }
      if (!hasText(charge.sentence)) {
        issues.push({ field: `${chargePrefix}.sentence`, message: `${chargeLabel}: enter the sentence.` })
      }
      if (!charge.disposition) {
        issues.push({ field: `${chargePrefix}.disposition`, message: `${chargeLabel}: choose how it was resolved.` })
      }
    })
  })

  return { complete: issues.length === 0, issues }
}

function storyValidation(draft: DraftCase, ctx: ValidationContext): SectionValidation {
  const agency = ctx.agency ?? 'the licensing board'
  const item = ctx.narrativeItemLabel ?? 'the account'
  const issues: ValidationIssue[] = []
  draft.incidents.forEach((incident, i) => {
    if (!hasText(incident.narrative.draft)) {
      issues.push({
        field: `incidents.${incident.id}.narrative`,
        message: `Incident ${i + 1} still needs its account — ${agency} won't process a request with ${item} left blank.`,
      })
    } else if (!incident.narrative.affirmed) {
      issues.push({
        field: `incidents.${incident.id}.narrative`,
        message: `Incident ${i + 1}: open the account and check the confirmation box — it verifies this is your own true account, and it goes on the forms sent to ${agency}.`,
      })
    }
  })
  return { complete: issues.length === 0, issues }
}

function licensesValidation(draft: DraftCase): SectionValidation {
  const issues: ValidationIssue[] = []
  if (draft.licenses.length === 0) {
    issues.push({
      field: 'licenses',
      message: 'Choose at least one license type — each one becomes its own packet.',
    })
  }
  draft.licenses.forEach((l, i) => {
    if (!hasText(l.program)) issues.push({ field: `licenses.${i}.program`, message: `License ${i + 1}: missing the program.` })
    if (!hasText(l.specificLicenseType)) issues.push({ field: `licenses.${i}.specificLicenseType`, message: `License ${i + 1}: name the specific license type.` })
  })
  return { complete: issues.length === 0, issues }
}

export function validateSection(
  sectionId: string,
  draft: DraftCase,
  ctx: ValidationContext = {},
): SectionValidation {
  switch (sectionId) {
    case 'info':
      return applicantValidation(draft)
    case 'record':
      return recordValidation(draft)
    case 'story':
      return storyValidation(draft, ctx)
    case 'licenses':
      return licensesValidation(draft)
    default:
      // These stages do not expose required inputs yet. Add their rules with their UI.
      return { complete: true, issues: [] }
  }
}
