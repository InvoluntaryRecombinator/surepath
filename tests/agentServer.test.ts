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
  },
  messages: [{ role: 'user', content: 'I ran when I was pulled over.' }],
  directive: 'converse',
  alreadyNudged: ['ownership'],
}

const cleanTurn: AgentTurn = {
  reply: 'Understood.',
  coverage: { facts: true, why: false, whatChanged: false, madeItRight: false },
  readyToDraft: false,
  followUp: 'What happened after you stopped?',
  nudge: null,
  assumptions: [],
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
    expect(prompt).not.toContain('DRAFT NOW')
  })

  it('draft_now adds the must-draft directive', () => {
    expect(buildSystemPrompt({ ...request, directive: 'draft_now' })).toContain('DRAFT NOW')
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
