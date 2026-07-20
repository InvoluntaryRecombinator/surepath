import { describe, expect, it } from 'vitest'
import { emptyDraft, newIncident } from '../src/app/draft'
import { validateSection } from '../src/app/sectionValidation'

function completeApplicantDraft() {
  const draft = emptyDraft()
  Object.assign(draft.applicant, {
    lastName: 'Rivera',
    firstName: 'Marcus',
    dob: '04/12/1987',
    gender: 'male',
    addressStreet: '4412 Larkspur Lane',
    addressCity: 'Houston',
    addressState: 'Texas',
    addressZip: '77002',
    phone: '(713) 555-0148',
    email: 'marcus@example.com',
  })
  return draft
}

describe('section completion', () => {
  it('does not complete About You until every base requirement is present', () => {
    const draft = completeApplicantDraft()
    expect(validateSection('info', draft).complete).toBe(true)

    draft.applicant.firstName = '   '
    expect(validateSection('info', draft)).toMatchObject({
      complete: false,
      issues: [{ field: 'applicant.firstName' }],
    })
  })

  it('rejects malformed contact formats', () => {
    const draft = completeApplicantDraft()
    draft.applicant.dob = '4/12/87'
    draft.applicant.addressZip = '7702'
    draft.applicant.phone = '555-0148'
    draft.applicant.email = 'not-an-email'

    expect(validateSection('info', draft).issues.map((issue) => issue.field)).toEqual([
      'applicant.dob',
      'applicant.addressZip',
      'applicant.phone',
      'applicant.email',
    ])
  })

  it('requires only the conditional branches the applicant turned on', () => {
    const draft = completeApplicantDraft()
    draft.applicant.onParole = true
    draft.applicant.onProbation = true
    draft.applicant.isControllingPerson = true

    expect(validateSection('info', draft).issues.map((issue) => issue.field)).toEqual([
      'applicant.paroleOfficerName',
      'applicant.paroleOfficerPhone',
      'applicant.probationOfficerName',
      'applicant.probationOfficerPhone',
      'applicant.businessName',
      'applicant.businessTaxId',
      'applicant.businessOwnership',
    ])
  })

  it('requires one complete incident with one complete record', () => {
    const draft = emptyDraft()
    expect(validateSection('record', draft).issues[0].field).toBe('incidents')

    const incident = newIncident('Texas')
    draft.incidents.push(incident)
    expect(validateSection('record', draft).complete).toBe(false)

    Object.assign(incident, {
      county: 'Harris',
      court: '178th District Court',
      dateCrimeCommitted: '03/04/2010',
      dateOfConviction: '08/19/2010',
    })
    Object.assign(incident.charges[0], {
      exactOffense: 'Theft',
      sentence: '12 months probation',
      disposition: 'conviction',
    })

    expect(validateSection('record', draft)).toEqual({ complete: true, issues: [] })
  })

  it('treats stages without required UI as pass-through until their fields exist', () => {
    expect(validateSection('trade', emptyDraft()).complete).toBe(true)
    // licenses now has a real rule: at least one, each with a named type
    expect(validateSection('licenses', emptyDraft()).complete).toBe(false)
    const withLicense = { ...emptyDraft(), licenses: [{ program: 'Electricians', specificLicenseType: 'Apprentice Electrician' }] }
    expect(validateSection('licenses', withLicense).complete).toBe(true)
    const unnamed = { ...emptyDraft(), licenses: [{ program: 'Electricians', specificLicenseType: '' }] }
    expect(validateSection('licenses', unnamed).complete).toBe(false)
  })
})

describe('story migration — legacy narrativeDraft normalizes, unaffirmed (§7)', () => {
  it('normalizeIncident carries the old string into narrative.draft with affirmed=false', async () => {
    const { normalizeIncident, newIncident } = await import('../src/app/draft')
    const legacy = {
      ...newIncident('Texas'),
      narrativeDraft: 'the old account text',
    } as Parameters<typeof normalizeIncident>[0] & { narrative?: never }
    // simulate a stored shape that predates the narrative object entirely
    const stripped = { ...legacy } as Record<string, unknown>
    delete stripped.narrative
    const migrated = normalizeIncident(stripped as Parameters<typeof normalizeIncident>[0])
    expect(migrated.narrative.draft).toBe('the old account text')
    expect(migrated.narrative.affirmed).toBe(false) // they never affirmed — §7 re-gates, honestly
    expect('narrativeDraft' in migrated).toBe(false)
  })
})
