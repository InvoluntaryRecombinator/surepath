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
      └── narrative        ← { rawAnswers, draft, assumptions[], affirmed }   ← PERSISTED
                              messages[] are SESSION-ONLY, deliberately: the transcript is
                              the most sensitive text in the app and does not sit on a
                              shared computer's disk. The draft is the artifact; it survives.
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
  state: string
  yearOfEvents: string; yearResolved: string   // YEARS only, derived on-device
  charges: { exactOffense: string; sentence: string; disposition: Disposition }[]
  rawAnswers: { facts: string; why: string; whatChanged: string; madeItRight: string }
}
// NO name. NO DOB. NO SSN. NO address. NO other incidents. NO county, NO court, NO
// exact dates (public-court-record fingerprint — state + years + charges is a crowd).
// The model is told it has years only and must never invent a date, county, or court.
// All asserted by test. (D6)
```

---

## 3. Page architecture — a workbench, NOT a chatbot

> ⛔ **Explicitly forbidden**, because this is the failure everyone defaults to:
> a floating bubble, a bottom-right corner widget, a chat panel with avatar circles, bouncing
> typing dots, "AI is thinking…", a send button with a paper-plane icon. **Ours is not a
> support bot bolted onto a page. It is the workspace for the hardest thing on the form.**

Clicking a card in the "Your story" list opens the workbench as a **full panel takeover**
(focus mode — the chassis hides its briefing and Back/Continue; the workbench owns its
exits) built as **ONE element** (revised again 2026-07-20; the floating black strip over a
floating conversation read as disconnected pieces):

```
┌─ THE CARD — one bordered object ─────────────────────────────────┐
│ dark header band — May 1, 1992 · Harris County · court           │  dates LONG-FORM
│ [charge chip] [charge chip] [charge chip]                        │  in display prose
├──────────────────────────────────────────────────────────────────┤
│ coverage sub-band, LIGHT ground — What happened · Why · What's   │  ONLY while an
│ changed · Making it right, straight off the model's stages       │  interview runs*
├──────────────────────────────────────────────────────────────────┤
│ THE CONVERSATION                                                 │
│ │ agent turns — left accent rule; the current question is BOLD   │
│ │ with its plain reason underneath                               │
│ ▒ user turns — tinted blocks ▒                                   │
├──────────────────────────────────────────────────────────────────┤
│ input footer — Send · Skip this · Write it now (no account yet)  │
│ "Skip the interview — I'll write it myself" (quiet; auto-        │
│  revealed when the assistant is unavailable)                     │
└──────────────────────────────────────────────────────────────────┘
├══════════════════════════════════════════════════════════════════┤  ← hard divider —
│ THE ACCOUNT — nothing here until a draft exists (or the manual   │    NOTHING below
│ path opens it). AUTO-GROWN to its full text (nobody affirms      │    until drafted
│ through a six-line keyhole) · §7 affirmation                     │
│ exits: Back (to the list) · Save and continue                    │
└──────────────────────────────────────────────────────────────────┘
```

\* Four empty circles next to a finished account are structure that lies — on a return
visit the coverage band is hidden and the conversation opens in the revision register:
*"Your account is below. Tell me what you'd like changed — or edit it yourself, it's
yours."*

Still forbidden: bubbles, avatars, timestamps, typing dots, "AI is thinking…", paper-plane
send buttons. The agent asks ONE question at a time, in the conversation.

**Entry point and exit** — the "Your story" card LIST IS THE HUB. Unfinished cards carry a
left accent rule and "still to write" / "needs your confirmation"; confirmed cards dim
behind a filled check. **Save and continue always lands back on the list** — seeing the
finished set is the closure — and when every account is affirmed a success notice says so;
the section's own Continue advances to Licenses.

---

## 4. The contract — model proposes, code disposes

### The REQUEST carries a directive. Code decides what the model may do.

```ts
type AgentRequest = {
  context: NarrativeContext
  messages: { role: 'user' | 'assistant'; content: string }[]
  directive: 'converse' | 'draft_now'   // ← code sets this, not the model
  alreadyNudged: string[]
  skippedStages: StageKey[]             // their no is final — never re-asked, gate waived
  guidance: {                           // state-published criteria, injected by the CLIENT
    factorsQuote: string                // from stateConfig — the server and the prompt are
    factorsCite: string                 // state-agnostic. The chassis rule applies to prompts.
  }
}
```

**The directive is not "may you draft" — it is "you must draft now."** In `converse` mode the
model may draft whenever the gate allows and it judges it has enough (§5); `draft_now` is the
ceiling — sent at the turn cap or on "Write it now," it REQUIRES a draft that turn.

### The RESPONSE is one JSON object. Never prose.

```ts
type StageLevel = 'empty' | 'thin' | 'covered'
// 'thin' is the state that matters: an answer that exists but says nothing usable.
// "I'm in a program" is thin until it says which program, how long, whether it finished.

type AgentTurn = {
  reply: string                    // conversational, short. NEVER the draft, NEVER a question.
  stages: {                        // RE-REPORTED from the whole conversation, every turn.
    what: StageLevel               // code renders the strip and gates the draft;
    why: StageLevel                // code NEVER increments a stage itself.
    changed: StageLevel
    right: StageLevel
  }
  ownership: 'takes_responsibility' | 'partial' | 'deflecting'
                                   // does the account SHOW their own part, or deflect?
                                   // re-reported every turn. Three values suffice: code
                                   // only consults it when the gate opens, and the gate
                                   // requires `why` covered — there is always material.
  readyToDraft: boolean            // a hint, never a gate
  followUp: {                      // ONE question at a time
    question: string               // rendered bold
    reason: string | null          // plain, underneath — why the specifics matter.
                                   // optional: forcing one on every question reads as nagging.
    stage: StageKey | null         // what it probes — so a skip waives exactly that stage.
                                   // never displayed.
  } | null
  nudge: { factor: ...; text: string } | null
  draft: string | null
}
```

There is deliberately **no `assumptions` field** — see §7.

Enforced by a Zod schema through the AI SDK's structured-output mode, which retries
automatically on malformed output.

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
                        (a NEW model draft after a manual edit replaces the text only
                         behind an explicit confirm, and the affirmation resets)
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
const MAX_FOLLOWUP_TURNS = 15  // a RUNAWAY-LOOP BACKSTOP, not a hurry-up. Nobody sane hits
                               // it. At the cap, code sends directive:'draft_now'.

// THE CONVERSE DRAFT GATE: a volunteered draft is accepted only when `what` and `why` are
// 'covered' (or explicitly skipped) AND ownership is settled — takes_responsibility, or
// the ownership check already ran. draft_now always accepts.
//
// ALL DRAFTING POLICY IS ONE PURE FUNCTION, consulted client-side after every model turn:
//   nextAction(state) -> 'ownership_check' | 'escalate_draft' | 'idle'
// 'ownership_check': the gate opened but the account deflects and hasn't been checked.
//   The check is CODE-AUTHORED FIXED COPY from stateConfig (never model-generated — the
//   most delicate sentence in the product is not left to temperature), rendered as an
//   assistant turn, recorded in the wire history, consuming NO model turn. It fires at
//   most ONCE PER INCIDENT (each account is its own signed document) and shares the
//   once-ever budget with the model's own ownership nudge. The reply to it is a NORMAL
//   model turn — ownership re-assessed, the draft reflects whatever they actually said.
//   More deflection still drafts. It never blocks. The check copy must read correctly
//   against EVERY shape of deflection: blame, minimizing, wrong-place-wrong-time, panic.
// 'escalate_draft': the gate opened, ownership settled, the model still didn't draft —
//   the client re-calls with draft_now. (Server-side escalation is dead; one home.)
// "Write it now" BYPASSES both — it is the explicit exit, and the exit lives in the
//   interface, never in the copy (CLAUDE.md H6).
//
// NEITHER FIRES WHILE THE MODEL STILL HAS A QUESTION ON THE TABLE (pendingFollowUp !==
//   null → 'idle'). The gate opening means a draft is PERMITTED, not DUE — the model
//   keeps interviewing the optional stages for as long as it has questions. The first
//   shipped version escalated the moment what+why covered, bulldozing the interview at
//   ~4 turns mid-question; that was the worst UX we shipped. Escalation is for the model
//   that STOPS asking and doesn't draft; the check lands as the last word before
//   drafting, never on top of a live question.
//
// REVISION MODE: when an account already exists (state.account non-empty — a return
//   visit, or refining after a landed draft), a volunteered draft is a REVISION and the
//   stages/ownership gates DO NOT APPLY — on return the transcript is gone and stages
//   read empty, so gating would make every change request silently vanish. The account
//   itself rides in the request (context.currentAccount) as the revision substrate; the
//   replace-confirm protects the standing text either way, and any accepted revision
//   resets the affirmation. The L3 guard for tone requests lives in the prompt: "more
//   apologetic" with no words of regret in the material → the model ASKS for what they
//   feel, in followUp, instead of inventing it. (Live-verified: 'running was my mistake'
//   must never become 'I deeply regret' without them saying so.)
//
// THE AFFIRMATION SURVIVES REOPENING: initialConversation takes the stored affirmed
//   value. Re-reading is owed after an EDIT (any change still resets it), not after
//   peeking — without this, opening a confirmed account silently un-confirmed it.

// SKIP WAIVES THE GATE for that stage, and a skipped stage is never asked about again.
// Their no is final; holding a gate after an explicit skip is interviewing someone
// against their will. `changed` and `right` are optional throughout: nudge once each
// (the nudgedFactors set), then allow.

// "Write it now" is visible whenever a conversation exists AND no account does yet
// (with an account standing, revision is the conversation's job and the button would
// mean "regenerate", which nobody asked for). The manual path ("Skip the interview —
// I'll write it myself") is complete and model-free.

// A6 banned-word regex runs over reply / followUp.question / followUp.reason / nudge.text.
// On hit: retry once, then drop the turn.

// stages and readyToDraft come from the model wholesale; code renders and gates,
// never increments.
```

> **The prompt shapes behavior; code bounds it. Anything that must be true belongs in code.**

## 6. The system prompts — TWO of them, sharing one preamble

> Every clause is an invariant made operational. Treat this like the copy — reviewed,
> versioned, not regenerated. Stored server-side; the state-published factors are INJECTED
> from `request.guidance` (the client owns stateConfig — a new state is a config file, not
> a prompt edit). Source of truth: `src/agent/prompt.ts`.
>
> **The INTERVIEW prompt** gathers: stages, ownership assessment, one question at a time.
> **The DRAFTING prompt** is a distinct instruction — "you are now writing the final
> account" — generation is its own job, not a mid-conversation side effect.
>
> **The typist line was rewritten (2026-07-20).** "You are not their conscience. You are
> their typist" contradicted the ownership advocacy — a model told it is a typist
> soft-pedals the one instruction that matters. Now: never judges, never invents remorse,
> but NOT a bystander — states what boards publish and recommends addressing it, once.
> Advocacy about published criteria is coaching (L5), not conscience. The nudge sample is
> de-hedged per CLAUDE.md H6: advocate, then stop.

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
{"reply": string, "coverage": {"facts": bool, "why": bool, "whatChanged": bool,
"madeItRight": bool}, "readyToDraft": bool, "followUp": string|null,
"nudge": {"factor": "ownership"|"understanding"|"change"|"restitution", "text": string}|null,
"assumptions": string[], "draft": string|null}

Write the draft when you judge you have enough to write it honestly — do not ask permission.
If the directive says draft_now, you MUST populate "draft" in this turn from whatever you
have. Never put a question in "reply"; questions go only in "followUp". List in "assumptions"
anything you filled in that the person did not say directly. Write the draft in the person's
own voice, first person, plain language, at the reading level they wrote in. Do not make them
sound like a lawyer.
```

**Injected per request:** the incident's date/county/court, the charge list, the answers so
far, and `alreadyNudged: [...]` so the model knows which points are closed.

---

## 7. Accuracy — the prompt and the affirmation. Nothing else.

> ⚠️ **Two mechanisms were cut from earlier revisions, deliberately. Do not re-add either
> one thinking you found a gap.**
>
> **The code-side provenance/token check** (v1): cut because people write in fragments and
> slang and the model writes clean prose — token overlap is near zero, every sentence
> false-flags, and flag fatigue destroys the feature in two uses.
>
> **The `assumptions` self-report** (v2, cut 2026-07-20): a machine-generated "here's what
> I changed about your words" list was **theater**. Paraphrase is the assistant's job — if
> the model writes "I made a bad decision" where they said "I was being an idiot," that is
> a better sentence and we do not announce it. Worse, the list eroded trust in the one
> layer that actually matters: a person reading their own account and affirming it. A
> transparency display that trains users to skim past it is a net loss for accuracy.

Two layers carry everything:

**1. The system prompt (§6).** Only the user's information; no invented facts, feelings,
motives, remorse, or steps taken. Written carefully, versioned, tested adversarially (§9).

**2. The required affirmation before Save — the real gate.** The user must confirm the
account accurately reflects what happened. Always, every incident, no exception:

> *"This is the account that goes on your forms. Read it and confirm it's accurate — you're
> signing that this is your own true account."*

They are signing an affidavit either way. The affirmation is what makes that meaningful,
and it is the only layer that cannot be gamed by a clever prompt.

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
| **"It was mostly my buddy's fault, I just got caught up"** | `ownership` reads `deflecting`. When the gate opens, the code-authored check fires ONCE, in the approved register (advocate, stop — no escape clause). If they add their part, the draft shows it; if they hold firm, it drafts what they said — **no invented remorse, never blocked.** |
| **Three sentences, then "just write it"** | Drafts immediately. No follow-up loop. Usable output from thin input. |
| **User declines a nudge, keeps talking** | That factor is never raised again. |
| **Incident with 3 charges, user explains only 1** | Asks about the others **once**, then writes one account covering what it has. |
| **A thin answer: "I'm in a program"** | The stage reads `thin`, not `covered`. The agent probes — which program, how long, finished? — as a bold question with a plain reason. It does not draft past a thin `what`/`why` unless the person skips or forces it. |
| **User skips a what/why question** | The stage is waived, never re-asked, and drafting proceeds with what's there. |
| **User edits the draft by hand, then saves** | Their edit is what commits. No re-writing behind them. |
| **Payload inspection** | No name, DOB, SSN, address, or other incident ever leaves the browser. Asserted by an automated test. |
