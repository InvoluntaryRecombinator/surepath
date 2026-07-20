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
    // gpt-4.1-mini: mid-tier, low latency, native json_schema structured outputs, and it
    // honors an explicit temperature (the gpt-5 reasoning family does not, and spends
    // hidden reasoning tokens while a person waits on a draft).
    model: openai(env.modelId ?? 'gpt-4.1-mini'),
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

  // 3/4 — generate, with one retry for any of: throw, A6 violation, draftless draft_now.
  for (let attempt = 0; attempt < 2; attempt++) {
    let turn: AgentTurn
    try {
      turn = await run(request, system)
    } catch {
      continue
    }
    if (outcomeLanguageViolations(turn).length > 0) continue
    if (request.directive === 'draft_now' && !(turn.draft && turn.draft.trim())) continue
    // Code bounds behavior: a reply must never carry the draft (§4 — region B would show
    // the account twice). If the model repeats itself, substitute the handoff.
    if (turn.draft && turn.reply.includes(turn.draft.trim().slice(0, 60))) {
      turn = {
        ...turn,
        reply:
          "I've put together an account from what you told me — it's on the right. Tell me anything you want changed.",
      }
    }
    return finish(200, { turn })
  }
  return finish(422, { error: 'assistant_unavailable' })
}
