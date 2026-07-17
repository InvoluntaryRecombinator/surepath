/**
 * The state-config chassis. SITE_STRUCTURE.md §3.
 *
 * Everything state-specific lives in a StateConfig: the rail's section list, the copy,
 * the defaults, the links, the forms. The components are the reusable skeleton — they
 * read the config and NEVER hardcode a state. Onboarding a new state = a new file in
 * this directory, not an app edit.
 */

export type IconKey = 'briefcase' | 'person' | 'folder' | 'pen' | 'certificate' | 'seal'

export type SectionDef = {
  id: string
  /** Rail label. Short. */
  label: string
  icon: IconKey
  /** The section briefing — the what and the why, a separate zone above the form.
   *  Register: plain, calm, instructional. A government process, not a product pitch. */
  intro: {
    /** Small tracked caps above the headline: the section's formal category. */
    eyebrow: string
    /** The headline ADDS meaning — the rail already says where you are. Never echo the rail label. */
    title: string
    lead: string
    /** Optional short points that must not be missed. Kept few — calm, not flag soup. */
    points?: string[]
  }
}

export type FaqItem = {
  q: string
  a: string
  /** Who is speaking. TDLR items paraphrase the state and link the source; OUR items say so. */
  attribution: 'tdlr' | 'surepath-open-question'
  sourceUrl?: string
}

export type StateConfig = {
  code: string // 'TX'
  stateName: string // 'Texas'
  agency: string // 'TDLR'
  /** The rail's small tag under the wordmark: "Texas · TDLR" */
  railTag: string
  /** The formal name of the legal artifact, anchoring the content header bar. */
  processName: string
  /** Route base for this state's pages: '/texas' */
  routeBase: string

  /** The rail renders THIS list. A different state = a different list. That is the whole
   *  per-state sidebar mechanism. */
  sections: SectionDef[]

  /** Field defaults this state can safely pre-fill (never a charge-unique field — A12). */
  defaults: {
    incidentState: string // "Texas" — most convictions entered here happened in-state. Editable.
  }

  /** FAQ items surfaced next to the record intake, in the state's own words where possible. */
  recordFaq: FaqItem[]

  /** State-specific strings. Shared chrome copy lives in the components; what varies by
   *  state lives here. */
  copy: {
    /** What a charge is called in this state's paperwork context. */
    chargeNoun: string // "conviction"
    recordEmptyInvitation: string
    addIncident: string
    addIncidentHint: string
    addSingleCharge: string
    addSingleChargeHint: string
  }

  /** The packet service inputs for this state — template names as served from
   *  public/forms/, consumed by the document service (already built for TX). */
  forms: {
    templates: string[]
  }
}
