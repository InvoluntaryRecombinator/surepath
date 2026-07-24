<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/assets/surepath_logo_white.svg">
  <img src="public/assets/surepath_arrow_s_logo-2.svg" alt="SurePath" width="360">
</picture>

**[surepath.com](https://surepath.com) · Texas is live.**

Find out whether your criminal record will disqualify you from a licensed trade — in
writing, from the licensing board, before you spend a dollar on training.

---

## The problem

Someone with a record who wants a licensed occupation faces a paradox. You can't find out
whether your history disqualifies you until the board reviews it. The board doesn't review
it until you apply. And you can't apply until you've already completed the training — the
hours, the tuition, the exam fees.

So the answer arrives after the money is spent. Most people, reasonably, don't start.

A number of states have recognized this and created a way to ask first: a pre-application
criminal history determination. You petition the board before enrolling in anything, and
they tell you in writing where you stand.

The process is real. It is also paper. In Texas it means a request form, a separate
questionnaire for every conviction and deferred adjudication no matter how old, a written
personal account for each one, a money order, and an envelope. Get one field wrong or
leave one blank and it comes back unprocessed.

The pathway exists. The paperwork is what stops people from using it.

## What SurePath does

Four steps.

1. **Choose your state.** Licensing is state law — every state has its own board, its own
   forms, and its own process. Texas is live today.
2. **Enter your information once.** Identifying details and your full criminal history,
   entered a single time instead of copied across a dozen forms by hand.
3. **Write your account with an assistant.** An interviewer asks about one incident at a
   time and helps you get it down — what happened, why, what has changed since, what you
   did to make it right. It reorganizes your words. It never adds a fact, a feeling, or an
   act of remorse you didn't express.
4. **Get a print-ready packet.** Every form filled and assembled, one packet per license
   type, with a cover sheet listing exactly where to sign, what to enclose, and where to
   mail it. Sign it, stamp it, send it.

![The SurePath landing page](docs/readme/landing.png)

SurePath is a document assembly tool. It does not decide anything, predict anything, or
submit anything. The board issues the determination; SurePath helps you ask correctly.

## How your data is handled

This is the part worth reading if you're evaluating the code.

**No accounts. No database. No server-side persistence.** There is no login, no user
table, no session store. Nothing you type is written to a server we control.

**PDF generation is entirely client-side.** The blank official forms are static assets.
`pdf-lib` fills and flattens them in your browser. The finished packet is produced as a
Blob and downloaded locally — it never transits a server.

**The Social Security Number is never collected.** There is no SSN field in the UI. The
SSN box in every generated PDF is left deliberately empty, and the cover sheet tells you
exactly how many places to hand-write it, in pen. The most sensitive field in the packet
is the one the application never touches.

Work is saved to your own device, so a stray tab-close doesn't destroy an hour of typing,
and there's a prominent control to erase it. You can also export a progress file and carry
it to another machine yourself.

### The one server call

The narrative assistant is the only network request that carries anything you typed. Here
is what it contains, in full:

| Sent | Not sent |
| --- | --- |
| State ("Texas") | Name, date of birth, SSN, address, phone, email |
| Year of the events, year resolved | Exact dates (day and month) |
| The charges — offense, sentence, disposition | County, court |
| The conversation itself | Any other incident |

Three things enforce that, at different layers:

1. **The context builder never receives identity.** `buildNarrativeContext` takes the
   incident, not the applicant. The function has no access to the fields it isn't supposed
   to send — it can't leak what it was never handed.
2. **A server-side guard rejects identifier-shaped payloads.** Every request body is
   scanned for identity-shaped keys before the model is called; a match returns 400. It
   never fires today, which is the point — it's a tripwire against a future refactor
   quietly wiring the applicant in.
3. **A test asserts the absence.** The serialized payload is grepped in CI for county,
   court name, and full dates. The minimization is an invariant the build enforces, not an
   intention someone has to remember.

Exact dates and the county still exist — they're collected, stored on your device, and
printed onto the forms where TDLR requires them. They just never go over the wire, because
county + court + exact date + offense is a tuple that maps onto public court records, and
the model doesn't need any of it to help you write.

### What this is not

It is data minimization, not anonymization, and the difference matters. A first-person
account of your own conviction is identifying on its own — no amount of field-stripping
changes that. So the honest claim is the narrow one:

> Identity fields never leave your browser. The one server call carries the charge, the
> state, the year, and your own account — no name, no contact information, no SSN, no
> county, no court, no exact dates. None of it is stored by us.

Every clause there maps to a line of code, and any user can verify it in their own
browser's network tab. That's why the claim is worded that way and not more strongly.

## Constraints the code is built around

These are enforced as invariants, not preferences. The full set lives in `CLAUDE.md`.

**Never assert eligibility.** Not in copy, not in the model's output, not in a tooltip.
SurePath doesn't tell anyone they're likely to be approved, likely to be denied, or that
they have a strong case. It doesn't know, and claiming to would be both legal advice and a
lie the person carries into a signed document.

**No auto-disqualifier.** TDLR states plainly that no specific crime results in automatic
denial. The application therefore has no basis to screen anyone out, and doesn't.

**The model may not introduce propositions.** Every factual claim, characterization, and
statement of feeling in generated text must trace back to something the person typed. The
model reorganizes and raises register — "meth" becomes "methamphetamine" — but it never
softens a fact into a euphemism and never writes remorse that wasn't expressed. The person
signs this affirming it's their full and accurate account; words in their mouth are a real
harm.

**Every conviction is reported, with no lookback window.** Texas requires all convictions
and deferred adjudications regardless of age. There is no filter, no "probably too old to
matter" hint, no toggle. An omitted conviction voids the letter — the real license
application runs a full fingerprint check and finds the gap — which would cause exactly
the harm the product exists to prevent.

**Nothing is submitted or signed on anyone's behalf.** Both forms carry cryptographic
signature fields. They are never populated. Wet ink, their hand, every time.

## Technical architecture

For engineers reading the code. Every file and number below is checkable against the repo.

### The AcroForm mapping problem

The two TDLR forms are AcroForm PDFs — 33 fields on ENF006 (32 fillable plus one `/Sig`),
24 on ENF003 (23 plus `/Sig`) — filled by **field name**, not coordinate stamping. That
sounds like the easy path until you meet ENF003's names, which were auto-derived from
nearby label text by whatever tool built the form. The SSN field is literally named:

```
See instruction sheet for disclosure information
```

and the email field is named `ex johndoeaolcom See instruction sheet for disclosure
information` (`src/states/texas/documents/fieldMap.ts:86-90`). Names like that cannot be
guessed from documentation; the map was built by probing the authoritative blanks —
enumerating every field, its type, its export values, and its widget rectangles in the
browser — and the result lives as data in `data/states/texas/tdlr_field_map.json` with
every trap annotated, mirrored as typed constants in `fieldMap.ts`.

The two forms also use incompatible checkbox conventions. ENF006 uses semantic export
values: `/Yes` and `/No` for parole and probation, `/Male` / `/Female`, real names for
ownership types. ENF003 uses `/ChoiceN` — non-sequentially:

```ts
typeOfRequest:   { new: '/Choice1', renewal: '/Choice2' }
renewalQuestion: { no:  '/Choice1', yes: '/Choice2' }   // item 16
parole:          { no:  '/Choice3', yes: '/Choice1' }   // item 17
probation:       { no:  '/Choice2', yes: '/Choice1' }   // item 18
```

`/Choice1` means *yes* on item 17 and *no* on item 16, within the same form. The number
carries no meaning, and the code never reasons from it — every tick routes through one
`tickButton` primitive (`pdfPrimitives.ts:129`) that selects by mapped value and reads it
back. Its counterpart `clearButton` exists because `/Off` is not a selectable option in
any radio group: leaving "Type of Ownership" unset means *clearing* it, and calling
`select('Off')` throws.

### The bug no test could catch

The parole and probation export values were inverted in the field map. Every check was
green: pdf-lib validated the export values and read them back, the generated PDF was
well-formed, and the residue assertion confirmed the packet held exactly the values the
app intended to write — because the app intended the wrong ones. The error was in the
ground truth the tests were written from, so no test written from that ground truth could
see it.

What it produced: for a person not on parole and on probation, a packet that ticked "Yes,
I am on parole" and "No, I am not on probation" — both backwards, on a form signed under
penalty of administrative sanction as a full and accurate account.

It was found two ways, neither of them a unit test: re-deriving the values from the widget
*rectangle geometry* on the authoritative blank ("No" is the left box — the map's comment
block at `fieldMap.ts:126-127` preserves the coordinates), and printing the page and
looking at it. A print-and-look step is now a required phase gate in
`docs/BUILD_SEQUENCE.md`, because it is the only control that can catch a lie the entire
system agrees on.

### Template hygiene

A field you don't explicitly write keeps whatever the template had. The forms originally
supplied to the project were not blank — they carried test data, `/General Partnership`
ticked on ENF006, and `Type of Request = Renewal` ticked on ENF003. Built on naively, the
packet would have asserted, on a signed government form, that the applicant was a general
partnership renewing a license.

So `zeroAllFields` (`pdfPrimitives.ts:56`) runs before a single write
(`fillForms.ts:170`), deleting `/V` on every field **and** `/AS` on every kid widget.
Both, because they are different things — `/V` is the value, `/AS` is the appearance state
that actually renders the tick. Clear only `/V` and you can ship a form whose value reads
`/Off` while the printed page still shows a mark. After assembly, `verifyPacket.ts`
re-reads the finished bytes and asserts no field holds a value the app didn't intend.

### The agent boundary

One serverless function, stateless, shared verbatim between the Vercel adapter and the
Vite dev middleware so dev and prod can't drift (`src/agent/server.ts`).

The request is built by `buildNarrativeContext` (`src/agent/context.ts`) — state, the two
years, the incident's charges, the person's structured answers, and the account as it
stands. The model must return a structured `AgentTurn` (`src/agent/turns.ts`):

```ts
{ reply, stages: { what, why, changed, right }   // each: empty | thin | covered
, ownership: 'takes_responsibility' | 'partial' | 'deflecting'
, readyToDraft, followUp: { question, reason, stage } | null
, nudge: { factor, text } | null, draft: string | null }
```

The model proposes; the client machine disposes (`src/agent/machine.ts`): stage coverage
is re-reported wholesale every turn and rendered as the progress strip, a volunteered
draft is accepted only when the gate is satisfied, each optional-topic nudge fires at most
once ever, and all drafting policy lives in one pure function the UI consults after every
turn.

Generated text passes through mechanical guards in `server.ts` before it renders:
`draftGuardViolations` flags any distinctive charge-line token in the draft that the
person never said (quoting the charge name is exempt; register-raising like "meth" →
"methamphetamine" is stem-matched and allowed; "hydrocodone" appearing when they only ever
said "stuff" is not), and flags conviction language when no charge in the incident is a
conviction. A violation retries once with the correction attached, then fails closed to
the manual writing path. `stripPromptExamples` removes any verbatim occurrence of the
prompt's own illustration sentences from visible output — models tail-quote them — and
`outcomeLanguageViolations` (`turns.ts`) rejects outcome talk ("eligible", "your
chances") in the model's voice at the server, mechanically.

### The state chassis

`src/states/texas/` contains everything Texas: the config (`config.ts` — section copy,
fee, the 41-program list, the §53.025(a) factors quote, the ownership-check copy, form
template names), the document service (`documents/` — field map, fill, plan, verify), and
the state's marketing page. The machinery around it is state-agnostic: the store,
sections UI, and validation in `src/app/` render exclusively from the `StateConfig`
contract (`src/state-config/types.ts`), and the agent prompt contains no state text at
all — the statute quote arrives per-request in the payload's `guidance` block, injected
by the client from config.

A new state is therefore a config file, its data files (`data/states/<code>/`), and a
document adapter for its forms — not a rewrite. The enforcement is the contract type plus
a working rule: no agency name, statute, or form number appears as a literal in a shared
component.

### One computed source for the packet and its checklist

`packetPlan.ts` derives everything downstream from the case: the document list (N charges
⟹ 1 × ENF006 + N−1 × ENF003, with questionnaire ordinals), per-document page counts,
narrative continuation-sheet references, and the exact hand-write locations — SSN and
signature, by document, page, and item number. `assemblePacket.ts` fills the forms from
that plan, and `generatedPages.ts` renders the cover sheet and mailing checklist from the
*same* plan. The checklist can't drift from the packet behind it because neither is
written by hand — both are projections of one computed structure.

### Testing

137 assertions across 8 files, and the interesting ones run against real PDF bytes, not
mocks:

- **The leak test** (`tests/agentContext.test.ts`) serializes the entire agent payload and
  greps it for the fixture's actual identifiers — name, DOB, address, phone, email — and
  asserts the *absence* of county, court, and full dates. The minimization is CI-enforced.
- **The set-equality check** (`tests/convertDraft.test.ts`):
  `expect(new Set(inCase)).toEqual(new Set(inDraft))` — no charge is dropped, reordered
  away, or filtered on conversion. Paired with A4 in `tests/invariants.test.ts`, which
  follows a 1998 conviction from the case through the packet plan into the generated PDF
  bytes.
- **A2** (`tests/invariants.test.ts:53`) asserts the SSN field is empty and the `/Sig`
  field unsigned in every generated document — and that the SSN field name the app refuses
  to write is the one actually present on the form.
- **A13** re-reads the assembled packet and asserts zero residue — no field holds a value
  the app didn't write — which is the test that would have caught the dirty templates.
- The machine suite covers the conversation gates: the ownership check fires once per
  incident and never blocks, a stripped deflecting draft, skip waivers, the turn cap.
  The server suite proves fail-closed behavior with an injected generator — no network,
  no key.

---

## About this repository

This repository is public so it can be read and evaluated. It is not an open-source
project and is not licensed for reuse or redistribution.

The application is live at **[surepath.com](https://surepath.com)** — that's the intended
way to see it work. The code is here to be read, not deployed.

Built with Vite, React, TypeScript, and Tailwind. PDF generation runs client-side on
`pdf-lib`. One serverless function proxies the narrative model. No database, no auth, no
ORM, no vector store — the TDLR conviction guidelines are a structured table, parsed to
JSON once and looked up deterministically, because adding retrieval would put a
hallucination surface on a lookup that's currently exact.

The state model is data-driven: a new state is a config file — its forms, field map,
license list, and published guidance — not a rewrite. Texas lives in
`src/states/texas/`; the chassis around it is state-agnostic.

© 2026. All rights reserved.
