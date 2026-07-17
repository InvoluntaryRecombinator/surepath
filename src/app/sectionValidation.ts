import type { DraftCase } from './draft'

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

export function validateSection(sectionId: string, draft: DraftCase): SectionValidation {
  switch (sectionId) {
    case 'info':
      return applicantValidation(draft)
    case 'record':
      return recordValidation(draft)
    default:
      // These stages do not expose required inputs yet. Add their rules with their UI.
      return { complete: true, issues: [] }
  }
}
