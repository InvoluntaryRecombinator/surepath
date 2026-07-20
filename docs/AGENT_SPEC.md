# SurePath — Narrative Agent Spec (Phase 4)

> The "Your story" stage. **The hardest part of the product, and where the scrivener's line
> lives.** Read `CLAUDE.md` L1–L5 before writing a line of it.
>
> This spec is **buildable as written.** Where a decision could be made two ways, it is made
> here. Do not vibe this component.

---

## 0. The one-sentence version

A person who was arrested once and charged with three things writes **one account of that
night**, with an assistant that asks a few questions, drafts from **only what they said**,
shows them what it wrote and where every sentence came from, and does nothing to their packet
until they press Save.

---

## 1. Architecture — no framework

**Do not install LangChain, Rasa, Botpress, Vercel AI SDK's agent abstractions, or any chatbot
framework.** They solve problems we don't have (multi-intent routing, tool orchestration, RAG).
This is one conversation with one job. A framework here is dead weight and a reviewer will ask
why it exists.

```
Browser (React workbench)
   │  POST { messages[], context }   ← context = NarrativeContext. NO identifiers.
   ▼
/api/narrative        ← our serverless fn, ~50 lines. Holds API key + system prompt.
   │  stateless · zero-retention · logs status only · rejects identifier-shaped payloads (D6)
   ▼
Anthropic Messages API
   │  returns ONE JSON object (§4). Not prose.
   ▼
Browser   ← OUR code parses it and decides what renders. The model has no write access.
```

**Three things we control, and they are the whole value:**
1. the system prompt (§6)
2. the provenance check (§7) — no framework does this; it is specific to our liability
3. data minimization — the proxy never receives a name, DOB, SSN, or address, because
   `buildNarrativeContext()` stripped them upstream. **Provable**, not promised.

---

## 2. The data question, answered exactly

### One narrative per INCIDENT. Never per charge.

An incident is one arrest/event. It holds 1..N charges. **The narrative belongs to the
incident**, because a person tells the story of *a night*, not of a statute.

```ts
Case
 └── incidents[]           ← one story each
      ├── county, state, court, dateCrimeCommitted, dateOfConviction
      ├── charges[]        ← 1..N. exactOffense + sentence + disposition
      └── narrative        ← { rawAnswers, messages[], draft, final, provenance }
```

### What differs between "incident with 3 charges" and "single charge"

**Almost nothing in the code path, and that is deliberate.** A standalone charge *is* an
incident whose `charges` array has length 1. **One type, one component, one code path.** There
is no second branch to maintain.

The three places `charges.length` actually changes behavior:

| Where | N = 1 | N > 1 |
|---|---|---|
| **Context sent to model** | `charges: [one]` | `charges: [all N]` — the model must see all of them or it writes fragments |
| **System prompt clause** | standard | inject: *"This arrest produced N charges, listed above. Write ONE account that honestly covers all of them together — do not write about them as separate events."* |
| **Packet mapping** | narrative → 1 document slot | narrative → **N document slots, all pointing at the same continuation sheet** |

That last row is the only structural consequence, and `packetPlan()` already owns it:

```ts
// packetPlan already computes this. The narrative does not need to know.
// incident with 3 charges  →  3 questionnaire slots
//                          →  each item-21/14 reads "SEE ATTACHED CONTINUATION SHEET"
//                          →  all three point to ONE sheet carrying ONE account
```

> ⚠️ **Corrected — three claims in earlier drafts were false, verified against the codebase:**
> - `buildNarrativeContext` **does not exist.** It was specified in ARCHITECTURE §8.4 and never
>   implemented. Build it (small, pure).
> - The `<NarrativeStep>` seam **does not exist.** The section-registry replaced that idea —
>   adding a section means adding a `case` and a component. New construction on a prepared lot,
>   not a drop-in.
> - `CONTINUATION_SHEETS = 'per_questionnaire'` is the settled decision: **N self-contained
>   sheets, each duplicating the one authored account.** Earlier text claimed one shared sheet.
>   The account is authored once per incident either way — but do not "fix" the flag to match
>   the old wording.

**Guard, in a comment on the type:** the narrative is keyed by `incidentId`, never by
`chargeId`. If you ever find yourself writing `charge.narrative`, stop — you are about to make
someone write the same story four times.

### The context contract

```ts
function buildNarrativeContext(incident: Incident): NarrativeContext   // pure, already built

type NarrativeContext = {
  incidentId: string
  county: string; state: string; court: string
  dateCrimeCommitted: string; dateOfConviction: string
  charges: { exactOffense: string; sentence: string; disposition: Disposition }[]
  rawAnswers: { facts: string; why: string; whatChanged: string; madeItRight: string }
}
// NO name. NO DOB. NO SSN. NO address. NO other incidents. Asserted by test. (D6)
```

---

## 3. Page architecture — a workbench, NOT a chatbot

> ⛔ **Explicitly forbidden**, because this is the failure everyone defaults to:
> a floating bubble, a bottom-right corner widget, a chat panel with avatar circles, bouncing
> typing dots, "AI is thinking…", a send button with a paper-plane icon. **Ours is not a
> support bot bolted onto a page. It is the workspace for the hardest thing on the form.**

Clicking a card in the "Your story" list opens a **full-bleed takeover of the content area** —
the only screen in the app that earns one. Three regions:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to your record                                        MARCH 14, 2019     │  A. FACT STRIP
│  Harris County · 178th District Court                                            │     pinned, never
│  ┌────────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐    │     scrolls away
│  │ Possession, PG1<1g │ │ Evading Arrest   │ │ Assault Causing Bodily Injury│    │     ← ALL charges,
│  └────────────────────┘ └──────────────────┘ └──────────────────────────────┘    │       visible while
├───────────────────────────────────────────┬──────────────────────────────────────┤       they write
│                                           │                                      │
│  B. THE EXCHANGE                          │  C. THE ACCOUNT                      │
│  ───────────────                          │  ─────────────                       │
│                                           │                                      │
│  What happened that night?                │  (empty until drafted)               │
│  ┌─────────────────────────────────────┐  │                                      │
│  │ user writes here                    │  │  then: the draft, EDITABLE,          │
│  └─────────────────────────────────────┘  │  with provenance marks               │
│                                           │                                      │
│  Why did things go the way they did?      │  ┌────────────────────────────────┐  │
│  ┌─────────────────────────────────────┐  │  │ On March 14, 2019 I was …      │  │
│  │                                     │  │  │                                │  │
│  └─────────────────────────────────────┘  │  │ ⚠ I completed anger management │  │
│                                           │  │   ↑ you didn't mention this    │  │
│  [ assistant's follow-up appears here,    │  └────────────────────────────────┘  │
│    in its own voice, visually distinct ]  │                                      │
│                                           │  [ Save this account ]               │
└───────────────────────────────────────────┴──────────────────────────────────────┘
```

**Region A — the fact strip.** Date, county, court, and **every charge as a chip.** Pinned. It
is on screen the entire time they write. This is *why* incidents exist: they can see all three
charges and write one true account instead of three amputated ones.

**Region B — the exchange.** Not a chat log. It reads as **a written interview**: the
assistant's questions are typeset as prompts (distinct weight/color, not a bubble), the user's
answers are their own text blocks. It grows downward. No avatars. No timestamps. No bubbles.

**Region C — the account.** Empty until a draft exists. Then it holds the draft, fully
editable, with provenance marks (§7). This is the artifact; B is the process. **Nothing enters
the packet from B — only from C, and only on Save.**

On narrow screens C stacks below B. B never becomes a floating panel.

**Entry point** — the "Your story" card list (already spec'd in `PRD.md` Stage 5): one wide
thin card per incident, charges listed, checkbox on the left, `n of m accounts done`, Continue
hard-gated until all are complete.

---

## 4. The contract — model proposes, code disposes

### The REQUEST carries a directive. Code decides what the model may do.

```ts
type AgentRequest = {
  context: NarrativeContext
  messages: { role: 'user' | 'assistant'; content: string }[]
  directive: 'converse' | 'draft_now'   // ← code sets this, not the model
  alreadyNudged: string[]
}
```

**In `converse` mode, discard any draft the model volunteers.** This is the single strongest
anti-drift move available: the model cannot decide unilaterally to stop asking and start
writing, because our code controls whether a draft is even permitted.

### The RESPONSE is one JSON object. Never prose.

```ts
type AgentTurn = {
  reply: string                    // shown in region B. conversational, short.
                                   // NEVER contains the question — questions live only in followUp.
  coverage: {                      // keys MATCH rawAnswers keys exactly
    facts: boolean
    why: boolean
    whatChanged: boolean
    madeItRight: boolean
  }
  readyToDraft: boolean            // means "I am drafting now" — see §5. A hint, never a gate.
  followUp: string | null          // ONE question, or null
  nudge: {
    factor: 'ownership' | 'understanding' | 'change' | 'restitution'
    text: string
  } | null
  assumptions: string[]            // anything the model filled in that the user didn't say directly.
                                   // SELF-REPORTED transparency. Not verification. See §7.
  draft: string | null             // populated when the model judges it has enough, OR on draft_now
}
```

Enforced by a Zod schema through the AI SDK's structured-output mode, which retries
automatically on malformed output.

**`reply` never contains the question.** Questions live only in `followUp`. This matters
because after the turn cap, code renders `reply` and suppresses `followUp` — which is only
possible if the question was never embedded in the prose.

## 5. The state machine — the model drafts when ready. No permission ask.

> ⚠️ **Corrected.** An earlier version of this spec had an `OFFER_DRAFT` state where the model
> asked "want me to write it up?" and waited for a button. **That is wrong.** The user should
> not have to grant permission. The model asks a couple of questions and then, when it judges
> it has enough, **it writes the account in that same turn** and hands off conversationally.

```
   ┌───────────────────────────────────────────────────────────────────────┐
   │  EMPTY                                                                │
   │    ├── user types into the account panel directly ──────► DRAFTED     │  ← MANUAL PATH
   │    │   (no model involvement at all — a complete, valid path)         │     FIRST-CLASS
   │    └── user answers a prompt / clicks "Help me with this" ─┐          │
   └────────────────────────────────────────────────────────────┼──────────┘
                                                                ▼
                                                      ┌──────────────────┐
                    code sends directive:'converse'   │    GATHERING     │
                    model asks ONE followUp      ┌────│   turns 0..3     │
                                                 └───▶└────────┬─────────┘
                                                               │
        model returns readyToDraft:true WITH draft populated   │  OR
        OR turns === MAX  (code sends directive:'draft_now')   │  OR
        OR user clicks "Write it now"                          │
                                                               ▼
                                                      ┌──────────────────┐
                                                      │     DRAFTED      │
                                                      │ account panel is │
                                                      │ populated +      │
                                                      │ editable         │
                                                      └────────┬─────────┘
                                    user edits directly, or keeps talking to refine
                                                               │
                                            Save (requires the affirmation — §7)
                                                               ▼
                                                      ┌──────────────────┐
                                                      │    COMMITTED     │
                                                      └──────────────────┘
```

**When the model drafts, `reply` hands off conversationally** — something like *"I've put
together an account from what you told me — it's on the right. Tell me anything you want
changed."* No question, no permission request.

### The MANUAL PATH is first-class, not a fallback

`EMPTY → user writes in the account panel → Save` is a complete, valid path with **zero model
involvement.** The PRD is explicit: free text box first, nothing forced. This is also, for
free, the API-down degradation and the pre-proxy dev mode.

### Rules that live in CODE, not the prompt

```ts
const MAX_FOLLOWUP_TURNS = 3   // at the cap, code sends directive:'draft_now'. It cannot loop.

const nudgedFactors = new Set()
// if turn.nudge && nudgedFactors.has(turn.nudge.factor) → DROP before render. Once, ever.

// "Write it now" is visible from turn 1 — an escape hatch for someone who won't answer
// anything. Not the primary path, but always available. Gather-but-never-gate.

// A6 banned-word regex runs over reply / followUp / nudge.text. On hit: retry once, then
// drop the turn. The prompt forbids outcome language; code enforces it.

// coverage and readyToDraft are HINTS. Nothing gates on them. They may only accelerate
// the draft, never delay it.
```

> **The prompt shapes behavior; code bounds it. Anything that must be true belongs in code.**

## 6. The system prompt

> Every clause is an invariant made operational. Treat this like the copy — reviewed, versioned,
> not regenerated. Store it in the serverless function, not the client.

```
You help a person write one honest account of an arrest, for a criminal history evaluation
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

IF THIS ARREST PRODUCED SEVERAL CHARGES

Write ONE account covering all of them honestly and together, as one event. Do not write
about them as if they were separate incidents. If they only explained some of the charges,
ask about the others once, then write what you have.

OUTPUT

Reply with one JSON object and nothing else:
{"reply": string, "coverage": {"whatHappened": bool, "why": bool, "whatChanged": bool,
"madeItRight": bool}, "readyToDraft": bool, "followUp": string|null,
"nudge": {"factor": "ownership"|"understanding"|"change"|"restitution", "text": string}|null,
"draft": string|null}

Populate "draft" ONLY when asked to write it. Write the draft in the person's own voice,
first person, plain language, at the reading level they wrote in. Do not make them sound like
a lawyer.
```

**Injected per request:** the incident's date/county/court, the charge list, the answers so
far, and `alreadyNudged: [...]` so the model knows which points are closed.

---

## 7. Accuracy — the system prompt is the mitigation

> ⚠️ **Corrected.** An earlier version of this spec specified a code-side provenance check that
> compared draft tokens against the user's input. **Cut it. It cannot work.** People write in
> fragments and slang ("i was at a party n had a lil bit on me"); the model writes clean prose
> ("I was at a gathering and had a small amount of a controlled substance"). Token overlap is
> near-zero, so **every sentence of every draft would false-flag.** Flag fatigue would destroy
> the feature within two uses.

Three layers instead, in order of how much weight they actually carry:

**1. The system prompt (§6) is the real mitigation.** It carries the entire constraint — only
the user's information, no invented facts, no invented remorse. Write it carefully; version it;
test it adversarially (§9). This is where the safety lives.

**2. `assumptions: string[]` — model self-report.** The model lists anything it filled in that
the user didn't say directly. Rendered as a short "worth checking" list beneath the account.

> **Be honest in the docs and the UI: this is model-reported, not verified.** It is
> transparency, not a guarantee. Do not present it as a check that caught something.

**3. A required affirmation before Save — this is the real gate.** The user must confirm the
account accurately reflects what happened. Always, every incident, no exception. Plain and
unavoidable:

> *"This is the account that goes on your forms. Read it and confirm it's accurate — you're
> signing that this is your own true account."*

They are signing an affidavit either way. The affirmation is what makes that meaningful, and
it's the only layer that can't be gamed by a clever prompt.

## 8. The proxy

```ts
// /api/narrative — stateless. ~50 lines. No database. No session.
// 1. Reject the request if the payload contains identifier-shaped keys
//    (name, dob, ssn, address, phone, email) — fail closed, 400. (D6)
// 2. Attach system prompt + the per-incident injection.
// 3. Call Anthropic Messages API. Zero-retention config, verified and recorded.
// 4. Validate the response parses as AgentTurn. If not, retry once, then return a
//    graceful error — never render unparsed model output.
// 5. Log status code and latency. Never log the body.
```

Never describe this as "anonymous" or "PII-free." Say **data minimization.** A first-person
account of a specific conviction in a specific county is identifying on its own.

---

## 9. Definition of done — adversarial tests, not vibes

The component is not finished until these pass by hand:

| Input | Required behavior |
|---|---|
| **"It was mostly my buddy's fault, I just got caught up"** | Asks about their own part. Suggests ownership **once**. If the user holds firm, drafts what they said — with **no invented remorse.** |
| **Three sentences, then "just write it"** | Drafts immediately. No follow-up loop. Usable output from thin input. |
| **User declines a nudge, keeps talking** | That factor is never raised again. |
| **Incident with 3 charges, user explains only 1** | Asks about the others **once**, then writes one account covering what it has. |
| **Model returns a fact the user never said** | Sentence is flagged; Save blocked until edited or confirmed. |
| **User edits the draft by hand, then saves** | Their edit is what commits. No re-writing behind them. |
| **Payload inspection** | No name, DOB, SSN, address, or other incident ever leaves the browser. Asserted by an automated test. |
