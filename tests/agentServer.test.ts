/**
 * The proxy fails closed at every layer (AGENT_SPEC §8) — proven with an injected generator,
 * no network, no key.
 */
import { describe, expect, it, vi } from 'vitest'
import { draftGuardViolations, handleNarrativeRequest } from '../src/agent/server'
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
    expect(turn.reply).toContain("it's in the box below")
  })
})

describe('reply never carries a question when followUp exists (§4)', () => {
  it('strips question sentences AND narration openers — an empty reply is legal', async () => {
    const leaky = {
      ...cleanTurn,
      reply: 'Thanks for sharing that. Can you tell me more about what happened?',
    }
    const res = await handleNarrativeRequest(request, env, async () => leaky)
    const turn = res.body.turn as typeof leaky
    // the question is stripped (lives in followUp) and the gratitude opener is stripped
    // (process narration) — the question then renders alone, which is tighter.
    expect(turn.reply).toBe('')
    expect(turn.followUp?.question).toBe('What happened after you stopped?')
  })

  it('keeps a content-responsive reply untouched', async () => {
    const warm = {
      ...cleanTurn,
      reply: 'Eight months and finished — that program is exactly the kind of specific that carries.',
    }
    const res = await handleNarrativeRequest(request, env, async () => warm)
    expect((res.body.turn as typeof warm).reply).toBe(warm.reply)
  })
})

describe('the junk-reason gate — a reason names a consequence or it does not render', () => {
  const withReason = (reason: string) => ({
    ...cleanTurn,
    followUp: { question: 'Which program was it?', reason, stage: 'changed' as const },
  })

  it.each([
    'Details about the incident help clarify what actually happened.',
    'This helps the board understand your perspective.',
    'Boards look for evidence of rehabilitation and conduct after the event.',
    'Understanding your perspective on why it happened helps the board see the context.',
  ])('nulls the observed junk shape: %s', async (junk) => {
    const res = await handleNarrativeRequest(request, env, async () => withReason(junk))
    expect((res.body.turn as AgentTurn).followUp?.reason).toBeNull()
  })

  it('keeps a reason that names a concrete consequence', async () => {
    const real =
      "The form names the charge, so the account should say it too — leaving it out reads like avoiding it."
    const res = await handleNarrativeRequest(request, env, async () => withReason(real))
    expect((res.body.turn as AgentTurn).followUp?.reason).toBe(real)
  })
})

describe('the example scrubber — prompt illustrations never reach the screen', () => {
  it('strips a verbatim example tail-quoted onto a fresh reason', async () => {
    const tailQuoted = {
      ...cleanTurn,
      followUp: {
        question: 'Where do you work, and how long have you been there?',
        reason:
          "Naming your employer and how long you've held the job is the kind of detail the board weighs most. Two years at one job is the kind of specific a board can actually weigh. 'I've been working' isn't — they see that on every one of these.",
        stage: 'changed' as const,
      },
    }
    const res = await handleNarrativeRequest(request, env, async () => tailQuoted)
    const turn = res.body.turn as AgentTurn
    expect(turn.followUp?.reason).toBe(
      "Naming your employer and how long you've held the job is the kind of detail the board weighs most.",
    )
  })
})

describe('the draft guards — mechanical L3 on the signed document', () => {
  const deferredOnly = {
    ...request,
    context: {
      ...request.context,
      charges: [
        {
          exactOffense: 'Possession of a Controlled Substance, Penalty Group 3, under 28 grams (Hydrocodone)',
          sentence: '18 months deferred adjudication',
          disposition: 'deferred_adjudication' as const,
        },
      ],
    },
    messages: [
      { role: 'user' as const, content: 'they found stuff in the car, i took the deal my lawyer said take' },
    ],
  }

  it('flags a substance pulled from context into the narrative', () => {
    expect(
      draftGuardViolations(deferredOnly, 'The officers searched the car and found hydrocodone in the console.'),
    ).toContain('invented_from_context:hydrocodone')
  })

  it('allows QUOTING the charge line — describing the charge is not inventing a fact', () => {
    expect(
      draftGuardViolations(
        deferredOnly,
        'I was charged with possession of a controlled substance, penalty group 3, under 28 grams (hydrocodone). They found items I did not know about.',
      ),
    ).toEqual([])
  })

  it('allows register-raising — a stem the person said licenses the full charge token', () => {
    const saidMeth = {
      ...deferredOnly,
      context: {
        ...deferredOnly.context,
        charges: [
          {
            exactOffense: 'Possession of a Controlled Substance, Penalty Group 1 (Methamphetamine)',
            sentence: '2 years deferred adjudication',
            disposition: 'deferred_adjudication' as const,
          },
        ],
      },
      messages: [{ role: 'user' as const, content: 'i had meth on me, like a gram' }],
    }
    expect(
      draftGuardViolations(saidMeth, 'I had methamphetamine on me, about a gram.'),
    ).toEqual([])
  })

  it('allows tokens the person actually said', () => {
    const said = {
      ...deferredOnly,
      messages: [{ role: 'user' as const, content: 'it was hydrocodone, a few loose pills' }],
    }
    expect(draftGuardViolations(said, 'They found hydrocodone pills in the console.')).toEqual([])
  })

  it('flags conviction language when no charge is a conviction', () => {
    expect(draftGuardViolations(deferredOnly, 'After my conviction, I completed supervision.')).toContain(
      'conviction_language_on_deferred',
    )
    // mixed dispositions are exempt — the original request has a real conviction in it
    expect(draftGuardViolations(request, 'After my conviction, I completed supervision.')).toEqual([])
  })

  it('a guard violation consumes the retry, then fails closed', async () => {
    const bad = {
      ...cleanTurn,
      followUp: null,
      draft: 'After my conviction, I moved on.',
    }
    const generate = vi.fn().mockResolvedValue(bad)
    const res = await handleNarrativeRequest({ ...deferredOnly, directive: 'draft_now' }, env, generate)
    expect(generate).toHaveBeenCalledTimes(2)
    expect(res.status).toBe(422)
  })

  it('a violating first attempt recovered by a clean retry returns 200', async () => {
    const bad = { ...cleanTurn, followUp: null, draft: 'They found hydrocodone on the seat.' }
    const good = { ...cleanTurn, followUp: null, draft: 'They found items I did not know about.' }
    const generate = vi.fn().mockResolvedValueOnce(bad).mockResolvedValueOnce(good)
    const res = await handleNarrativeRequest({ ...deferredOnly, directive: 'draft_now' }, env, generate)
    expect(res.status).toBe(200)
    expect((res.body.turn as AgentTurn).draft).toBe(good.draft)
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
    // the trigger wiring: the sequence outranks stage questions, and a flat no is an answer
    expect(prompt).toContain('THIS SEQUENCE TAKES PRIORITY')
    expect(prompt).toContain('A clear no IS an answer')
    // the patch set: register, real reasons, the offense gate, stage order, story changes
    expect(prompt).toContain('sitting next to them, not across from them')
    expect(prompt).toContain('WHAT THE BOARD DOES WITH THE ANSWER')
    expect(prompt).toContain('"what" CANNOT BE COVERED WITHOUT THE OFFENSE ITSELF')
    expect(prompt).toContain('WORK THE STAGES IN ORDER')
    expect(prompt).toContain('WHEN THEIR STORY CHANGES')
    expect(prompt).toContain("it's in the box below")
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

  it('drafting mode bans the refusal and meta-narration from the signed account', () => {
    const prompt = buildSystemPrompt({ ...request, directive: 'draft_now' })
    expect(prompt).toContain('WHAT NEVER GOES IN')
    expect(prompt).toContain('said to YOU in frustration, not to the board')
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
