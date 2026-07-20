/**
 * The turn contract fails closed, and the A6 check is mechanical. Malformed fixtures here
 * are the shapes a drifting model actually produces: missing keys, wrong enums, prose
 * instead of JSON, nulls where objects belong.
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
  coverage: { facts: true, why: false, whatChanged: false, madeItRight: false },
  readyToDraft: false,
  followUp: 'What happened after the officer stopped you?',
  nudge: null,
  assumptions: [],
  draft: null,
}

describe('parseAgentTurn — fail closed', () => {
  it('accepts a well-formed turn', () => {
    expect(parseAgentTurn(validTurn)).toEqual(validTurn)
  })

  it.each([
    ['prose instead of JSON', 'Sure! Here is my reply…'],
    ['missing coverage', { ...validTurn, coverage: undefined }],
    ['coverage with wrong keys (the old whatHappened vocabulary)', { ...validTurn, coverage: { whatHappened: true, why: true, whatChanged: true, madeItRight: true } }],
    ['unknown nudge factor', { ...validTurn, nudge: { factor: 'remorse', text: 'x' } }],
    ['draft as a number', { ...validTurn, draft: 42 }],
    ['assumptions missing', { ...validTurn, assumptions: undefined }],
    ['null', null],
  ])('rejects %s', (_name, bad) => {
    expect(parseAgentTurn(bad)).toBeNull()
  })
})

describe('AgentRequest — the directive belongs to code', () => {
  it('accepts converse and draft_now, nothing else', () => {
    const base = {
      context: {
        incidentId: 'inc-1', county: 'Harris', state: 'Texas', court: '178th District Court',
        dateCrimeCommitted: '03/14/2019', dateOfConviction: '11/02/2019',
        charges: [{ exactOffense: 'Evading Arrest', sentence: '2 years, suspended', disposition: 'conviction' }],
        rawAnswers: { facts: '', why: '', whatChanged: '', madeItRight: '' },
      },
      messages: [],
      alreadyNudged: [],
    }
    expect(AgentRequestSchema.safeParse({ ...base, directive: 'converse' }).success).toBe(true)
    expect(AgentRequestSchema.safeParse({ ...base, directive: 'draft_now' }).success).toBe(true)
    expect(AgentRequestSchema.safeParse({ ...base, directive: 'draft' }).success).toBe(false)
  })
})

describe('outcomeLanguageViolations — A6 on the model voice (L1)', () => {
  it('flags outcome talk in reply, followUp, and nudge text', () => {
    expect(
      outcomeLanguageViolations({ ...validTurn, reply: "With this account you're likely to be approved." }),
    ).toHaveLength(1)
    expect(
      outcomeLanguageViolations({ ...validTurn, followUp: 'Want me to check if you qualify?' }),
    ).toHaveLength(1)
    expect(
      outcomeLanguageViolations({
        ...validTurn,
        nudge: { factor: 'change', text: "Mentioning the program makes this a strong case." },
      }),
    ).toHaveLength(1)
  })

  it('passes clean conversational language', () => {
    expect(outcomeLanguageViolations(validTurn)).toEqual([])
    expect(
      outcomeLanguageViolations({ ...validTurn, reply: 'TDLR will decide — this is what they publish.' }),
    ).toEqual([])
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
