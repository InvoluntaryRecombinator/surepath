/**
 * The machine bounds the model (AGENT_SPEC §5) — one test per code-enforced rule: the
 * converse draft gate, the skip waiver, the wholesale stages, the cap, the once-ever
 * nudge, the manual path, hints-never-gate, the affirmation, and no-rewriting-behind-them.
 */
import { describe, expect, it } from 'vitest'
import {
  MAX_FOLLOWUP_TURNS,
  canCommit,
  draftAllowedInConverse,
  initialConversation,
  needsReplacementConfirm,
  nextAction,
  nextDirective,
  reduceConversation,
  type ConversationState,
} from '../src/agent/machine'
import type { AgentTurn, Stages } from '../src/agent/turns'

const stages = (over: Partial<Stages> = {}): Stages => ({
  what: 'empty',
  why: 'empty',
  changed: 'empty',
  right: 'empty',
  ...over,
})

const turn = (over: Partial<AgentTurn> = {}): AgentTurn => ({
  reply: 'Okay.',
  stages: stages(),
  ownership: 'takes_responsibility',
  readyToDraft: false,
  followUp: { question: 'What happened next?', reason: null, stage: 'what' },
  nudge: null,
  draft: null,
  ...over,
})

type Event = Parameters<typeof reduceConversation>[1]
const model = (t: AgentTurn, directive: 'converse' | 'draft_now' = 'converse'): Event => ({
  type: 'model-turn',
  turn: t,
  directive,
})
const run = (state: ConversationState, ...events: Event[]) => events.reduce(reduceConversation, state)

describe('the manual path is first-class', () => {
  it('EMPTY → write → affirm → COMMITTED, zero model involvement', () => {
    const s = run(
      initialConversation(),
      { type: 'user-wrote-account', text: 'I ran when I should have stopped.' },
      { type: 'set-affirmed', value: true },
      { type: 'commit' },
    )
    expect(s.status).toBe('committed')
    expect(s.turnCount).toBe(0)
  })

  it('an existing account resumes as drafted, not empty', () => {
    expect(initialConversation('already written').status).toBe('drafted')
  })
})

describe('the converse draft gate — what + why covered, or skipped', () => {
  it('strips a volunteered draft while what/why are thin', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'stuff happened' },
      model(turn({ stages: stages({ what: 'thin', why: 'empty' }), draft: 'premature account' })),
    )
    expect(s.account).toBe('') // the gate held
    expect(s.status).toBe('gathering')
    expect(s.stages.what).toBe('thin') // but the stages still landed, wholesale
  })

  it('accepts a volunteered draft once what and why are covered', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'the full story' },
      model(turn({ stages: stages({ what: 'covered', why: 'covered' }), draft: 'the account' })),
    )
    expect(s.status).toBe('drafted')
    expect(s.account).toBe('the account')
    expect(s.accountSource).toBe('model')
  })

  it('a skip waives the gate for exactly that stage — their no is final', () => {
    let s = run(
      initialConversation(),
      { type: 'user-sent', text: 'x' },
      model(turn({ followUp: { question: 'Why did it happen?', reason: null, stage: 'why' } })),
    )
    s = reduceConversation(s, { type: 'user-skipped' })
    expect(s.skippedStages).toEqual(['why'])
    expect(s.messages.at(-1)).toEqual({ role: 'user', content: "I'd rather skip that." })
    expect(draftAllowedInConverse(s, turn({ stages: stages({ what: 'covered', why: 'empty' }) }))).toBe(true)
    expect(draftAllowedInConverse(s, turn({ stages: stages({ what: 'thin', why: 'empty' }) }))).toBe(false)
  })

  it('a skipped stage is never asked about again', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'x' },
      model(turn({ followUp: { question: 'Why?', reason: null, stage: 'why' } })),
      { type: 'user-skipped' },
      model(turn({ followUp: { question: 'But really, why?', reason: null, stage: 'why' } })),
    )
    expect(s.pendingFollowUp).toBeNull() // the re-ask was suppressed before render
  })

  it('draft_now always accepts, gate or no gate', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'just write it' },
      model(turn({ stages: stages(), draft: 'thin but honest account' }), 'draft_now'),
    )
    expect(s.status).toBe('drafted')
    expect(s.account).toBe('thin but honest account')
  })
})

describe('the cap is a backstop, not a hurry-up', () => {
  it(`directive flips to draft_now after ${MAX_FOLLOWUP_TURNS} model turns`, () => {
    let s = initialConversation()
    for (let i = 0; i < MAX_FOLLOWUP_TURNS; i++) {
      expect(nextDirective(s)).toBe('converse')
      s = run(s, { type: 'user-sent', text: `answer ${i}` }, model(turn()))
    }
    expect(nextDirective(s)).toBe('draft_now')
    expect(s.pendingFollowUp).toBeNull() // the capping turn's question never rendered
  })

  it('"Write it now" forces draft_now from turn one', () => {
    expect(nextDirective(initialConversation(), { writeItNow: true })).toBe('draft_now')
  })
})

describe('stages are the model’s, wholesale', () => {
  it('replaces all four every turn — code never merges or increments', () => {
    let s = run(
      initialConversation(),
      { type: 'user-sent', text: 'a' },
      model(turn({ stages: stages({ what: 'covered', why: 'covered', changed: 'covered', right: 'covered' }) })),
    )
    s = run(s, { type: 'user-sent', text: 'b' },
      model(turn({ stages: stages({ what: 'covered', why: 'thin' }) })))
    // the model downgraded its own read; code took it as-is
    expect(s.stages).toEqual(stages({ what: 'covered', why: 'thin' }))
  })
})

describe('a factor is nudged once, ever', () => {
  it('drops a repeat nudge before render, allows a different factor', () => {
    let s = run(initialConversation(), { type: 'user-sent', text: 'x' },
      model(turn({ nudge: { factor: 'change', text: 'Anything changed since?' } })))
    expect(s.pendingNudge?.factor).toBe('change')
    s = run(s, { type: 'user-sent', text: 'no' },
      model(turn({ nudge: { factor: 'change', text: 'About change again…' } })))
    expect(s.pendingNudge).toBeNull()
    s = run(s, { type: 'user-sent', text: 'y' },
      model(turn({ nudge: { factor: 'restitution', text: 'Fines paid?' }, followUp: null })))
    expect(s.pendingNudge?.factor).toBe('restitution')
  })
})

describe('drafts, edits, and the affirmation', () => {
  const drafted = () =>
    run(
      initialConversation(),
      { type: 'user-sent', text: 'story' },
      model(turn({ stages: stages({ what: 'covered', why: 'covered' }), draft: 'model words', followUp: null })),
    )

  it('a draft un-affirms and suppresses the question', () => {
    const s = drafted()
    expect(s.affirmed).toBe(false)
    expect(s.pendingFollowUp).toBeNull()
  })

  it('a draftless refinement turn never touches the account', () => {
    const s = run(drafted(), { type: 'user-sent', text: 'tighten it?' }, model(turn({ draft: null })))
    expect(s.account).toBe('model words')
  })

  it('a user edit wins and resets the affirmation', () => {
    const s = run(drafted(), { type: 'set-affirmed', value: true },
      { type: 'user-wrote-account', text: 'my words' })
    expect(s.account).toBe('my words')
    expect(s.accountSource).toBe('manual')
    expect(s.affirmed).toBe(false)
  })

  it('commit requires the affirmation; committed is terminal', () => {
    let s = drafted()
    expect(canCommit(s)).toBe(false)
    s = run(s, { type: 'set-affirmed', value: true }, { type: 'commit' })
    expect(s.status).toBe('committed')
    expect(reduceConversation(s, { type: 'user-wrote-account', text: 'sneak' })).toBe(s)
  })

  it('hints never gate: readyToDraft alone transitions nothing', () => {
    const s = run(initialConversation(), { type: 'user-sent', text: 'x' },
      model(turn({ readyToDraft: true })))
    expect(s.status).toBe('gathering')
  })
})

describe('revision after a manual edit needs an explicit confirm', () => {
  it('asks only when a model draft would overwrite manual text', () => {
    const manual = run(initialConversation(), { type: 'user-wrote-account', text: 'my own words' })
    expect(needsReplacementConfirm(manual, turn({ draft: 'model rewrite' }))).toBe(true)
    expect(needsReplacementConfirm(manual, turn({ draft: null }))).toBe(false)
    const modelDrafted = run(
      initialConversation(),
      { type: 'user-sent', text: 'x' },
      model(turn({ stages: stages({ what: 'covered', why: 'covered' }), draft: 'model words' })),
    )
    expect(needsReplacementConfirm(modelDrafted, turn({ draft: 'better model words' }))).toBe(false)
  })
})


describe('ownership bounds the draft (the blame-shifting fix)', () => {
  const covered = () => stages({ what: 'covered', why: 'covered' })

  it('a volunteered draft is stripped while the account deflects, unchecked', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'it was my friends stuff, wrong place wrong time' },
      model(turn({ stages: covered(), ownership: 'deflecting', draft: 'tidy deflecting account' })),
    )
    expect(s.account).toBe('')
    expect(nextAction(s)).toBe('ownership_check')
  })

  it('the check burns the ownership slot, adds the fixed copy, consumes NO turn', () => {
    let s = run(
      initialConversation(),
      { type: 'user-sent', text: 'x' },
      model(turn({ stages: covered(), ownership: 'deflecting', followUp: null })),
    )
    const turnsBefore = s.turnCount
    s = reduceConversation(s, { type: 'ownership-check-shown', text: 'THE CHECK COPY' })
    expect(s.nudgedFactors).toContain('ownership')
    expect(s.messages.at(-1)).toEqual({ role: 'assistant', content: 'THE CHECK COPY' })
    expect(s.turnCount).toBe(turnsBefore)
    // once ever: after the check, policy escalates instead of re-checking
    expect(nextAction(s)).toBe('escalate_draft')
  })

  it('the reply to the check is a NORMAL model turn — ownership re-assessed, draft reflects it', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'wasnt my fault' },
      model(turn({ stages: covered(), ownership: 'deflecting', followUp: null })),
      { type: 'ownership-check-shown', text: 'CHECK' },
      { type: 'user-sent', text: 'i mean, i did choose to get in the car. that was on me' },
      model(turn({ stages: covered(), ownership: 'takes_responsibility', draft: 'account with their part', followUp: null })),
    )
    expect(s.ownership).toBe('takes_responsibility')
    expect(s.account).toBe('account with their part')
    expect(s.status).toBe('drafted')
  })

  it('answering the check with MORE deflection still drafts — never blocks, once ever', () => {
    let s = run(
      initialConversation(),
      { type: 'user-sent', text: 'wasnt my fault' },
      model(turn({ stages: covered(), ownership: 'deflecting', followUp: null })),
      { type: 'ownership-check-shown', text: 'CHECK' },
      { type: 'user-sent', text: 'like i said, it was his stuff' },
    )
    // gate satisfied + ownership checked → policy escalates; draft_now accepts as ever
    expect(nextAction(run(s, model(turn({ stages: covered(), ownership: 'deflecting', followUp: null })))).valueOf()).toBe('escalate_draft')
    s = run(s, model(turn({ stages: covered(), ownership: 'deflecting', draft: 'their story, as told' }), 'draft_now'))
    expect(s.account).toBe('their story, as told')
  })

  it("the model's own ownership nudge shares the once-ever budget with the check", () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'x' },
      model(turn({ stages: covered(), ownership: 'deflecting', nudge: { factor: 'ownership', text: 'Your part?' }, followUp: null })),
    )
    // the model already raised it — code does not raise it again
    expect(nextAction(s)).toBe('escalate_draft')
  })

  it('takes_responsibility never triggers the check', () => {
    const s = run(
      initialConversation(),
      { type: 'user-sent', text: 'i did it, here is why' },
      model(turn({ stages: covered(), ownership: 'takes_responsibility', followUp: null })),
    )
    expect(nextAction(s)).toBe('escalate_draft')
  })

  it('nextAction stays idle before the gate opens and after drafting', () => {
    expect(nextAction(initialConversation())).toBe('idle')
    const gathering = run(initialConversation(), { type: 'user-sent', text: 'x' },
      model(turn({ stages: stages({ what: 'thin' }) })))
    expect(nextAction(gathering)).toBe('idle')
    const drafted = run(initialConversation(), { type: 'user-sent', text: 'x' },
      model(turn({ stages: covered(), draft: 'done', followUp: null })))
    expect(nextAction(drafted)).toBe('idle')
  })
})
