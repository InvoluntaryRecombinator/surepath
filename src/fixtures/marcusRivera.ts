/**
 * The Phase 1 fixture. 3 incidents, 9 records, on probation, not on parole, not a business
 * owner.
 *
 * Two of these records are REGRESSION GUARDS. Do not "tidy" them away:
 *
 *   · The 1998 conviction (incident 3) guards D1. There is NO lookback window. If a future
 *     change starts dropping, hiding, dimming or de-prioritising old convictions, A4 fails
 *     here first. An omitted conviction voids the evaluation letter — TDLR finds the gap at
 *     the real application, where they run a full DPS/FBI fingerprint check, and the "yes"
 *     the user got becomes worthless or worse.
 *
 *   · The deferred adjudication (incident 2) guards D2. It is not technically a conviction.
 *     TDLR requires it reported anyway (FAQ #8). It gets its own ENF003, its own narrative,
 *     its own line. It is NOT filtered, and `disposition` is NOT a filter.
 *
 * The narratives are in the user's own voice, plainly. Nothing in them asserts anything
 * about what TDLR will decide, and nothing claims a rehabilitation the user did not describe.
 */
import type { Case } from '../types/case'

const story = (draft: string) => ({
  rawAnswers: { facts: '', why: '', whatChanged: '', madeItRight: '' },
  draft,
  edited: false,
  provenance: [],
})

export const marcusRivera: Case = {
  version: 1,
  applicant: {
    lastName: 'Rivera',
    firstName: 'Marcus',
    middleName: 'Daniel',
    suffix: '',
    allKnownNames: 'Marcus D. Rivera; Marc Rivera',
    dob: '04/18/1979',
    gender: 'male',
    mailingAddress: '4412 Larkspur Lane, Apt 3B, Houston, TX 77021',
    phone: '(713) 555-0148',
    email: 'mdrivera79@example.com',

    // No SSN. There is no field. There will never be a field. (D3)

    isControllingPerson: false, // → business fields written N/A, ownership radio CLEARED (A9, F11)

    onParole: false,
    onProbation: true,
    probationOfficer: { name: 'Denise Okafor', phone: '(713) 555-0192' },
  },

  incidents: [
    // ── Incident 1 — one traffic stop, four convictions. This is the arithmetic. ───────────
    {
      id: 'inc-1',
      county: 'Harris',
      state: 'Texas',
      court: '178th District Court',
      dateCrimeCommitted: '03/14/2019',
      dateOfConviction: '11/02/2019',
      narrative: story(
        'I was pulled over on the Gulf Freeway coming back from a job site. I had been ' +
          'drinking that afternoon and I had a small amount of methamphetamine on me that I ' +
          'had bought earlier that week. When the officer came to the window I panicked and ' +
          'drove off, and I was stopped again about a mile later. I struggled with the ' +
          'officers when they took me out of the truck. Everything that happened that night ' +
          'happened because I ran instead of stopping. I finished the substance abuse program ' +
          'the court ordered in August 2020 and I have been reporting to my probation officer ' +
          'every month since. I paid the fines and the court costs in full in 2021.',
      ),
      charges: [
        {
          id: 'c-1',
          exactOffense: 'Possession of a Controlled Substance, Penalty Group 1, less than 1 gram',
          sentence: '3 years deferred adjudication community supervision; $1,500 fine',
          disposition: 'conviction',
        },
        {
          id: 'c-2',
          exactOffense: 'Evading Arrest or Detention with a Vehicle',
          sentence: '2 years state jail, suspended; 3 years community supervision',
          disposition: 'conviction',
        },
        {
          id: 'c-3',
          exactOffense: 'Resisting Arrest, Search, or Transportation',
          sentence: '180 days Harris County Jail, credit for time served',
          disposition: 'conviction',
        },
        {
          id: 'c-4',
          exactOffense: 'Driving While Intoxicated, second offense',
          sentence: '1 year Harris County Jail, probated for 2 years; $1,000 fine',
          disposition: 'conviction',
        },
      ],
    },

    // ── Incident 2 — includes the DEFERRED ADJUDICATION. (D2 / A5) ─────────────────────────
    {
      id: 'inc-2',
      county: 'Harris',
      state: 'Texas',
      court: '351st District Court',
      dateCrimeCommitted: '06/09/2011',
      dateOfConviction: '02/17/2012',
      narrative: story(
        'I took a set of power tools from a job site I had been working on after I was let go ' +
          'without my last two weeks of pay. I sold them the same week. I was twenty-two and I ' +
          'was angry about the money and I decided I was owed it. I was not owed it. I paid ' +
          'restitution of $2,400 and completed the supervision period, and it was discharged ' +
          'in 2014.',
      ),
      charges: [
        {
          id: 'c-5',
          exactOffense: 'Theft of Property, $500 or more but less than $1,500',
          sentence: '2 years deferred adjudication community supervision; $2,400 restitution',
          disposition: 'deferred_adjudication', // ⚠️ REPORTED EXACTLY LIKE A CONVICTION. (D2)
        },
        {
          id: 'c-6',
          exactOffense: 'Criminal Mischief, $100 or more but less than $750',
          sentence: '90 days Harris County Jail, probated for 1 year',
          disposition: 'conviction',
        },
        {
          id: 'c-7',
          exactOffense: 'Burglary of a Building',
          sentence: '18 months state jail',
          disposition: 'conviction',
        },
      ],
    },

    // ── Incident 3 — the 1998 conviction. THE D1 REGRESSION GUARD. Do not remove. ──────────
    {
      id: 'inc-3',
      county: 'Dallas',
      state: 'Texas',
      court: 'court unknown', // Precision is SOFT. Completeness is HARD. (ARCHITECTURE §4)
      dateCrimeCommitted: '08/21/1998',
      dateOfConviction: '01/12/1999',
      narrative: story(
        'I was nineteen. I was with two other people who broke into a car outside a bar and I ' +
          'was the one holding the bag with what they took. I did not break into the car but I ' +
          'was there and I took part in it. I served the county jail time and paid the fine. ' +
          'This is the oldest thing on my record and I am reporting it because TDLR asks for ' +
          'everything, no matter how long ago it happened.',
      ),
      charges: [
        {
          id: 'c-8',
          exactOffense: 'Theft of Property, less than $500',
          sentence: '30 days Dallas County Jail; $500 fine',
          disposition: 'conviction',
        },
        {
          id: 'c-9',
          exactOffense: 'Possession of Marijuana, 2 ounces or less',
          sentence: '20 days Dallas County Jail, credit for time served',
          disposition: 'conviction',
        },
      ],
    },
  ],

  licenses: [
    { program: 'Air Conditioning and Refrigeration', specificLicenseType: 'ACR Technician Registration' },
  ],
}

/** 3 trades ⟹ 3 packets ⟹ 3 separate $10 money orders ⟹ $30. (A10) */
export const marcusRiveraThreeTrades: Case = {
  ...marcusRivera,
  licenses: [
    { program: 'Air Conditioning and Refrigeration', specificLicenseType: 'ACR Technician Registration' },
    { program: 'Electricians', specificLicenseType: 'Apprentice Electrician' },
    { program: 'Barbering and Cosmetology', specificLicenseType: 'Barber License' },
  ],
}
