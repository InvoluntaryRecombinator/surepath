/**
 * The bridge: DraftCase (what the app collects, loosely) → Case (what the document
 * service demands, strictly). Pure. Called only at generation time, after the review wall.
 *
 * FAIL CLOSED: an incomplete draft throws with every problem listed, because a Case with
 * silently-defaulted fields becomes a signed federal form with silently-defaulted fields.
 * Nothing here invents a value: empty optional text becomes 'N/A' downstream in the fill
 * routines (F6), never here.
 */
import type { Applicant, Case, Charge, Incident } from '../types/case'
import type { DraftCase, DraftCharge, DraftIncident } from './draft'
import { validateSection, type ValidationContext } from './sectionValidation'

export class IncompleteDraftError extends Error {
  issues: string[]
  constructor(issues: string[]) {
    super(`Draft is not ready to generate: ${issues.length} issue(s). First: ${issues[0]}`)
    this.name = 'IncompleteDraftError'
    this.issues = issues
  }
}

function toCharge(c: DraftCharge): Charge {
  return {
    id: c.id,
    exactOffense: c.exactOffense.trim(),
    sentence: c.sentence.trim(),
    // validated non-empty before conversion; the assertion below backstops it
    disposition: c.disposition as Charge['disposition'],
  }
}

function toIncident(i: DraftIncident): Incident {
  return {
    id: i.id,
    county: i.county.trim(),
    state: i.state.trim(),
    court: i.court.trim(),
    dateCrimeCommitted: i.dateCrimeCommitted.trim(),
    dateOfConviction: i.dateOfConviction.trim(),
    narrative: {
      rawAnswers: { ...i.narrative.rawAnswers },
      draft: i.narrative.draft.trim(),
      edited: true,
      provenance: [],
    },
    charges: i.charges.map(toCharge),
  }
}

export function draftToCase(draft: DraftCase, ctx: ValidationContext = {}): Case {
  const issues: string[] = [
    ...validateSection('info', draft, ctx).issues,
    ...validateSection('record', draft, ctx).issues,
    ...validateSection('story', draft, ctx).issues,
    ...validateSection('licenses', draft, ctx).issues,
  ].map((i) => i.message)

  if (issues.length > 0) throw new IncompleteDraftError(issues)

  const a = draft.applicant
  const applicant: Applicant = {
    lastName: a.lastName.trim(),
    firstName: a.firstName.trim(),
    middleName: a.middleName.trim(),
    suffix: a.suffix.trim(),
    allKnownNames: a.allKnownNames.trim(),
    dob: a.dob,
    gender: a.gender as Applicant['gender'],
    // ENF006/ENF003 want one mailing-address line; the app collects it structured.
    mailingAddress: `${a.addressStreet.trim()}, ${a.addressCity.trim()}, ${a.addressState.trim()} ${a.addressZip.trim()}`,
    phone: a.phone.trim(),
    email: a.email.trim(),
    isControllingPerson: a.isControllingPerson,
    ...(a.isControllingPerson && {
      business: {
        companyName: a.businessName.trim(),
        dba: a.businessDba.trim(),
        federalTaxId: a.businessTaxId.trim(),
        ownershipType: a.businessOwnership as NonNullable<Applicant['business']>['ownershipType'],
      },
    }),
    onParole: a.onParole,
    ...(a.onParole && {
      paroleOfficer: { name: a.paroleOfficerName.trim(), phone: a.paroleOfficerPhone.trim() },
    }),
    onProbation: a.onProbation,
    ...(a.onProbation && {
      probationOfficer: {
        name: a.probationOfficerName.trim(),
        phone: a.probationOfficerPhone.trim(),
      },
    }),
  }

  return {
    version: 1,
    applicant,
    incidents: draft.incidents.map(toIncident),
    licenses: draft.licenses.map((l) => ({
      program: l.program.trim(),
      specificLicenseType: l.specificLicenseType.trim(),
    })),
  }
}
