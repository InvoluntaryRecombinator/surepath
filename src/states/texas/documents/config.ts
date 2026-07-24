/** Configuration. One constant, one place. */

/**
 * $10.00, cashier's check or money order, payable to TDLR, PER LICENSE TYPE. (F3)
 *
 * ⚠️ OPEN_QUESTIONS Q5 is unresolved: the May 2025 ENF006 and the TDLR FAQ both say $10, but
 * other TDLR PDFs say $25. This number goes on a checklist that tells a person the exact
 * amount to write on a money order, and a wrong number is a rejected packet. It lives here,
 * once, so confirming it is a one-line change. Do not type this number anywhere else.
 */
export const FEE_USD = 10

/**
 * ONE STORY PER ARREST. That is the entire reason incidents exist: a person with 3 arrests
 * and 9 convictions writes 3 accounts, not 9. (ARCHITECTURE §8.4)
 */
export const NARRATIVE_AUTHORING = 'per_incident' as const

/**
 * One continuation sheet per document that has a narrative box — so every questionnaire is
 * SELF-CONTAINED and cannot be orphaned by TDLR's filing convention. The story is authored
 * once (above) and duplicated onto each sheet. (OPEN_QUESTIONS Q2/Q3, fallback (b).)
 */
export const CONTINUATION_SHEETS: 'per_questionnaire' | 'shared' = 'per_questionnaire'

/** Stage 6.5. Dark until OPEN_QUESTIONS Q1 comes back from TDLR. */
export const FEATURE_SUPPORTING_EVIDENCE = false
