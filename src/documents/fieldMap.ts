/**
 * THE ONLY MODULE IN THE CODEBASE ALLOWED A FIELD-NAME STRING LITERAL.
 *
 * This is the typed adapter over `data/tdlr_field_map.json`. The JSON is the source of
 * truth (verified against a field-probe render); this file makes it a compile-time
 * constraint, so that typing `/Yes` on an ENF003 button is a TYPE ERROR rather than a
 * rejected packet.
 *
 * `tests/documents/fieldMap.drift.test.ts` asserts this file and the JSON agree. If you
 * change one, that test fails until you change the other.
 *
 * SLASH CONVENTION (F11): the values below carry the slash, because that is what is truly
 * inside the PDF. pdf-lib's select() wants the bare name and throws on the slash.
 * `tickButton()` strips it. The map stays true; the adapter absorbs the quirk.
 */

// ── ENF006 — the request form. Carries the applicant AND CONVICTION #1. (F1) ──────────────

export const ENF006 = {
  program: 'List Program',
  specificLicense: 'Specific License Type',
  lastName: 'Last Name',
  firstName: 'First Name',
  middleName: 'Middle Name',
  suffix: 'Suffix Jr Sr III',
  allKnownNames: 'List All Names',
  dob: 'Date of Birth',
  gender: 'Gender',
  ssn: 'Social Security Number', // NEVER FILL (D3)
  mailingAddress: 'Mailing Address',
  phone: 'Phone Number',
  email: 'Email Address',

  companyName: 'Name of Company',
  dba: 'DBA: (Doing Business As)',
  federalTaxId: 'Federal Tax ID',
  ownershipType: 'Type of Ownership',

  /** ⚠️ F9 TRAP: this field is NAMED "County and State…" and holds the COUNTY ONLY. */
  county: 'County and State of conviction or deferred adjudication',
  state: 'State (ex: Texas)',
  court: 'Court',
  dateCrime: 'Date Crime Committed',
  dateConviction: 'Date of conviction or deferred adjudication',
  exactOffense: 'Exact crime you were convicted of or received a deferred adjudication',
  sentence: 'Sentence or action imposed by the court ex six months in Travis County Jail',
  narrative: 'What exactly did you do (crime) and why',

  onParole: 'Are you currently on parole?',
  paroleOfficer: "Parole Officer's Name",
  parolePhone: '(Area Code) Phone Number for Parole Officer',
  onProbation: 'Are you currently on probation?',
  probationOfficer: "Probation Officer's Name",
  probationPhone: '(Area Code) Phone Number for Probation Officer',

  dateSigned: 'Date Signed', // LEFT EMPTY — the user hand-dates it. (A11 as amended)
  signature: 'Signature of person who is subject of this evaluation', // /Sig — NEVER FILL (L6)
} as const

export const ENF006_BUTTONS = {
  gender: { field: ENF006.gender, male: '/Male', female: '/Female' },
  ownership: {
    field: ENF006.ownershipType,
    general_partnership: '/General Partnership',
    sole_proprietor: '/Sole Proprietor',
    llc: '/LLC',
    llp: '/LLP',
    corporation: '/Corporation',
    // ⚠️ F11: there is NO value for "not a business owner". /Off is not an option.
    // Not a controlling person → clearButton(). NEVER select().
  },
  parole: { field: ENF006.onParole, yes: '/Yes', no: '/No' },
  probation: { field: ENF006.onProbation, yes: '/Yes', no: '/No' },
} as const

// ── ENF003 — the questionnaire. One per ADDITIONAL conviction (2..N). ─────────────────────

export const ENF003 = {
  typeOfRequest: 'Type of Request',
  licenseType: 'ex Barber Cosmetologist Electrician Towing etc',

  /** Single field: "LAST, FIRST, MIDDLE, SUFFIX" */
  fullName: 'Last First Middle Name Suffix Jr Sr III',
  /** ⚠️ The BARE name is the SSN. The near-identical one prefixed "ex johndoeaolcom…" is the
   *  EMAIL. Confusing them writes an SSN into a form and an email into an SSN box. NEVER FILL. */
  ssn: 'See instruction sheet for disclosure information',
  address: 'Number Street Name Suite NumberApartment Number',
  phone: 'Area Code Phone Number',
  dob: 'DOB',
  email: 'ex johndoeaolcom See instruction sheet for disclosure information',

  /** ⚠️ F9 TRAP: ENF003 COMBINES county and state into ONE field ("Harris, TX").
   *  ENF006 splits them. Same data. Two shapes. One packet. Do not unify. */
  countyAndState: 'ex Travis TX',
  court: 'ex 300th Dist Ct or Fed Ct',
  dateCrime: 'MonthDayYear_2', // item 11 — VERIFIED by probe
  dateConviction: 'MonthDayYear_3', // item 12 — VERIFIED by probe
  exactOffense: '13 Exact crime you were convicted of or received a deferred adjudication',
  narrative: 'if you need more space to write attached additional sheets 1',
  sentence: '15 Sentence or action imposed by the court ex six months in Travis County Jail 1',

  renewalQuestion: '#16',
  onParole: '#17',
  paroleOfficer: 'Parole Officers Name',
  parolePhone: 'PO Phone Number 1', // VERIFIED: "PO" = PAROLE officer
  onProbation: '#18',
  probationOfficer: 'Probation Officers Name',
  probationPhone: 'Area Code Phone Number_3', // VERIFIED: PROBATION officer
  dateSigned: 'Date Signed', // LEFT EMPTY — user hand-dates
  signature: 'Signature3', // /Sig — NEVER FILL (L6)
} as const

export const ENF003_BUTTONS = {
  typeOfRequest: { field: ENF003.typeOfRequest, new: '/Choice1', renewal: '/Choice2' },
  /** Renewals-only question. SurePath users are always NEW applicants, so it is N/A — but it
   *  is a radio, so it cannot hold "N/A", and a blank field risks rejection (F6).
   *  Build value: No. ⚠️ OPEN_QUESTIONS Q7 — confirm with TDLR. */
  renewalQuestion: { field: ENF003.renewalQuestion, no: '/Choice1', yes: '/Choice2' },

  /**
   * ⚠️⚠️⚠️ VERIFIED BY WIDGET GEOMETRY, AND IT IS NOT WHAT THE DOCS SAID.
   *
   * On the printed form, "No" is the LEFT box and "Yes" is the RIGHT box. Reading each
   * widget's /AP /N on-value and its rectangle off the real blank:
   *
   *     #17 (parole)     left x=192 → /Choice3 = NO      right x=226 → /Choice1 = YES
   *     #18 (probation)  left x=191 → /Choice2 = NO      right x=225 → /Choice1 = YES
   *
   * An earlier revision of the field map had BOTH of these INVERTED. The packet ticked "Yes,
   * I am on parole" for a man who is not on parole, and "No, I am not on probation" for a man
   * who is. Every test passed. pdf-lib confirmed the value it was given. The PDF was valid.
   * It was also a lie, told to a licensing board, on a form he signs under penalty of
   * administrative sanction — and ONLY PRINTING THE PAGE CAUGHT IT.
   *
   * The number carries no meaning. /Choice1 is "Yes" here and "No" on #16. Never reason from
   * the number. `tests/invariants.test.ts` now derives Yes/No from the widget rectangles, so
   * this cannot silently invert again.
   */
  parole: { field: ENF003.onParole, no: '/Choice3', yes: '/Choice1' },
  probation: { field: ENF003.onProbation, no: '/Choice2', yes: '/Choice1' },
} as const

// ── Fields that must NEVER be written, on either form ─────────────────────────────────────

/** The SSN. D3 — SurePath never touches it. The user hand-writes it, in pen. */
export const NEVER_FILL_SSN: readonly string[] = [ENF006.ssn, ENF003.ssn]

/** The /Sig fields. L6 — wet ink, their hand, always. Catastrophic if we ever sign. */
export const NEVER_FILL_SIG: readonly string[] = [ENF006.signature, ENF003.signature]

/** Date Signed. Deliberately empty: never write N/A into a date the user is about to
 *  hand-date beside their signature. (A11 as amended.) */
export const NEVER_FILL_DATE: readonly string[] = [ENF006.dateSigned, ENF003.dateSigned]

/** Every field the fill routine must leave alone. The N/A sweep skips these — and ONLY these. */
export const NEVER_FILL: readonly string[] = [
  ...NEVER_FILL_SSN,
  ...NEVER_FILL_SIG,
  ...NEVER_FILL_DATE,
]

/** The item numbers where a pen must touch the paper. The mailing checklist enumerates these. */
export const HANDWRITE_ITEMS = {
  enf006: { ssn: 7, signature: 24, dateSigned: 24 },
  enf003: { ssn: 4, signature: 19, dateSigned: 19 },
} as const

/** Page counts of the blank forms, used by the pure plan before any PDF is loaded. */
export const FORM_PAGES = { enf006: 2, enf003: 1 } as const
