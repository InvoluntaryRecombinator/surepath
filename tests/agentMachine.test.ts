/**
 * The machine bounds the model (AGENT_SPEC §5). These tests are the code-enforced rules,
 * one by one: the cap, the once-ever nudge, the manual path, the hint-never-gate stance,
 * the affirmation gate, and the no-rewriting-behind-them guarantee.
 */
import { describe, expect, it } from 'vitest'
import {
  MAX_FOLLOWUP_TURNS,
  canCommit,
  initialConversation,
  nextDirective,
  reduceConversation,
  type ConversationState,
} from '../src/agent/machine'
import type { AgentTurn } from '../src/agent/turns'

const turn = (over: Partial<AgentTurn> = {}): AgentTurn => ({
  reply: 'Okay.',
  coverage: { facts: true, why: false, whatChanged: false, madeItRight: false },
  readyToDraft: false,
  followUp: 'What happened next?',
  nudge: null,
  assumptions: [],
  draft: null,
  ...over,
})

const run = (state: ConversationState, ...events: Parameters<typeof reduceConversation>[1][]) =>
  events.reduce(reduceConversation, state)

describe('the manual path is first-class', () => {
  it('EMPTY → write → affirm → COMMITTED, zero model involvement', () => {
    let s = initialConversation()
    expect(s.status).toBe('empty')
    s = run(
      s,
      { type: 'user-wrote-account', text: 'I ran when I should have stopped. I finished the program in 2020.' },
      { type: 'set-affirmed', value: true },
      { type: 'commit' },
    )
    expect(s.status).toBe('committed')
    expect(s.turnCount).toBe(0)
    expect(s.messages).toEqual([])
  })

  it('a story-lite account resumes as drafted, not empty', () => {
    expect(initialConversation('already written').status).toBe('drafted')
  })
})

describe('the cap is a counter, not an instruction', () => {
  it(`directive flips to draft_now after ${MAX_FOLLOWUP_TURNS} model turns`, () => {
    let s = initialConversation()
    for (let i = 0; i < MAX_FOLLOWUP_TURNS; i++) {
      expect(nextDirective(s)).toBe('converse')
      s = run(s, { type: 'user-sent', text: `answer ${i}` }, { type: 'model-turn', turn: turn() })
    }
    expect(s.turnCount).toBe(MAX_FOLLOWUP_TURNS)
    expect(nextDirective(s)).toBe('draft_now')
  })

  it('the follow-up question is suppressed on the capping turn', () => {
    let s = initialConversation()
    for (let i = 0; i < MAX_FOLLOWUP_TURNS; i++) {
      s = run(s, { type: 'user-sent', text: 'a' }, { type: 'model-turn', turn: turn() })
    }
    // the third (capping) turn rendered reply but no question
    expect(s.pendingFollowUp).toBeNull()
    expect(s.messages.at(-1)?.content).toBe('Okay.')
  })

  it('"Write it now" forces draft_now from turn one', () => {
    expect(nextDirective(initialConversation(), { writeItNow: true })).toBe('draft_now')
  })
})

describe('a factor is nudged once, ever', () => {
  it('drops a repeat nudge before render, allows a different factor', () => {
    let s = initialConversation()
    s = run(s, { type: 'user-sent', text: 'x' }, {
      type: 'model-turn',
      turn: turn({ nudge: { factor: 'ownership', text: 'Worth mentioning your part.' } }),
    })
    expect(s.pendingNudge?.factor).toBe('ownership')

    s = run(s, { type: 'user-sent', text: 'no' }, {
      type: 'model-turn',
      turn: turn({ nudge: { factor: 'ownership', text: 'About your part again…' } }),
    })
    expect(s.pendingNudge).toBeNull() // their no is final

    s = run(s, { type: 'user-sent', text: 'y' }, {
      type: 'model-turn',
      turn: turn({ nudge: { factor: 'change', text: 'Anything changed since?' }, followUp: null }),
    })
    expect(s.pendingNudge?.factor).toBe('change')
    expect(s.nudgedFactors).toEqual(['ownership', 'change'])
  })
})

describe('drafts and the account panel', () => {
  it('a model draft populates the account, un-affirmed, and suppresses the question', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'the story' },
      { type: 'model-turn', turn: turn({ draft: 'On March 14 I…', readyToDraft: true, assumptions: ['that the program finished in 2020'] }) },
    )
    expect(s.status).toBe('drafted')
    expect(s.account).toBe('On March 14 I…')
    expect(s.accountSource).toBe('model')
    expect(s.assumptions).toEqual(['that the program finished in 2020'])
    expect(s.affirmed).toBe(false)
    expect(s.pendingFollowUp).toBeNull()
  })

  it('a draftless refinement turn NEVER touches the account', () => {
    const s = run(
      initialConversation('their edited words'),
      { type: 'user-sent', text: 'can you tighten it?' },
      { type: 'model-turn', turn: turn({ draft: null }) },
    )
    expect(s.account).toBe('their edited words')
    expect(s.status).toBe('drafted')
  })

  it('a user edit wins and resets the affirmation — no rewriting behind them', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'story' },
      { type: 'model-turn', turn: turn({ draft: 'model words' }) },
      { type: 'set-affirmed', value: true },
      { type: 'user-wrote-account', text: 'my words, my edit' },
    )
    expect(s.account).toBe('my words, my edit')
    expect(s.accountSource).toBe('manual')
    expect(s.affirmed).toBe(false)
  })
})

describe('the affirmation is the gate (§7)', () => {
  it('commit is refused without it, works with it, and committed is terminal', () => {
    let s = run(initialConversation(), { type: 'user-wrote-account', text: 'done' })
    expect(canCommit(s)).toBe(false)
    s = reduceConversation(s, { type: 'commit' })
    expect(s.status).toBe('drafted') // refused

    s = run(s, { type: 'set-affirmed', value: true }, { type: 'commit' })
    expect(s.status).toBe('committed')

    const after = reduceConversation(s, { type: 'user-wrote-account', text: 'sneaky change' })
    expect(after).toBe(s) // terminal for this sitting
  })

  it('hints never gate: readyToDraft/coverage flags change nothing by themselves', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'x' },
      {
        type: 'model-turn',
        turn: turn({ readyToDraft: true, coverage: { facts: true, why: true, whatChanged: true, madeItRight: true } }),
      },
    )
    expect(s.status).toBe('gathering') // no draft, no transition — the hint alone does nothing
  })
})
