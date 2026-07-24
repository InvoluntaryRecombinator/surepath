/**
 * The proxy's brain (AGENT_SPEC §8) — platform-agnostic so the Vercel function and the
 * local dev middleware are both thin adapters over this one function.
 *
 * Stateless. No database, no session. Fail closed at every layer:
 *   1. identifier-shaped keys anywhere in the raw body → 400, before anything else (D6)
 *   2. schema-invalid request → 400
 *   3. model output that fails the A6 language check → retry once → 422 (the client's
 *      graceful degradation is the manual path; the user is never stuck)
 *   4. draft_now that comes back draftless → retry once → 502
 * Logs status + latency only. Never the body. (D6)
 *
 * Provider is swappable in one line (NARRATIVE_MODEL / the createOpenAI call). Retention
 * posture recorded in ARCHITECTURE §9.1 — re-verify before the demo, never assume.
 */
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { buildSystemPrompt, findIdentifierKeys } from './prompt'
import {
  AgentRequestSchema,
  AgentTurnSchema,
  outcomeLanguageViolations,
  type AgentRequest,
  type AgentTurn,
} from './turns'

export type NarrativeEnv = {
  apiKey: string | undefined
  /** One line to swap the model; the provider itself swaps in createOpenAI below. */
  modelId?: string
}

export type NarrativeResult = { status: number; body: Record<string, unknown> }

type Generate = (request: AgentRequest, system: string) => Promise<AgentTurn>

async function defaultGenerate(
  request: AgentRequest,
  system: string,
  env: NarrativeEnv,
): Promise<AgentTurn> {
  const openai = createOpenAI({ apiKey: env.apiKey })
  const { object } = await generateObject({
    // gpt-4.1 (full tier): the interview lives or dies on conversational judgment, and
    // mini executed the rules woodenly — script-reading the prompt's example sentences
    // back at people. A user sends ~10-15 messages total; the cost delta is cents per
    // packet and the writing is the product. 4.1 honors explicit temperature (the gpt-5
    // reasoning family does not, and spends hidden reasoning tokens while a person
    // waits on a draft). Swap via NARRATIVE_MODEL.
    model: openai(env.modelId ?? 'gpt-4.1'),
    schema: AgentTurnSchema,
    system,
    messages:
      request.messages.length > 0
        ? request.messages
        : [{ role: 'user' as const, content: 'Please begin.' }],
    temperature: 0.4,
    maxOutputTokens: 1500,
  })
  return object
}

export async function handleNarrativeRequest(
  rawBody: unknown,
  env: NarrativeEnv,
  generate?: Generate,
): Promise<NarrativeResult> {
  const started = Date.now()
  const finish = (status: number, body: Record<string, unknown>): NarrativeResult => {
    // Status and latency. NEVER the body. (D6)
    console.log(`[narrative] ${status} ${Date.now() - started}ms`)
    return { status, body }
  }

  if (!env.apiKey && !generate) {
    return finish(503, { error: 'assistant_unavailable' })
  }

  // 1 — D6 key scan, on the RAW body, before any parsing.
  const identifierKeys = findIdentifierKeys(rawBody)
  if (identifierKeys.length > 0) {
    return finish(400, { error: 'identifier_keys_rejected' })
  }

  // 2 — shape.
  const parsed = AgentRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return finish(400, { error: 'malformed_request' })
  }
  const request = parsed.data
  const system = buildSystemPrompt(request)
  const run = generate ?? ((r: AgentRequest, s: string) => defaultGenerate(r, s, env))

  // 3/4 — generate, with one retry for any of: throw, A6 violation, draftless draft_now,
  // or a draft that fails the mechanical guards below. The retry CARRIES THE CORRECTION —
  // re-running an identical prompt just repeats the mistake; naming the rejected output
  // turns fail-closed into self-repair. (Correction text references only charge-line and
  // rule content, never the person — D6 holds.)
  let correction = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    let turn: AgentTurn
    try {
      turn = await run(request, system + correction)
    } catch {
      continue
    }
    if (outcomeLanguageViolations(turn).length > 0) {
      correction = `\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED by a mechanical check: it contained outcome language (eligible / qualify / chances / likely). Never speak to the outcome. Retry without it.`
      continue
    }
    if (request.directive === 'draft_now' && !(turn.draft && turn.draft.trim())) {
      correction = `\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED: it returned no draft. This is the document step — populate "draft" with the account, from what they told you.`
      continue
    }
    if (turn.draft) {
      const violations = draftGuardViolations(request, turn.draft)
      if (violations.length > 0) {
        const notes = violations.map((v) =>
          v.startsWith('invented_from_context:')
            ? `the draft contained "${v.slice('invented_from_context:'.length)}" — that word appears in the charge line but the person NEVER SAID IT. Remove it; describe only what they actually told you (quoting the full charge name is fine).`
            : `the draft used "convicted/conviction" but no charge in this incident is a conviction — it was deferred adjudication. Fix the language: "I was placed on deferred adjudication for..."`,
        )
        correction = `\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED by a mechanical check: ${notes.join(' Also: ')}`
        console.log(`[narrative] draft guard: ${violations.map((v) => v.split(':')[0]).join(',')}`)
        continue
      }
    }
    // Code bounds behavior (§4): reply never carries the draft, and never carries a
    // question — questions live only in followUp, or the user reads them twice.
    if (turn.draft && turn.reply.includes(turn.draft.trim().slice(0, 60))) {
      turn = {
        ...turn,
        reply: "I've written a version from what you told me — it's in the box below. Read it over. If something's off or missing, tell me and I'll change it, or you can edit it yourself.",
      }
    }
    if (turn.followUp) {
      const statements = turn.reply
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !sentence.trim().endsWith('?'))
        .join(' ')
        .trim()
      turn = { ...turn, reply: statements }
    }
    turn = stripNarration(turn)
    turn = stripPromptExamples(turn)
    turn = dropJunkReason(turn, request.guidance.factorsQuote)
    return finish(200, { turn })
  }
  return finish(422, { error: 'assistant_unavailable' })
}

/**
 * The prompt bans process narration; this makes the ban mechanical. Leading sentences
 * that narrate ("Thanks for sharing…", "Let's go through…", "Here's what I have…") are
 * dropped. An EMPTY reply is legal — the question then renders alone, which is tighter.
 * The list is deliberately narrow so warm, content-responsive openers survive.
 */
const NARRATION_OPENER =
  /^(thanks for (sharing|explaining|telling)|let'?s (go|look|start|move|walk)|here'?s what i have)/i

export function stripNarration(turn: AgentTurn): AgentTurn {
  const kept = turn.reply
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !NARRATION_OPENER.test(sentence.trim()))
    .join(' ')
    .trim()
  return kept === turn.reply ? turn : { ...turn, reply: kept }
}

/**
 * A reason must tell the person what the board does with the answer. The observed junk
 * shapes — tautologies and the factorsQuote recited back — carry zero information and
 * read as nagging; they are nulled before they render. Narrow on purpose: reasons citing
 * the charge or their own words pass untouched.
 */
/** The prompt's example sentences, verbatim. Rule 5 tells the model they are intent,
 *  not script — models still tail-quote them onto otherwise-fresh reasons. Known
 *  constants, so the ban is mechanical: any verbatim occurrence is stripped. */
const PROMPT_EXAMPLE_SENTENCES = [
  "The board reads this next to the charge on your form. If the account is vaguer than the charge, it reads like you're avoiding it — so it's better to just say it plainly.",
  "Two years at one job is the kind of specific a board can actually weigh. 'I've been working' isn't — they see that on every one of these.",
  "The date matters because they cross-check it against your record, and a mismatch they can't explain slows everything down.",
  "What was the program, and did you finish it? Boards weigh a completed program very differently from an ongoing one, so it's worth naming.",
]

export function stripPromptExamples(turn: AgentTurn): AgentTurn {
  const scrub = (text: string) => {
    let out = text
    for (const ex of PROMPT_EXAMPLE_SENTENCES) out = out.split(ex).join(' ')
    return out.replace(/\s{2,}/g, ' ').trim()
  }
  const reply = scrub(turn.reply)
  let followUp = turn.followUp
  if (followUp?.reason) {
    const reason = scrub(followUp.reason)
    followUp = { ...followUp, reason: reason.length > 10 ? reason : null }
  }
  const nudge = turn.nudge ? { ...turn.nudge, text: scrub(turn.nudge.text) } : null
  return { ...turn, reply, followUp, nudge }
}

const JUNK_REASON =
  /^(details about|this (helps|is to help)|understanding (your|the)|boards? (look|weigh|need)s? )/i

export function dropJunkReason(turn: AgentTurn, factorsQuote: string): AgentTurn {
  if (!turn.followUp?.reason) return turn
  const reason = turn.followUp.reason.trim()
  const recitesFactors =
    reason.length > 20 && factorsQuote.toLowerCase().includes(reason.toLowerCase().replace(/[.]$/, ''))
  if (!JUNK_REASON.test(reason) && !recitesFactors) return turn
  return { ...turn, followUp: { ...turn.followUp, reason: null } }
}

/** Legal category vocabulary that appears in nearly every charge line. Writing these is
 *  describing the charge, never inventing a fact — they are exempt from the invention
 *  guard so legitimate drafts ("I was charged with possession") never false-flag. */
const CHARGE_BOILERPLATE = new Set([
  'possession', 'controlled', 'substance', 'penalty', 'group', 'grams', 'gram',
  'theft', 'property', 'assault', 'evading', 'arrest', 'detention', 'vehicle',
  'driving', 'intoxicated', 'unlawful', 'aggravated', 'burglary', 'criminal',
  'mischief', 'trespass', 'felony', 'misdemeanor', 'degree', 'state', 'family',
  'delivery', 'manufacture', 'intent', 'deadly', 'weapon', 'habitation', 'under',
])

const tokens = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

/**
 * Draft guards, mechanical (L3 + false-statement language, on the one document that
 * gets signed). Violations retry once (same ladder as A6), then fail closed.
 *
 * 1. INVENTION: a distinctive token from the charge line ("hydrocodone") appearing in
 *    the draft, but in NO user message / rawAnswer / standing account, was by
 *    construction pulled from the context block — a fact on a signed document the
 *    person never said. Two exemptions keep false positives out: legal category
 *    vocabulary (CHARGE_BOILERPLATE), and QUOTING THE CHARGE — a draft sentence that
 *    reproduces a phrase of the charge line ("possession of hydrocodone") is describing
 *    the charge on the form, which is always legitimate; the trap is the token loose in
 *    the NARRATIVE ("they found hydrocodone in the console") when the person only ever
 *    said "stuff".
 *
 * 2. CONVICTION LANGUAGE: when NO charge in the incident is a conviction, "convict*" in
 *    the draft is a false statement about a deferred adjudication. Mixed-disposition
 *    incidents are exempt — zero false positives.
 */
export function draftGuardViolations(request: AgentRequest, draft: string): string[] {
  const violations: string[] = []
  const draftTokens = tokens(draft)
  const saidByUser = new Set(
    tokens(
      request.messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' ') +
        ' ' +
        Object.values(request.context.rawAnswers).join(' ') +
        ' ' +
        request.context.currentAccount,
    ),
  )

  for (const charge of request.context.charges) {
    const chargeTokens = tokens(charge.exactOffense)
    // charge-line trigrams: any draft trigram matching one is a quotation of the charge
    const chargeTrigrams = new Set<string>()
    for (let i = 0; i + 2 < chargeTokens.length; i++) {
      chargeTrigrams.add(chargeTokens.slice(i, i + 3).join(' '))
    }
    for (const token of new Set(chargeTokens)) {
      // a user's word licenses any charge token it is a stem of — register-raising
      // ("meth" → "methamphetamine") is allowed; introducing a fact they never named is not
      const saidStem = [...saidByUser].some(
        (w) => w.length >= 4 && (token.startsWith(w) || w.startsWith(token)),
      )
      if (token.length <= 4 || CHARGE_BOILERPLATE.has(token) || saidByUser.has(token) || saidStem)
        continue
      const positions = draftTokens.flatMap((t, i) => (t === token ? [i] : []))
      if (positions.length === 0) continue
      const allQuoted = positions.every((i) => {
        for (let start = Math.max(0, i - 2); start <= i && start + 3 <= draftTokens.length; start++) {
          if (chargeTrigrams.has(draftTokens.slice(start, start + 3).join(' '))) return true
        }
        return false
      })
      if (!allQuoted) violations.push(`invented_from_context:${token}`)
    }
  }

  const anyConviction = request.context.charges.some((c) => c.disposition === 'conviction')
  if (!anyConviction && request.context.charges.length > 0 && /\bconvict/i.test(draft)) {
    violations.push('conviction_language_on_deferred')
  }

  return violations
}
