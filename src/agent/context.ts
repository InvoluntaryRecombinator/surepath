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
import { emptyRawAnswers, type DraftCharge, type DraftIncident, type RawAnswers } from '../app/draft.js'

export { emptyRawAnswers, type RawAnswers }

export type NarrativeContext = {
  incidentId: string
  /** DATA MINIMIZATION (D6, tested): county, court, and exact dates NEVER ride to the
   *  model. County + court + day-precise dates + offense is a public-court-record
   *  fingerprint; state + year + charge is a crowd. The years alone anchor the draft
   *  ("In 2019…") — the form itself carries the precise fields. */
  state: string
  yearOfEvents: string
  yearResolved: string
  charges: {
    exactOffense: string
    sentence: string
    disposition: DraftCharge['disposition']
  }[]
  rawAnswers: RawAnswers
  /** The account as it stands — the revision substrate on a return visit, when the
   *  transcript (session-only, §2) is gone. Empty string until a draft exists. */
  currentAccount: string
}

export function buildNarrativeContext(
  incident: DraftIncident,
  rawAnswers: RawAnswers = incident.narrative.rawAnswers,
  currentAccount: string = incident.narrative.draft,
): NarrativeContext {
  const year = (mmddyyyy: string) => {
    const m = /(\d{4})\s*$/.exec(mmddyyyy.trim())
    return m ? m[1] : ''
  }
  return {
    incidentId: incident.id,
    state: incident.state,
    yearOfEvents: year(incident.dateCrimeCommitted),
    yearResolved: year(incident.dateOfConviction),
    charges: incident.charges.map((c) => ({
      exactOffense: c.exactOffense,
      sentence: c.sentence,
      disposition: c.disposition,
    })),
    rawAnswers: { ...rawAnswers },
    currentAccount,
  }
}
