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

## 4. The output contract — model proposes, code disposes

**Every model turn returns exactly one JSON object.** Not prose. The system prompt enforces the
shape; the proxy validates it and fails closed.

```ts
type AgentTurn = {
  reply: string                    // shown in region B. conversational, short.
  coverage: {                      // the model's read of what the user has given so far
    whatHappened: boolean
    why: boolean
    whatChanged: boolean
    madeItRight: boolean
  }
  readyToDraft: boolean            // model's opinion. CODE decides (see §5).
  followUp: string | null          // ONE question, or null
  nudge: {                         // at most one, and only for a factor not yet nudged
    factor: 'ownership' | 'understanding' | 'change' | 'restitution'
    text: string
  } | null
  draft: string | null             // populated ONLY when the user asked for a draft
}
```

**Why structured, not prose:** because the convergence rules, the nudge-once rule, and the
draft gating are then enforced by **our code**, which cannot drift, instead of by prompt
instructions, which can. The model's `readyToDraft` is an *input to* our decision, not the
decision.

---

## 5. The state machine — convergence is enforced in CODE

```
      ┌──────────┐  user submits any answer
      │  EMPTY   │──────────────────────────────┐
      └──────────┘                              ▼
                                        ┌────────────────┐
              model asks followUp  ┌───▶│   GATHERING    │
              (max 3 turns)        └────│  turns: 0..3   │
                                        └───────┬────────┘
                        turns === 3  OR  readyToDraft  OR  user clicks "Write it"
                                                │
                                                ▼
                                        ┌────────────────┐
                                        │  OFFER_DRAFT   │  "Want me to write it up?"
                                        └───────┬────────┘
                                        user says yes
                                                ▼
                                        ┌────────────────┐
                                        │    DRAFTED     │  region C populated + provenance run
                                        └───────┬────────┘
                                   user edits freely · may keep chatting
                                                │ Save (blocked if unconfirmed flags)
                                                ▼
                                        ┌────────────────┐
                                        │   COMMITTED    │  → narrative.final, card checkmarks
                                        └────────────────┘
```

### The rules that are CODE, not prompt

```ts
const MAX_FOLLOWUP_TURNS = 3      // hard cap. after this, code forces OFFER_DRAFT
                                  // regardless of what the model returns.

const nudgedFactors = new Set()   // component state
// if turn.nudge && nudgedFactors.has(turn.nudge.factor) → DROP IT, do not render.
// otherwise render once and add to the set. A factor is nudged at most once, ever.

// "Write it now" button is ALWAYS visible from turn 1.
// A user with three sentences and no patience must be able to get a draft immediately.
// Gather-but-never-gate.
```

**This is the anti-sprawl guarantee.** Prompts drift under pressure; a counter does not. The
model can *want* to keep asking; the code will stop it.

---

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

## 7. The provenance check — the defensible layer

**After every draft, our code — not the model — maps the draft back to what the user said.**

```
1. Split the draft into sentences.
2. Concatenate all user input for this incident (rawAnswers + every user turn) → SOURCE.
3. For each sentence, extract SPECIFIC tokens: numbers, dates, proper nouns, program names,
   dollar amounts, durations. (Stopwords and generic connective language are ignored —
   rephrasing is allowed and expected; that is the assistant's actual job.)
4. If a specific token does not appear in SOURCE → flag the sentence.
5. Flagged sentences render inline in region C with a marker and one line:
      "You didn't mention this — check that it's accurate."
6. SAVE IS BLOCKED while any flag is unconfirmed. The user must either edit the sentence or
   explicitly confirm it. One click, no friction theater — but it must be a click.
```

**Why this matters more than any feature:** they sign an affidavit affirming the packet is
their full and accurate account. If the model puts a sentence in their mouth and they sign it,
the harm is real and it is ours. This is L3 made mechanical instead of hoped. It is also the
single best thing to show a reviewer — it demonstrates we engineered for the liability rather
than shipping the demo.

---

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
