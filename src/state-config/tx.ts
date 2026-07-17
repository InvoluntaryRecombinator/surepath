/**
 * Texas / TDLR — the first (and for the MVP, only) state config.
 *
 * Copy rules in force here: never assert an outcome (L1 — no "eligible", "qualify",
 * "your chances", "likely"); every TDLR claim is attributed to TDLR; the expunged/sealed
 * item is OURS and is marked as an open question (L8). Deferred adjudications are
 * reported like convictions (D2). There is no lookback window (D1).
 */
import type { StateConfig } from './types'

const TDLR_CHEL_URL = 'https://www.tdlr.texas.gov/crimHistoryEval.htm' // data/tdlr_links.json → tdlr.chel_page

export const txConfig: StateConfig = {
  code: 'TX',
  stateName: 'Texas',
  agency: 'TDLR',
  railTag: 'Texas · TDLR',
  processName: 'Criminal History Evaluation Letter — request packet',
  routeBase: '/texas',

  sections: [
    {
      id: 'trade',
      label: 'Your trade',
      icon: 'briefcase',
      intro: {
        eyebrow: 'Before you begin',
        title: 'Check that TDLR licenses your trade',
        lead: 'The Criminal History Evaluation Letter comes from the Texas Department of Licensing and Regulation, and it covers only the trades TDLR licenses. Nursing, medicine, and several other fields belong to different boards with their own processes. Confirm your trade is TDLR\u2019s before entering anything else.',
      },
    },
    {
      id: 'info',
      label: 'About you',
      icon: 'person',
      intro: {
        eyebrow: 'Applicant',
        title: 'Your identifying information',
        lead: 'TDLR uses this section to identify you, to match the history you report against state records, and to mail you their written decision. It is entered onto the official forms exactly as you type it here — use your legal name, and an address and email you check.',
      },
    },
    {
      id: 'record',
      label: 'Your record',
      icon: 'folder',
      intro: {
        eyebrow: 'Criminal history',
        title: 'Every conviction and deferred adjudication',
        lead: 'Working from your criminal history report, list each incident \u2014 one arrest or event \u2014 and every conviction that came from it. Only the facts are needed on this page; the explanation TDLR asks for is written in the next section, one account per incident.',
        points: [
          'TDLR requires every conviction and every deferred adjudication, no matter how old. There is no cutoff year.',
          'Enter what you know. If a detail like the court name is beyond reach, say so in the field and keep going.',
        ],
      },
    },
    {
      id: 'story',
      label: 'Your story',
      icon: 'pen',
      intro: {
        eyebrow: 'Your account',
        title: 'What happened, in your own words',
        lead: 'TDLR requires a description of what you did and why, for every conviction. It is written once per incident and it stays in your words \u2014 nothing is added that you did not say.',
      },
    },
    {
      id: 'licenses',
      label: 'Licenses',
      icon: 'certificate',
      intro: {
        eyebrow: 'License selection',
        title: 'The licenses TDLR will evaluate',
        lead: 'Choose the license types you want TDLR to review your history against. Each license type requires its own request packet and its own $10 fee, and TDLR answers each one separately.',
      },
    },
    {
      id: 'review',
      label: 'Review & generate',
      icon: 'seal',
      intro: {
        eyebrow: 'Final check',
        title: 'Confirm your record is complete',
        lead: 'TDLR does not process incomplete requests, and a conviction left out can make the letter worthless at the real application. Check the count on this page against your criminal history report before generating the packet.',
      },
    },
  ],

  defaults: {
    incidentState: 'Texas',
  },

  recordFaq: [
    {
      q: 'How far back do I go?',
      a: 'All the way. TDLR says every conviction and every deferred adjudication must be reported no matter how long ago it happened — they need the full history, and there is no ten-year cutoff.',
      attribution: 'tdlr',
      sourceUrl: TDLR_CHEL_URL,
    },
    {
      q: 'I got deferred adjudication, not a conviction. Do I still list it?',
      a: 'Yes. TDLR requires deferred adjudications to be reported even though a deferred adjudication is not technically a conviction.',
      attribution: 'tdlr',
      sourceUrl: TDLR_CHEL_URL,
    },
    {
      q: "Do I list a DWI? Isn't that a traffic violation?",
      a: 'List it. TDLR treats a DWI as a criminal offense that must be reported, not a minor traffic violation.',
      attribution: 'tdlr',
      sourceUrl: TDLR_CHEL_URL,
    },
    {
      q: "What if I can't remember the court, or an exact date?",
      a: 'TDLR suggests calling the county clerk (for misdemeanors) or the district clerk (for felonies) in the county where it happened — they can look it up for you.',
      attribution: 'tdlr',
      sourceUrl: TDLR_CHEL_URL,
    },
    {
      q: 'What about expunged or sealed records?',
      a: 'We cannot tell you whether an expunged or sealed record has to be disclosed. Expunction and an order of nondisclosure are different things, and the answer is different for each. This is a question for TDLR or a lawyer — ask before you decide, and decide for yourself. We will never leave one out for you, and we will never tell you to leave one out.',
      attribution: 'surepath-open-question',
    },
  ],

  copy: {
    chargeNoun: 'conviction',
    recordEmptyInvitation:
      'Nothing listed yet. Start with the oldest incident on your record and work forward.',
    addIncident: 'Add an incident',
    addIncidentHint: 'One arrest or event — even if it led to several charges.',
    addSingleCharge: 'Add a single conviction',
    addSingleChargeHint: 'One conviction, on its own.',
  },

  forms: {
    templates: ['ENF006', 'ENF003'],
  },
}
