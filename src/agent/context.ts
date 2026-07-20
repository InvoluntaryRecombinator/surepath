/**
 * buildNarrativeContext — the ONLY thing the narrative agent ever sees. (AGENT_SPEC §2, D6)
 *
 * Pure. Built from a single DraftIncident. NO name, NO DOB, NO SSN, NO address, NO phone,
 * NO email, NO other incidents. The function cannot leak what it never receives — the
 * applicant is not a parameter, and that is the design, not an accident. Asserted by test.
 *
 * The narrative is keyed by incidentId, never by chargeId. If you ever find yourself
 * writing `charge.narrative`, stop — you are about to make someone write the same story
 * four times.
 *
 * Carries ALL charges from the incident, because that is the point of modelling incidents:
 * the model must see everything from that night to write one true account instead of
 * amputated fragments.
 */
import { emptyRawAnswers, type DraftCharge, type DraftIncident, type RawAnswers } from '../app/draft'

export { emptyRawAnswers, type RawAnswers }

export type NarrativeContext = {
  incidentId: string
  county: string
  state: string
  court: string
  dateCrimeCommitted: string
  dateOfConviction: string
  charges: {
    exactOffense: string
    sentence: string
    disposition: DraftCharge['disposition']
  }[]
  rawAnswers: RawAnswers
}

export function buildNarrativeContext(
  incident: DraftIncident,
  rawAnswers: RawAnswers = incident.narrative.rawAnswers,
): NarrativeContext {
  return {
    incidentId: incident.id,
    county: incident.county,
    state: incident.state,
    court: incident.court,
    dateCrimeCommitted: incident.dateCrimeCommitted,
    dateOfConviction: incident.dateOfConviction,
    charges: incident.charges.map((c) => ({
      exactOffense: c.exactOffense,
      sentence: c.sentence,
      disposition: c.disposition,
    })),
    rawAnswers: { ...rawAnswers },
  }
}
