/**
 * The fill routines. ENF006 and ENF003 take the SAME data and write it in DIFFERENT SHAPES.
 * That is not a bug to unify — it is F9, and unifying it produces two wrong forms.
 *
 *   ENF006 — county and state are TWO fields.  Buttons are /Yes /No.
 *   ENF003 — county and state are ONE field.   Buttons are /ChoiceN, non-sequentially.
 *
 * Same data. Two shapes. One packet.
 */
import type { Applicant, Case, Charge, Incident, LicenseSelection } from '../types/case'
import type { PacketDocument } from '../types/packet'
import {
  ENF003,
  ENF003_BUTTONS,
  ENF006,
  ENF006_BUTTONS,
} from './fieldMap'
import {
  clearButton,
  loadTemplate,
  setText,
  tickButton,
  type FilledDocument,
  type TemplateLoader,
} from './pdfPrimitives'
import { narrativeRef } from './packetPlan'

/** F6 — no blanks. An absent optional value is written "N/A", never left empty. */
const na = (v: string | undefined | null): string => (v && v.trim() ? v.trim() : 'N/A')

const fullName = (a: Applicant): string =>
  [a.lastName, a.firstName, a.middleName, a.suffix].filter((p) => p && p.trim()).join(', ')

// ─────────────────────────────────────────────────────────────────────────────────────────
// ENF006 — the request form. Applicant + license + CONVICTION #1. (F1)
// ─────────────────────────────────────────────────────────────────────────────────────────

export async function fillENF006(
  load: TemplateLoader,
  c: Case,
  license: LicenseSelection,
  doc: PacketDocument,
): Promise<FilledDocument> {
  const f = await loadTemplate(load, 'ENF006') // zeroAllFields() already ran. (D7)
  const a = c.applicant
  const incident = doc.incident!
  const charge = doc.charge!

  setText(f, ENF006.program, license.program)
  setText(f, ENF006.specificLicense, license.specificLicenseType)

  setText(f, ENF006.lastName, a.lastName)
  setText(f, ENF006.firstName, a.firstName)
  setText(f, ENF006.middleName, na(a.middleName))
  setText(f, ENF006.suffix, na(a.suffix))
  setText(f, ENF006.allKnownNames, na(a.allKnownNames))
  setText(f, ENF006.dob, a.dob)
  tickButton(f, ENF006_BUTTONS.gender.field, ENF006_BUTTONS.gender[a.gender])

  // ENF006.ssn — NOT WRITTEN. Never. The user hand-writes it in pen. (D3)

  setText(f, ENF006.mailingAddress, a.mailingAddress)
  setText(f, ENF006.phone, a.phone)
  setText(f, ENF006.email, na(a.email))

  // ── The business branch. (A9) ──────────────────────────────────────────────────────────
  if (a.isControllingPerson && a.business) {
    setText(f, ENF006.companyName, a.business.companyName)
    setText(f, ENF006.dba, na(a.business.dba))
    setText(f, ENF006.federalTaxId, a.business.federalTaxId)
    tickButton(f, ENF006_BUTTONS.ownership.field, ENF006_BUTTONS.ownership[a.business.ownershipType])
  } else {
    // Text fields get N/A — no blanks. (F6)
    setText(f, ENF006.companyName, 'N/A')
    setText(f, ENF006.dba, 'N/A')
    setText(f, ENF006.federalTaxId, 'N/A')
    // ⚠️ The ownership RADIO gets CLEARED, not selected. There is no /Off and no "none"
    // option — the nearest working value is /General Partnership. (F11)
    clearButton(f, ENF006_BUTTONS.ownership.field)
  }

  // ── Conviction #1. F9: county and state are SEPARATE fields here. ──────────────────────
  setText(f, ENF006.county, incident.county) // COUNTY ONLY, despite the field's name.
  setText(f, ENF006.state, incident.state)
  setText(f, ENF006.court, na(incident.court))
  setText(f, ENF006.dateCrime, incident.dateCrimeCommitted)
  setText(f, ENF006.dateConviction, incident.dateOfConviction)
  setText(f, ENF006.exactOffense, charge.exactOffense)
  setText(f, ENF006.sentence, charge.sentence)
  setText(f, ENF006.narrative, narrativeRef(doc))

  // ── Supervision. ENF006 uses semantic /Yes /No. ────────────────────────────────────────
  tickButton(f, ENF006_BUTTONS.parole.field, a.onParole ? ENF006_BUTTONS.parole.yes : ENF006_BUTTONS.parole.no)
  setText(f, ENF006.paroleOfficer, na(a.onParole ? a.paroleOfficer?.name : null))
  setText(f, ENF006.parolePhone, na(a.onParole ? a.paroleOfficer?.phone : null))

  tickButton(
    f,
    ENF006_BUTTONS.probation.field,
    a.onProbation ? ENF006_BUTTONS.probation.yes : ENF006_BUTTONS.probation.no,
  )
  setText(f, ENF006.probationOfficer, na(a.onProbation ? a.probationOfficer?.name : null))
  setText(f, ENF006.probationPhone, na(a.onProbation ? a.probationOfficer?.phone : null))

  // ENF006.dateSigned — LEFT EMPTY. The user dates it in ink, beside their signature.
  // ENF006.signature (/Sig) — NEVER TOUCHED. (L6)

  return f
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// ENF003 — the questionnaire. One per ADDITIONAL charge (2..N).
// ─────────────────────────────────────────────────────────────────────────────────────────

export async function fillENF003(
  load: TemplateLoader,
  c: Case,
  license: LicenseSelection,
  doc: PacketDocument,
): Promise<FilledDocument> {
  const f = await loadTemplate(load, 'ENF003') // zeroAllFields() already ran. (D7)
  const a = c.applicant
  const incident: Incident = doc.incident!
  const charge: Charge = doc.charge!

  // SurePath users are always NEW applicants. (Never Renewal — that was residue in the
  // mangled templates, and it is exactly what zeroAllFields exists to kill. D7)
  tickButton(f, ENF003_BUTTONS.typeOfRequest.field, ENF003_BUTTONS.typeOfRequest.new)
  setText(f, ENF003.licenseType, license.specificLicenseType)

  setText(f, ENF003.fullName, fullName(a))
  // ENF003.ssn — NOT WRITTEN. (D3) Note it is the BARE-named field; the near-identical
  // "ex johndoeaolcom…" one is the EMAIL, written below. Do not confuse them.
  setText(f, ENF003.address, a.mailingAddress)
  setText(f, ENF003.phone, a.phone)
  setText(f, ENF003.dob, a.dob)
  setText(f, ENF003.email, na(a.email))

  // ── The charge. F9: county and state are ONE field here. ───────────────────────────────
  setText(f, ENF003.countyAndState, `${incident.county}, ${incident.state}`)
  setText(f, ENF003.court, na(incident.court))
  setText(f, ENF003.dateCrime, incident.dateCrimeCommitted)
  setText(f, ENF003.dateConviction, incident.dateOfConviction)
  setText(f, ENF003.exactOffense, charge.exactOffense)
  setText(f, ENF003.sentence, charge.sentence)
  setText(f, ENF003.narrative, narrativeRef(doc))

  // ── Supervision. ⚠️ ENF003 uses /ChoiceN, NON-SEQUENTIALLY. Parole-yes is /Choice3. ────
  // Item 16 is a renewals-only question; our users are new applicants, so "No".
  // (OPEN_QUESTIONS Q7 — a radio cannot hold "N/A" and a blank risks rejection.)
  tickButton(f, ENF003_BUTTONS.renewalQuestion.field, ENF003_BUTTONS.renewalQuestion.no)

  tickButton(f, ENF003_BUTTONS.parole.field, a.onParole ? ENF003_BUTTONS.parole.yes : ENF003_BUTTONS.parole.no)
  setText(f, ENF003.paroleOfficer, na(a.onParole ? a.paroleOfficer?.name : null))
  setText(f, ENF003.parolePhone, na(a.onParole ? a.paroleOfficer?.phone : null))

  tickButton(
    f,
    ENF003_BUTTONS.probation.field,
    a.onProbation ? ENF003_BUTTONS.probation.yes : ENF003_BUTTONS.probation.no,
  )
  setText(f, ENF003.probationOfficer, na(a.onProbation ? a.probationOfficer?.name : null))
  setText(f, ENF003.probationPhone, na(a.onProbation ? a.probationOfficer?.phone : null))

  // ENF003.dateSigned — LEFT EMPTY. ENF003.signature (/Sig) — NEVER TOUCHED. (L6)

  return f
}
