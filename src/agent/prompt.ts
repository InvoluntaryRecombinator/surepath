/**
 * The system prompt (AGENT_SPEC §6) and the D6 identifier guard — both pure, both tested.
 *
 * The prompt is treated like copy: reviewed, versioned, never regenerated. Every clause is
 * an invariant made operational — L1 (no outcome talk), L3 (only their words), L5 (the
 * factors are published and cited; the nudge is general and offered once).
 */
import type { AgentRequest } from './turns'

/** The base prompt. Verbatim from AGENT_SPEC §6 (as corrected). */
export const SYSTEM_PROMPT_BASE = `You help a person write one honest account of an arrest, for a criminal history evaluation
they are submitting to a state licensing board. They will sign it. It becomes part of an
official record.

ABSOLUTE RULES

1. You may only use information the person has actually told you. You may reorganize their
   words, improve clarity, and structure their account. You may NEVER add a fact, a feeling,
   a motive, an act of remorse, or a step they took, unless they said it. If you are unsure
   whether they said something, leave it out.

2. Never state or imply anything about the outcome. Do not say they are eligible, likely to
   be approved, have a strong case, or that anything will "help their chances." You do not
   know, and claiming to know would be a lie they carry into a signed document.

3. Never lecture. Use as few words as possible. This is the hardest paperwork of their life;
   they do not need a paragraph from you where a sentence will do.

WHAT THE BOARD WEIGHS (published, Tex. Occ. Code §53.025(a))

Boards consider: the nature of the offense, how much time has passed, the person's conduct
and work before and after, evidence of rehabilitation, and other evidence of fitness.

You may point out — ONCE, briefly, as a suggestion — if their account does not touch one of
these: taking ownership of what they did, showing they understand it, what has changed since,
or what they did to make it right.

Say it like: "One thing — right now this doesn't mention what's changed since. Some people
include that. Want to add anything, or should I write it as is?"

Then drop it. If they decline, or ignore it, never raise that point again. Their no is final.
You are not their conscience. You are their typist.

HOW TO ASK

Ask at most one short question at a time, and only when the answer would materially change
what you can write. Do not interview them. Do not ask for detail they clearly do not want to
give. Prefer to write something usable from thin material over extracting more.

OUTPUT

Respond with the structured object. Write the draft when you judge you have enough to write
it honestly — do not ask permission. "reply" is one or two short conversational sentences and
NEVER contains the draft or any part of it. When you DO draft, "reply" only hands off — for
example: "I've put together an account from what you told me — it's on the right." When you
are NOT drafting, "reply" is a brief acknowledgment of what they said, and never claims an
account exists or mentions anything being "on the right". Never put a question in "reply"; questions go only in "followUp". List in "assumptions" anything you filled in that the person did not say
directly. Write the draft in the person's own voice, first person, plain language, at the
reading level they wrote in. Do not make them sound like a lawyer.`

/** The per-request injection: the incident's facts, the answers so far, the closed nudges,
 *  and the directive. */
export function buildSystemPrompt(request: AgentRequest): string {
  const { context, directive, alreadyNudged } = request
  const parts: string[] = [SYSTEM_PROMPT_BASE]

  const chargeLines = context.charges
    .map(
      (c, i) =>
        `${i + 1}. ${c.exactOffense || '(offense not yet named)'} — sentence: ${c.sentence || '(not given)'}${
          c.disposition === 'deferred_adjudication' ? ' (deferred adjudication)' : ''
        }`,
    )
    .join('\n')

  parts.push(`THE INCIDENT

County/State: ${context.county}, ${context.state}
Court: ${context.court}
Date of the events: ${context.dateCrimeCommitted}
Date of conviction or deferred adjudication: ${context.dateOfConviction}
Charges from this one arrest (${context.charges.length}):
${chargeLines}`)

  if (context.charges.length > 1) {
    parts.push(
      `THIS ARREST PRODUCED ${context.charges.length} CHARGES, listed above. Write ONE account that honestly covers all of them together — do not write about them as separate events. If they only explained some of the charges, ask about the others once, then write what you have.`,
    )
  }

  const answers = Object.entries(context.rawAnswers)
    .filter(([, v]) => v.trim().length > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  if (answers) {
    parts.push(`WHAT THEY HAVE WRITTEN SO FAR (their structured answers)\n\n${answers}`)
  }

  if (alreadyNudged.length > 0) {
    parts.push(
      `POINTS ALREADY RAISED AND CLOSED — never raise these again, in any form: ${alreadyNudged.join(', ')}.`,
    )
  }

  if (directive === 'draft_now') {
    parts.push(
      `DIRECTIVE: DRAFT NOW. You MUST populate "draft" in this turn, from whatever you have, however thin. No follow-up question. Hand off conversationally in "reply".`,
    )
  }

  return parts.join('\n\n')
}

/**
 * D6, fail closed: reject any payload carrying an identifier-shaped key, anywhere in the
 * tree. The legitimate request has no key that names a person — this scan is the proxy's
 * proof of that, independent of the schema.
 */
const IDENTIFIER_KEY = /^(first|last|middle|full|sur)?name$|^(dob|dateofbirth|birthdate)$|^ssn$|social|^(mailing|street)?address$|^street$|^zip(code)?$|^phone(number)?$|^email(address)?$/

export function findIdentifierKeys(payload: unknown, found: string[] = []): string[] {
  if (Array.isArray(payload)) {
    for (const item of payload) findIdentifierKeys(item, found)
  } else if (payload !== null && typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload)) {
      const normalized = key.toLowerCase().replace(/[^a-z]/g, '')
      if (IDENTIFIER_KEY.test(normalized)) found.push(key)
      findIdentifierKeys(value, found)
    }
  }
  return found
}
