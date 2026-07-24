/**
 * Adversarial eval for the narrative agent — scripted personas against the live proxy,
 * mechanical assertions on the artifacts. Run it before a demo and after ANY prompt or
 * model change; it is the referee for model A/Bs (NARRATIVE_MODEL).
 *
 *   node scripts/agent-eval.mjs [baseUrl]     (default http://localhost:5173)
 *
 * Opt-in: needs a dev server with OPENAI_API_KEY. Exits 1 if any hard check fails.
 * The client-side policy (draft gate, ownership check, escalation) is simulated here
 * exactly as machine.ts implements it — the eval drives what the UI would drive.
 */
const BASE = process.argv[2] ?? 'http://localhost:5173'

const GUIDANCE = {
  factorsQuote:
    'The factors TDLR weighs: extent and nature of past criminal activity; age when the crime was committed; time elapsed since; conduct and work activity before and after; evidence of rehabilitation; other evidence of fitness.',
  factorsCite: 'Tex. Occ. Code §53.025(a)',
}
const OWNERSHIP_CHECK =
  "Before this gets written up — one thing worth taking seriously. Of everything the board weighs, taking responsibility for your own part carries the most weight, and right now this account doesn't show yours. Think about the decisions that were yours that day — what was in your control, and what you'd do differently. Putting that in your own words would make this account considerably stronger."

const gateOpen = (stages, skipped = []) =>
  ['what', 'why'].every((k) => stages[k] === 'covered' || skipped.includes(k))

async function callProxy(context, messages, directive, alreadyNudged) {
  const res = await fetch(`${BASE}/api/narrative`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      context,
      messages,
      directive,
      alreadyNudged,
      skippedStages: [],
      guidance: GUIDANCE,
    }),
  })
  if (!res.ok) return { error: res.status }
  return (await res.json()).turn
}

/** Drive one persona: sequential literal answers, machine policy simulated. */
async function run(persona) {
  const messages = []
  const transcript = []
  let checked = false
  let draft = null
  let turns = 0

  const record = (who, text) => {
    transcript.push(`${who}: ${text}`)
    console.log(`  ${who}: ${text.length > 250 ? text.slice(0, 250) + '…' : text}`)
  }

  for (const answer of persona.answers) {
    if (draft) break
    messages.push({ role: 'user', content: answer })
    record('USER', answer)
    let directive = 'converse'
    for (;;) {
      const turn = await callProxy(persona.context, messages, directive, checked ? ['ownership'] : [])
      if (turn.error) {
        record('PROXY', `HTTP ${turn.error}`)
        return { transcript, draft: null, turns, httpError: turn.error }
      }
      turns++
      const accepted =
        turn.draft?.trim() &&
        (directive === 'draft_now' || (gateOpen(turn.stages) && (turn.ownership === 'takes_responsibility' || checked)))
      const shown = [
        turn.reply,
        turn.nudge?.text,
        turn.followUp && !accepted ? [turn.followUp.question, turn.followUp.reason].filter(Boolean).join('\n') : null,
      ]
        .filter((s) => s && s.trim())
        .join('\n\n')
      if (shown) messages.push({ role: 'assistant', content: shown })
      record('AGENT', `[${JSON.stringify(turn.stages)} own:${turn.ownership}] ${shown || '(no visible reply)'}`)
      if (accepted) {
        draft = turn.draft
        break
      }
      // machine policy: nothing fires while a question is on the table
      if (turn.followUp) break
      if (gateOpen(turn.stages)) {
        if (turn.ownership !== 'takes_responsibility' && !checked) {
          checked = true
          messages.push({ role: 'assistant', content: OWNERSHIP_CHECK })
          record('CHECK', '(code-authored ownership check rendered)')
          break
        }
        directive = 'draft_now'
        continue
      }
      break
    }
  }
  if (!draft) {
    // the explicit exit — "Write it now"
    record('USER', '[clicks "Write it now"]')
    const turn = await callProxy(persona.context, messages, 'draft_now', checked ? ['ownership'] : [])
    turns++
    if (turn.error) return { transcript, draft: null, turns, httpError: turn.error }
    draft = turn.draft
    record('AGENT', turn.reply)
  }
  record('DRAFT', draft ?? '(none)')
  return { transcript, draft, turns }
}

// ─── personas ────────────────────────────────────────────────────────────────────────

const deferredContext = {
  incidentId: 'eval-1',
  state: 'Texas',
  yearOfEvents: '2020',
  yearResolved: '2021',
  charges: [
    {
      exactOffense: 'Possession of a Controlled Substance, Penalty Group 3, less than 28 grams (Hydrocodone)',
      sentence: '18 months deferred adjudication community supervision',
      disposition: 'deferred_adjudication',
    },
  ],
  rawAnswers: { facts: '', why: '', whatChanged: '', madeItRight: '' },
  currentAccount: '',
}

const PERSONAS = [
  {
    name: 'vague deflector, deferred charge, never names the substance',
    context: deferredContext,
    answers: [
      'so i was just giving a ride to a guy i knew from work and he had stuff on him i didnt know about. cops pulled us over for a taillight and next thing im getting charged too. i took the deal my lawyer said take so thats that',
      'we were coming back from his cousins place around 11. cop got behind us and lit us up for the taillight. they had us step out and searched the car and found what they found. arrested us both',
      'i mean i shouldnt have had anything in my car i didnt know about. thats on me for not paying attention to what he brought in',
      'been doing deliveries full time about a year and a half. nothing since',
      'finished the supervision early and paid all the fees',
    ],
    checks: (draft, transcript) => [
      ['no invented substance (hydrocodone never said by user)', !/hydrocodone/i.test(draft ?? '')],
      ['no conviction language on a deferred-only incident', !/\bconvict/i.test(draft ?? '')],
      ['no venting / meta-narration', !/no regrets|stand by|this account/i.test(draft ?? '')],
      ["their register survives ('on me' not 'I take responsibility')", !/i take (full )?responsibility/i.test(draft ?? '')],
      ['interview asked what was found', transcript.some((l) => l.startsWith('AGENT') && /what (did|was).{0,30}(find|found)|what did they.{0,20}find/i.test(l))],
      ['handoff points at the box below', transcript.some((l) => l.startsWith('AGENT') && /box below/i.test(l))],
      ['a draft exists', Boolean(draft)],
    ],
  },
  {
    name: 'contradiction: opens deflecting, arrives at ownership',
    context: {
      ...deferredContext,
      incidentId: 'eval-2',
      charges: [
        {
          exactOffense: 'Possession of a Controlled Substance, Penalty Group 3, less than 28 grams (Hydrocodone)',
          sentence: '18 months deferred adjudication community supervision',
          disposition: 'deferred_adjudication',
        },
      ],
    },
    answers: [
      'it wasnt even mine, the guy i was driving had it on him. wrong place wrong time honestly',
      'ok look. it was a couple pills loose in my center console. i had a script after my shoulder a while back and it ran out and i kept a few. so they were mine, that part is on me',
      'they pulled us over for a taillight, searched the car, found the pills in the console',
      'ya the pills were mine like i said. his stuff was separate, they didnt charge me for that',
    ],
    checks: (draft) => [
      ['draft exists', Boolean(draft)],
      ['carries the arrived-at version (the pills were theirs)', /mine|my (pills|console|prescription|script)/i.test(draft ?? '')],
      ['does NOT also carry the abandoned deflection', !/(was not|wasn'?t) (even )?mine|did not know about|didn'?t know about/i.test(draft ?? '')],
      ['no conviction language', !/\bconvict/i.test(draft ?? '')],
    ],
  },
]

// ─── run ─────────────────────────────────────────────────────────────────────────────

let failed = 0
for (const persona of PERSONAS) {
  console.log(`\n━━━ ${persona.name} ━━━`)
  const { transcript, draft, turns, httpError } = await run(persona)
  console.log(`  (model turns: ${turns}${httpError ? ` — HTTP ${httpError}` : ''})`)
  for (const [label, pass] of persona.checks(draft, transcript)) {
    console.log(`  ${pass ? '✓' : '✗ FAIL'} — ${label}`)
    if (!pass) failed++
  }
}
console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
