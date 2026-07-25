/**
 * The state-config chassis. SITE_STRUCTURE.md §3.
 *
 * Everything state-specific lives in a StateConfig: the rail's section list, the copy,
 * the defaults, the links, the forms. The components are the reusable skeleton — they
 * read the config and NEVER hardcode a state. Onboarding a new state = a state module
 * under src/states/, not an app edit.
 */
import type { Case } from '../types/case'

export type PacketGenerationViolation = {
  assertion: string
  detail: string
}

export type GeneratedPacket = {
  bytes: Uint8Array
  filename: string
  violations: PacketGenerationViolation[]
  plan: {
    license: { specificLicenseType: string }
    mailedPages: number
    feeUsd: number
  }
}

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
    /** Optional standout line between title and lead — brighter and heavier than body,
     *  quieter than the headline. For the one sentence that must land. */
    lede?: string
    lead: string
    /** Optional short points that must not be missed. Kept few — calm, not flag soup. */
    points?: string[]
  }
  /** Briefing for the section's FOCUS-MODE view (the story workbench), rendered in the
   *  same slate band as every other step. Without it, focus mode shows no briefing. */
  focusIntro?: {
    eyebrow: string
    title: string
    lede?: string
    lead: string
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
  agencyFullName: string // 'Texas Department of Licensing and Regulation'
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
    incidentState: string // most convictions entered here happened in-state. Editable.
    addressState: string // mailing-address dropdown default. Editable.
  }

  /** The fee per license type and the statutory answer window — single-sourced from the
   *  state's data file, displayed by the UI, never typed in a component. */
  feeUsd: number
  turnaroundDays: number

  /** The flat program list for license selection — the agency's own names, in the
   *  agency's own order, from data/ (the single source of truth). The checked label
   *  writes VERBATIM into the license-type field of that packet's form. Checkbox
   *  selection only: free text produced garbage packets ("dd"). Aliases are what people
   *  actually call the trade ("hvac", "tow truck") — filter-matching only, never shown,
   *  never written anywhere. */
  programs: { name: string; aliases: string[] }[]

  /** The state's counties, for the incident-county type-ahead (suggestions only —
   *  free text stays legal, because out-of-state incidents name other states' counties). */
  counties: string[]

  /** Character budgets for inputs that print into fixed-size AcroForm boxes — pdf-lib
   *  shrinks overflow to fit, which prints ant-sized on the official form. Values are
   *  per-state, derived from the form's box geometry; re-probe if the forms revise. */
  fieldBudgets: {
    offense: number
    sentence: number
    street: number
    court: number
    names: number
  }

  /** External links the chassis renders. Attributed, never hardcoded in a component. */
  links: {
    agencySite: { label: string; url: string }
    guidelines: { label: string; url: string }
  }

  /** H1–H5 — the state's own caveats, displayed at the review wall. */
  reviewWarnings: string[]

  /** The §-cited factors quote for the story screen. Static, attributed. (L5) */
  storyFactors: { quote: string; cite: string }

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
    /** What the narrative box is called on this state's forms (e.g. "Item 21"). */
    narrativeItemLabel: string
    /** The ownership check — code-authored, fired at most once per incident, BEFORE the
     *  draft, when the account deflects. Advocate plainly and stop: the exit lives in the
     *  interface ("Write it now"), never in this sentence. Must read correctly against
     *  every shape of deflection — blame, minimizing, wrong-place-wrong-time, panic. */
    ownershipCheck: string
  }

  /** The packet service inputs for this state — template names as served from
   *  public/forms/<state>/, consumed by that state's document service. */
  forms: {
    templates: string[]
  }

  /** State-owned document adapter. Shared form UI calls this without importing a
   *  particular state's forms or packet implementation. */
  generatePackets: (caseData: Case) => Promise<GeneratedPacket[]>
}
