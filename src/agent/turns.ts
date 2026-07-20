/**
 * The wire contract (AGENT_SPEC §4): the model proposes, code disposes.
 *
 * One Zod schema is the single source of truth for the AgentTurn shape — the proxy hands it
 * to the AI SDK's structured-output mode (which retries malformed output), and the client
 * re-validates with the same schema before anything renders. Fail closed at both ends:
 * unparsed model output never reaches a screen.
 *
 * L1 is enforced here in CODE, not just in the prompt: the A6 banned-language check runs
 * over every string the model wants to show the user. The prompt forbids outcome language;
 * this makes the ban mechanical.
 */
import { z } from 'zod'

export const NUDGE_FACTORS = ['ownership', 'understanding', 'change', 'restitution'] as const
export type NudgeFactor = (typeof NUDGE_FACTORS)[number]

/** Coverage keys MATCH rawAnswers keys exactly (AGENT_SPEC §4) — one vocabulary, everywhere. */
export const CoverageSchema = z.object({
  facts: z.boolean(),
  why: z.boolean(),
  whatChanged: z.boolean(),
  madeItRight: z.boolean(),
})

export const AgentTurnSchema = z.object({
  /** Shown in region B. Conversational, short. NEVER contains the question — questions live
   *  only in followUp, so code can suppress them after the turn cap without prose surgery. */
  reply: z.string(),
  coverage: CoverageSchema,
  /** "I am drafting now." A HINT — nothing gates on it; it may only accelerate. (§5) */
  readyToDraft: z.boolean(),
  /** ONE question, or null. */
  followUp: z.string().nullable(),
  /** At most one, and only for a factor not yet nudged — enforced by the machine, not here. */
  nudge: z
    .object({
      factor: z.enum(NUDGE_FACTORS),
      text: z.string(),
    })
    .nullable(),
  /** Model self-report: anything it filled in that the user didn't say directly.
   *  Transparency, NOT verification — the UI must never present it as a check. (§7) */
  assumptions: z.array(z.string()),
  /** Populated when the model judges it has enough, or on directive:'draft_now'. */
  draft: z.string().nullable(),
})

export type AgentTurn = z.infer<typeof AgentTurnSchema>

export const AgentRequestSchema = z.object({
  context: z.object({
    incidentId: z.string(),
    county: z.string(),
    state: z.string(),
    court: z.string(),
    dateCrimeCommitted: z.string(),
    dateOfConviction: z.string(),
    charges: z.array(
      z.object({
        exactOffense: z.string(),
        sentence: z.string(),
        disposition: z.enum(['conviction', 'deferred_adjudication', '']),
      }),
    ),
    rawAnswers: z.object({
      facts: z.string(),
      why: z.string(),
      whatChanged: z.string(),
      madeItRight: z.string(),
    }),
  }),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
  /** CODE sets this, not the model. 'draft_now' is sent at the turn cap or on "Write it now". */
  directive: z.enum(['converse', 'draft_now']),
  alreadyNudged: z.array(z.enum(NUDGE_FACTORS)),
})

export type AgentRequest = z.infer<typeof AgentRequestSchema>

/** Fail-closed parse. Returns the turn or null — never a partial, never a throw into UI code. */
export function parseAgentTurn(data: unknown): AgentTurn | null {
  const result = AgentTurnSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * A6, mechanical (L1): the words that assert an outcome, run over every model string the
 * user could see. Same family as the copy lint — this is the model's copy.
 */
const BANNED_OUTCOME_LANGUAGE =
  /\b(eligib\w*|ineligib\w*|qualif\w*|disqualif\w*|your chances|likely to be (approved|denied)|probably (approved|denied|fine)|strong case|good candidate|should pass|you('|’)?ll be fine|don('|’)?t worry)\b/i

/** Every user-visible string on a turn that must pass the language check. */
function visibleStrings(turn: AgentTurn): string[] {
  return [turn.reply, turn.followUp ?? '', turn.nudge?.text ?? ''].filter(Boolean)
}

/**
 * Returns the offending strings, empty when clean. The DRAFT is deliberately not checked:
 * it is the user's own account in the user's own words — if they described a plea deal as
 * "the DA said I qualified for deferred", that is their truth and it stays. The ban is on
 * OUR voice (and the model speaking as us), never on theirs. (L1 bans us asserting outcomes;
 * it does not edit the user's account.)
 */
export function outcomeLanguageViolations(turn: AgentTurn): string[] {
  return visibleStrings(turn).filter((s) => BANNED_OUTCOME_LANGUAGE.test(s))
}
