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

export const STAGE_KEYS = ['what', 'why', 'changed', 'right'] as const
export type StageKey = (typeof STAGE_KEYS)[number]

/**
 * 'thin' is the state that matters: an answer that exists but says nothing usable —
 * "I'm in a program" is thin until it says which program, how long, whether it finished.
 * The model RE-REPORTS all four from the full conversation every turn; code renders the
 * strip and gates the draft, but never increments a stage itself.
 */
export const StageLevelSchema = z.enum(['empty', 'thin', 'covered'])
export type StageLevel = z.infer<typeof StageLevelSchema>

export const StagesSchema = z.object({
  what: StageLevelSchema,
  why: StageLevelSchema,
  changed: StageLevelSchema,
  right: StageLevelSchema,
})
export type Stages = z.infer<typeof StagesSchema>

/**
 * Ownership: does the account show the person's own part, or does it deflect? Assessed by
 * the model from their telling, re-reported every turn like stages. Three values suffice
 * because code only consults this when the draft gate opens — and the gate requires `why`
 * covered, so there is always material to judge. Coverage measures presence; THIS measures
 * the quality boards weigh hardest (§53.025(a): conduct, rehabilitation, responsibility).
 */
export const OwnershipSchema = z.enum(['takes_responsibility', 'partial', 'deflecting'])
export type Ownership = z.infer<typeof OwnershipSchema>

export const AgentTurnSchema = z.object({
  /** Conversational, short. NEVER contains the question or the draft. */
  reply: z.string(),
  stages: StagesSchema,
  ownership: OwnershipSchema,
  /** "I am drafting now." A HINT — nothing gates on it; it may only accelerate. (§5) */
  readyToDraft: z.boolean(),
  /** ONE question at a time: bold question, plain reason underneath (reason optional —
   *  forcing one would make it nag). `stage` tags what the question probes, so a skip can
   *  waive exactly that stage; the UI never displays it. */
  followUp: z
    .object({
      question: z.string(),
      reason: z.string().nullable(),
      stage: z.enum(STAGE_KEYS).nullable(),
    })
    .nullable(),
  /** At most one, and only for a factor not yet nudged — enforced by the machine, not here. */
  nudge: z
    .object({
      factor: z.enum(NUDGE_FACTORS),
      text: z.string(),
    })
    .nullable(),
  /** Populated when the model judges it has enough, or on directive:'draft_now'.
   *  NOTE (§7, deliberate): there is no assumptions self-report. Paraphrase is the job —
   *  announcing it was theater that eroded the layer that matters, the affirmation. */
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
    /** The account as it stands, when one exists. THE revision substrate: the transcript
     *  is session-only (deliberate — AGENT_SPEC §2), so on a return visit this is the only
     *  material a change request has. Narrative text, no identifiers — D6-clean. */
    currentAccount: z.string(),
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
  /** Stages the user explicitly skipped — their no is final; never re-asked, gate waived. */
  skippedStages: z.array(z.enum(STAGE_KEYS)),
  /** State-published guidance, injected by the CLIENT from stateConfig — the server and
   *  the prompt are state-agnostic (the chassis rule). Not identifiers; just statute. */
  guidance: z.object({
    factorsQuote: z.string(),
    factorsCite: z.string(),
  }),
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
  return [
    turn.reply,
    turn.followUp?.question ?? '',
    turn.followUp?.reason ?? '',
    turn.nudge?.text ?? '',
  ].filter(Boolean)
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
