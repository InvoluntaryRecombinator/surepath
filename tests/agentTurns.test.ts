/**
 * The turn contract fails closed, and the A6 check is mechanical. Malformed fixtures here
 * are the shapes a drifting model actually produces: missing keys, wrong enums, the old
 * vocabulary, prose instead of JSON.
 */
import { describe, expect, it } from 'vitest'
import {
  AgentRequestSchema,
  outcomeLanguageViolations,
  parseAgentTurn,
  type AgentTurn,
} from '../src/agent/turns'

const validTurn: AgentTurn = {
  reply: 'Got it — that helps.',
  stages: { what: 'covered', why: 'thin', changed: 'empty', right: 'empty' },
  ownership: 'partial',
  readyToDraft: false,
  followUp: {
    question: 'What was going on for you that night?',
    reason: "Why it happened is the part boards read closest — 'it just happened' doesn't say much.",
    stage: 'why',
  },
  nudge: null,
  draft: null,
}

describe('parseAgentTurn — fail closed', () => {
  it('accepts a well-formed turn', () => {
    expect(parseAgentTurn(validTurn)).toEqual(validTurn)
  })

  it('accepts a reason-less, stage-less follow-up — forcing a reason would make it nag', () => {
    expect(
      parseAgentTurn({ ...validTurn, followUp: { question: 'And then?', reason: null, stage: null } }),
    ).not.toBeNull()
  })

  it.each([
    ['prose instead of JSON', 'Sure! Here is my reply…'],
    ['missing stages', { ...validTurn, stages: undefined }],
    ['missing ownership', { ...validTurn, ownership: undefined }],
    ['ownership outside the enum', { ...validTurn, ownership: 'defensive' }],
    ['the old coverage vocabulary', { ...validTurn, stages: undefined, coverage: { facts: true, why: true, whatChanged: true, madeItRight: true } }],
    ['a stage level outside the enum', { ...validTurn, stages: { ...validTurn.stages, what: 'partial' } }],
    ['followUp as a bare string (the old shape)', { ...validTurn, followUp: 'What happened next?' }],
    ['unknown nudge factor', { ...validTurn, nudge: { factor: 'remorse', text: 'x' } }],
    ['draft as a number', { ...validTurn, draft: 42 }],
    ['null', null],
  ])('rejects %s', (_name, bad) => {
    expect(parseAgentTurn(bad)).toBeNull()
  })

  it('has no assumptions field — deliberately (§7)', () => {
    expect('assumptions' in validTurn).toBe(false)
  })
})

describe('AgentRequest — code owns directive and the skip list', () => {
  const base = {
    context: {
      incidentId: 'inc-1', state: 'Texas', yearOfEvents: '2019', yearResolved: '2019',
      charges: [{ exactOffense: 'Evading Arrest', sentence: '2 years, suspended', disposition: 'conviction' }],
      rawAnswers: { facts: '', why: '', whatChanged: '', madeItRight: '' },
      currentAccount: '',
    },
    messages: [],
    alreadyNudged: [],
    skippedStages: [],
    guidance: { factorsQuote: 'the factors', factorsCite: 'Tex. Occ. Code §53.025(a)' },
  }

  it('accepts converse and draft_now, nothing else', () => {
    expect(AgentRequestSchema.safeParse({ ...base, directive: 'converse' }).success).toBe(true)
    expect(AgentRequestSchema.safeParse({ ...base, directive: 'draft_now' }).success).toBe(true)
    expect(AgentRequestSchema.safeParse({ ...base, directive: 'draft' }).success).toBe(false)
  })

  it('carries skipped stages, and only real ones', () => {
    expect(
      AgentRequestSchema.safeParse({ ...base, directive: 'converse', skippedStages: ['why'] }).success,
    ).toBe(true)
    expect(
      AgentRequestSchema.safeParse({ ...base, directive: 'converse', skippedStages: ['remorse'] }).success,
    ).toBe(false)
  })
})

describe('outcomeLanguageViolations — A6 on the model voice (L1)', () => {
  it('flags outcome talk in reply, question, reason, and nudge text', () => {
    expect(
      outcomeLanguageViolations({ ...validTurn, reply: "With this account you're likely to be approved." }),
    ).toHaveLength(1)
    expect(
      outcomeLanguageViolations({
        ...validTurn,
        followUp: { question: 'Want me to check if you qualify?', reason: null, stage: null },
      }),
    ).toHaveLength(1)
    expect(
      outcomeLanguageViolations({
        ...validTurn,
        followUp: { question: 'Which program was it?', reason: 'Details make this a strong case.', stage: 'changed' },
      }),
    ).toHaveLength(1)
    expect(
      outcomeLanguageViolations({
        ...validTurn,
        nudge: { factor: 'change', text: 'Mentioning the program makes this a strong case.' },
      }),
    ).toHaveLength(1)
  })

  it('passes clean conversational language', () => {
    expect(outcomeLanguageViolations(validTurn)).toEqual([])
  })

  it("never polices the DRAFT — the user's own words stay theirs", () => {
    expect(
      outcomeLanguageViolations({
        ...validTurn,
        draft: 'The DA told me I qualified for deferred adjudication, so I took it.',
      }),
    ).toEqual([])
  })
})
