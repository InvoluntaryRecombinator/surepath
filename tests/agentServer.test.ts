/**
 * The proxy fails closed at every layer (AGENT_SPEC §8) — proven with an injected generator,
 * no network, no key.
 */
import { describe, expect, it, vi } from 'vitest'
import { handleNarrativeRequest } from '../src/agent/server'
import { buildSystemPrompt, findIdentifierKeys } from '../src/agent/prompt'
import type { AgentRequest, AgentTurn } from '../src/agent/turns'

const request: AgentRequest = {
  context: {
    incidentId: 'inc-1',
    county: 'Harris',
    state: 'Texas',
    court: '178th District Court',
    dateCrimeCommitted: '03/14/2019',
    dateOfConviction: '11/02/2019',
    charges: [
      { exactOffense: 'Possession of a Controlled Substance, PG1 <1g', sentence: '3 years deferred', disposition: 'deferred_adjudication' },
      { exactOffense: 'Evading Arrest', sentence: '2 years, suspended', disposition: 'conviction' },
    ],
    rawAnswers: { facts: 'I ran when I was pulled over.', why: '', whatChanged: '', madeItRight: '' },
    currentAccount: '',
  },
  messages: [{ role: 'user', content: 'I ran when I was pulled over.' }],
  directive: 'converse',
  alreadyNudged: ['ownership'],
  skippedStages: ['right'],
  guidance: {
    factorsQuote: 'The factors TDLR weighs: extent and nature of past criminal activity…',
    factorsCite: 'Tex. Occ. Code §53.025(a)',
  },
}

const cleanTurn: AgentTurn = {
  reply: 'Understood.',
  stages: { what: 'thin', why: 'empty', changed: 'empty', right: 'empty' },
  ownership: 'partial',
  readyToDraft: false,
  followUp: { question: 'What happened after you stopped?', reason: null, stage: 'what' },
  nudge: null,
  draft: null,
}

const env = { apiKey: 'test-key' }

describe('the identifier guard (D6)', () => {
  it('finds identifier-shaped keys anywhere in the tree', () => {
    expect(findIdentifierKeys({ name: 'x' })).toEqual(['name'])
    expect(findIdentifierKeys({ deep: [{ last_name: 'x' }] })).toEqual(['last_name'])
    expect(findIdentifierKeys({ context: { dob: 'x' } })).toEqual(['dob'])
    expect(findIdentifierKeys({ emailAddress: 'x' })).toEqual(['emailAddress'])
  })

  it('passes the legitimate request untouched', () => {
    expect(findIdentifierKeys(request)).toEqual([])
  })

  it('rejects a payload with identifiers with 400, before the model is ever called', async () => {
    const generate = vi.fn()
    const res = await handleNarrativeRequest({ ...request, name: 'Rivera' }, env, generate)
    expect(res.status).toBe(400)
    expect(generate).not.toHaveBeenCalled()
  })
})

describe('the prompt carries the incident, the closed nudges, and the directive', () => {
  it('injects charges with the N>1 one-account clause and the closed factors', () => {
    const prompt = buildSystemPrompt(request)
    expect(prompt).toContain('Evading Arrest')
    expect(prompt).toContain('(deferred adjudication)')
    expect(prompt).toContain('2 CHARGES')
    expect(prompt).toContain('never raise these again')
    expect(prompt).toContain('ownership')
    expect(prompt).toContain('EXPLICITLY SKIPPED')
    expect(prompt).toContain('right')
    expect(prompt).not.toContain('YOU ARE NOW WRITING THE FINAL ACCOUNT')
  })

  it('draft_now selects the drafting prompt', () => {
    expect(buildSystemPrompt({ ...request, directive: 'draft_now' })).toContain('YOU ARE NOW WRITING THE FINAL ACCOUNT')
  })
})

describe('fail closed on the model side', () => {
  it('returns the turn on the happy path', async () => {
    const res = await handleNarrativeRequest(request, env, async () => cleanTurn)
    expect(res.status).toBe(200)
    expect(res.body.turn).toEqual(cleanTurn)
  })

  it('retries once on an A6 violation, then 422s — the model never speaks outcomes', async () => {
    const bad = { ...cleanTurn, reply: "You're likely to be approved with this." }
    const generate = vi.fn().mockResolvedValue(bad)
    const res = await handleNarrativeRequest(request, env, generate)
    expect(generate).toHaveBeenCalledTimes(2)
    expect(res.status).toBe(422)
  })

  it('a violating first attempt recovered by a clean retry returns 200', async () => {
    const bad = { ...cleanTurn, reply: 'This should help your chances.' }
    const generate = vi.fn().mockResolvedValueOnce(bad).mockResolvedValueOnce(cleanTurn)
    const res = await handleNarrativeRequest(request, env, generate)
    expect(res.status).toBe(200)
  })

  it('draft_now without a draft retries, then 502-path 422s', async () => {
    const draftless = { ...cleanTurn }
    const generate = vi.fn().mockResolvedValue(draftless)
    const res = await handleNarrativeRequest({ ...request, directive: 'draft_now' }, env, generate)
    expect(generate).toHaveBeenCalledTimes(2)
    expect(res.status).toBe(422)
  })

  it('a throwing generator retries then fails closed', async () => {
    const generate = vi.fn().mockRejectedValue(new Error('network'))
    const res = await handleNarrativeRequest(request, env, generate)
    expect(res.status).toBe(422)
  })

  it('missing key without an injected generator → 503, no crash', async () => {
    const res = await handleNarrativeRequest(request, { apiKey: undefined })
    expect(res.status).toBe(503)
  })

  it('malformed request shape → 400', async () => {
    const res = await handleNarrativeRequest({ directive: 'converse' }, env, async () => cleanTurn)
    expect(res.status).toBe(400)
  })
})

describe('reply never carries the draft (§4)', () => {
  it('substitutes the handoff when the model duplicates the draft into reply', async () => {
    const dup = {
      ...cleanTurn,
      draft: 'On March 14, 2019, in Harris County, I was arrested after police found a controlled substance in my truck.',
      reply: 'On March 14, 2019, in Harris County, I was arrested after police found a controlled substance in my truck.',
      followUp: null,
    }
    const res = await handleNarrativeRequest(request, env, async () => dup)
    expect(res.status).toBe(200)
    const turn = res.body.turn as typeof dup
    expect(turn.draft).toBe(dup.draft)
    expect(turn.reply).not.toContain('Harris County')
    expect(turn.reply).toContain("it's below")
  })
})

describe('reply never carries a question when followUp exists (§4)', () => {
  it('strips question sentences from reply — they live only in followUp', async () => {
    const leaky = {
      ...cleanTurn,
      reply: 'Thanks for sharing that. Can you tell me more about what happened?',
    }
    const res = await handleNarrativeRequest(request, env, async () => leaky)
    const turn = res.body.turn as typeof leaky
    expect(turn.reply).toBe('Thanks for sharing that.')
    expect(turn.followUp?.question).toBe('What happened after you stopped?')
  })
})

describe('the two prompts (§6)', () => {
  it('interview mode: stages/ownership machinery, injected factors, no drafting body', () => {
    const prompt = buildSystemPrompt(request)
    expect(prompt).toContain('OWNERSHIP — report it every turn')
    expect(prompt).toContain('Tex. Occ. Code §53.025(a)')
    expect(prompt).toContain('extent and nature of past criminal activity')
    expect(prompt).not.toContain('YOU ARE NOW WRITING THE FINAL ACCOUNT')
    // the typist line is gone; the advocacy line replaced it
    expect(prompt).not.toContain('You are their typist')
    expect(prompt).toContain('not a bystander')
  })

  it('interview mode draws out what is missing — and never invents it', () => {
    const prompt = buildSystemPrompt(request)
    expect(prompt).toContain('DRAWING OUT WHAT\'S MISSING')
    expect(prompt).toContain('RECOGNIZE WHAT COUNTS')
    expect(prompt).toContain('WHEN SOMEONE SAYS THEY FEEL NO REGRET')
    expect(prompt).toContain('Ask twice at most')
    expect(prompt).toContain('Never invent regret they did not express')
    expect(buildSystemPrompt({ ...request, directive: 'draft_now' })).not.toContain(
      'DRAWING OUT WHAT\'S MISSING',
    )
  })

  it('draft_now mode: the distinct final-account instruction', () => {
    const prompt = buildSystemPrompt({ ...request, directive: 'draft_now' })
    expect(prompt).toContain('YOU ARE NOW WRITING THE FINAL ACCOUNT')
    expect(prompt).not.toContain('HOW TO ASK')
  })

  it('drafting mode carries the deferred-adjudication language rules', () => {
    const prompt = buildSystemPrompt({ ...request, directive: 'draft_now' })
    expect(prompt).toContain('CONVICTIONS VS. DEFERRED ADJUDICATION')
    expect(prompt).toContain('was NOT a conviction')
  })

  it('a standing account is injected as the revision substrate, with the L3 guard', () => {
    const withAccount = buildSystemPrompt({
      ...request,
      context: { ...request.context, currentAccount: 'I ran. I paid my fines.' },
    })
    expect(withAccount).toContain('THE CURRENT ACCOUNT')
    expect(withAccount).toContain('I ran. I paid my fines.')
    // tone requests re-weight THEIR words; missing material is asked for, never invented —
    // and the canonical trap (apologetic/remorseful) is named outright
    expect(withAccount).toContain('The canonical trap')
    expect(withAccount).toContain('INVENTING, not reorganizing')
    expect(buildSystemPrompt(request)).not.toContain('THE CURRENT ACCOUNT')
  })
})
