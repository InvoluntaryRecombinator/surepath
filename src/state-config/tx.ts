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
  railTag: 'Texas licensing request',
  processName: 'Criminal History Evaluation Letter — request packet',
  routeBase: '/texas',

  sections: [
    {
      id: 'trade',
      label: 'Your trade',
      icon: 'briefcase',
      intro: {
        eyebrow: 'Before you begin',
        title: 'Confirm this is the right licensing process',
        lead: 'This request is only for trades handled by the Texas licensing board. Nursing, medicine, and other professions use different boards. Confirm your trade is covered before entering personal or criminal-history information.',
      },
    },
    {
      id: 'info',
      label: 'About you',
      icon: 'person',
      intro: {
        eyebrow: 'Applicant',
        title: 'Your identifying information',
        lead: 'This identifies you and is used to search your criminal history. The contact details you enter are how the licensing board will reach you about your request.',
      },
    },
    {
      id: 'record',
      label: 'Your record',
      icon: 'folder',
      intro: {
        eyebrow: 'Criminal history',
        title: 'Every conviction and deferred adjudication',
        lead: 'Use your criminal history report to list every conviction and deferred adjudication, grouped by the arrest or event they came from. Each record needs the court, dates, exact offense name, and sentence.',
        points: [
          'Include records no matter how old they are. There is no cutoff year.',
          'A deferred adjudication must be included even though it is not technically a conviction.',
          'If a detail is missing from your report, use the clerk information below to find it.',
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
        lead: 'Each incident needs an account of what happened and why. Write one account per incident. You will sign the completed forms as true and complete, so the account must stay in your own words.',
      },
    },
    {
      id: 'licenses',
      label: 'Licenses',
      icon: 'certificate',
      intro: {
        eyebrow: 'License selection',
        title: 'Choose each license you want reviewed',
        lead: 'Your criminal history is reviewed separately for each license type. Each selection creates a separate request and requires a separate $10 fee.',
      },
    },
    {
      id: 'review',
      label: 'Review & generate',
      icon: 'seal',
      intro: {
        eyebrow: 'Final check',
        title: 'Confirm your record is complete',
        lead: 'Compare the incident and conviction counts here with your criminal history report. A missing record can make the response incomplete or unusable when you later apply for a license.',
      },
    },
  ],

  defaults: {
    incidentState: 'Texas',
  },

  recordFaq: [
    {
      q: 'How far back do I go?',
      a: 'Include every conviction and deferred adjudication, no matter how long ago it happened. There is no ten-year cutoff.',
      attribution: 'tdlr',
      sourceUrl: TDLR_CHEL_URL,
    },
    {
      q: 'I got deferred adjudication, not a conviction. Do I still list it?',
      a: 'Yes. A deferred adjudication must be included even though it is not technically a conviction.',
      attribution: 'tdlr',
      sourceUrl: TDLR_CHEL_URL,
    },
    {
      q: "Do I list a DWI? Isn't that a traffic violation?",
      a: 'Yes. A DWI is a criminal offense that must be included, not a minor traffic violation.',
      attribution: 'tdlr',
      sourceUrl: TDLR_CHEL_URL,
    },
    {
      q: "What if I can't remember the court, or an exact date?",
      a: 'Call the county clerk for a misdemeanor or the district clerk for a felony in the county where it happened. The clerk can look up the case details.',
      attribution: 'tdlr',
      sourceUrl: TDLR_CHEL_URL,
    },
    {
      q: 'What about expunged or sealed records?',
      a: 'We cannot tell you whether an expunged or sealed record has to be disclosed. Expunction and an order of nondisclosure are different, and the answer may differ for each. Ask the board or a lawyer before you decide.',
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
