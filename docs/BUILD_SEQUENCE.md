# SurePath — Build Sequence

> Read `CLAUDE.md` first. Then `ARCHITECTURE.md`. This file is the order of operations.
>
> **~11 day sprint. Texas / TDLR only.**

---

## The sequencing decision, and why it's counterintuitive

**Build the document service FIRST — before any UI.**

The instinct is to build the React wizard first, because it's visible and it feels like
progress. That is the wrong call here, for one reason:

> **The document service is the only part of this project that can kill it.**

The UI is a form. Forms are a solved problem. But the packet has to be *byte-correct* on a
government desk: `/Choice3` for parole-yes, county split across two fields on one form and
combined on the other, `zeroAllFields()` or you ship a pre-ticked General Partnership,
`/Sig` untouched, no blanks anywhere. **Every one of those is a silent failure.** Discover a
blocker there on day 8 and you have no sprint left.

So: **Phase 1 produces a complete, correct, mailable packet from a hardcoded fixture, with
no UI at all.** If a `Case` object goes in and a valid PDF comes out, the rest is plumbing
you already know how to write.

---

## PHASE 0 — Day 1 smoke test (BLOCKING)

**Nothing else starts until every line below is green.** These are the assumptions the
entire architecture rests on. Two hours to validate. Do not skip.

```
[ ] Vite + React + TS scaffold runs.
[ ] pdf-lib loads assets/ENF006_blank.pdf IN THE BROWSER (not Node).
[ ] form.getFields() returns 33 fields on ENF006, 24 on ENF003.
[ ] getTextField('Last Name').setText('RIVERA')          → renders.
[ ] getRadioGroup('Are you currently on parole?').select('No')     → ticks.     (ENF006: Yes/No)
[ ] getRadioGroup('#17').select('Choice1')                         → ticks No.  (ENF003: ChoiceN !!)
[ ] getRadioGroup('#17').select('Choice3')                         → ticks Yes. (NOT Choice2)
        ⚠️ NO LEADING SLASH. The map stores '/Choice3' (the true PDF value);
           pdf-lib's select() wants the bare 'Choice3'. Passing the slash THROWS.
[ ] 'Type of Ownership' → leaving it UNSELECTED must CLEAR the group, never select('Off').
        ⚠️ /Off is not an option. select('Off') THROWS. See CLAUDE.md F11.
[ ] form.flatten() succeeds WITH the /Sig field present and does not throw.
[ ] Flattened output renders identically in Chrome preview and in a print preview.
[ ] Blob download works. File opens. Text is burned in, not a live field.
[ ] SSN field is EMPTY in the output.
[ ] /Sig field is UNSIGNED in the output.
```

**If `flatten()` throws on `/Sig`:** remove the signature widget before flattening, or use
`updateFieldAppearances()` + selective flatten. Solve it on **day 1**, not day 8.

**Deliverable:** a single `smoke.ts` that runs all of the above and prints PASS/FAIL.
Commit it. It becomes the regression suite.

---

## PHASE 1 — Document service (Days 1–2) · NO UI

**Goal:** a hardcoded `Case` fixture in → a complete, mailable packet PDF out.

**Fixture:** Marcus Rivera. **3 incidents, 9 convictions.** On probation, not on parole.
Not a business owner. Include a **1998 conviction** (regression guard for D1) and one
**deferred adjudication with no conviction** (D2).

Tasks:
1. Load `data/tdlr_field_map.json`. **It is the source of truth. Do not re-derive field names.**
2. `zeroAllFields(pdf)` — clear `/V` and `/AS` on every field and every kid widget. **(D7)**
3. `fillENF006(case, license)` — applicant + license + **conviction #1**. **(F1)**
4. `fillENF003(case, charge, incident)` — one per conviction 2..N.
5. `tickButtons()` — read export values from the map. **Never hardcode `/Yes`/`/No` for ENF003.** **(F8)**
6. County/state: **split on ENF006, combined on ENF003.** **(F9)**
7. `N/A` into every unused text field. **(F6)**
8. `generateContinuationSheet(incident)` — the self-linking header block.
9. `generateMailingChecklist(packet)` — enumerate every SSN box and every signature line **by item number**.
10. `assemblePacket()` → single Blob.

**Definition of done — these tests are green:**
`A1` (1 × ENF006 + 8 × ENF003) · `A2` (SSN empty) · `A2b` (`/Sig` unsigned) ·
`A4` (1998 conviction survives) · `A5` (deferred adjudication reported) ·
`A11` (no blank text fields) · `A13` (no unintended residual values)

**Then print it.** On paper. Look at it. If a human wouldn't mail it, it isn't done.

---

## PHASE 2 — Intake wizard (Days 3–5)

**The core UI.** Stepper, sticky action bar, `Clear my data & exit` on every screen.

**The stage list:**

> ⚠️ **Correction (2026-07-19).** The flow is **FIVE steps**, not six, and the two
> interstitials are **not separate screens**. "Your trade" collapsed into the `/texas`
> intro page — it was a coverage guard (A14), not a selection step; the real selection
> happens at Licenses. Both interstitials' content ("what this involves", "get your
> record") also lives on `/texas`, before the user enters the application.

```
[1] ABOUT YOU   [2] YOUR RECORD   [3] YOUR STORY   [4] LICENSES   [5] REVIEW & GENERATE
      ↑                                                                    ↓
  /texas (marketing) carries the coverage gate (A14) and the           generate packet
  get-your-record guidance (L9: presented flat, never a lock)
```

**Facts first, stories second.** Stage 3 is a transcription groove — do not interrupt it.
Stage 4 is a **card list with checkmarks**, one story per incident, hard-gated on completion.
See `PRD.md` Stages 4–5 for why (the old design let someone write an arrest's story before
entering all its charges — a real bug, now fixed).

1. **Stage 3 — About you.** Applicant fields. Business branch **hidden by default**.
   **No SSN input exists.** (D3) Copy explaining why, where the SSN would be.
2. **Stage 4 — Your record.** `Incident → Charges`.
   - `+ Add an incident` ("one arrest or event, even if it led to several charges")
   - `+ Add a conviction` within each incident
   - **The inheritance guard**: incident fields read-only on charge cards;
     `exactOffense` and `sentence` **empty, required, no default**. (A12)
   - Always-visible running count: `3 incidents · 9 convictions`
   - **No age filter. No lookback. No "probably too old to matter" hint.** (D1)
3. Persistence: `sessionStorage` (**never `localStorage`** — shared machines) +
   `Save progress` → JSON download + `Resume` → JSON upload.

**Done when:** `A4` `A5` `A9` `A12` green, and a hand-entered 3-incident/9-conviction case
produces the same packet as the Phase 1 fixture.

---

## PHASE 3 — Guidelines data → trade catalog + license selection (Day 6)

The same parsed table feeds **two** screens. Build the data once.

1. Parse the *Criminal Conviction Guidelines* → `data/tdlr_guidelines.json`
   (`license → [{ crimeCategory, tdlrStatedReason }]`). **Deterministic table. No RAG.** (S3)

2. **Stage 1 — trade catalog + coverage gate.** *(Not decoration. A trust gate.)*
   - Searchable list of every TDLR-licensed trade, grouped by industry.
   - Search box: **"What do you want to do?"**
   - Covered → **shortlist** it. Soft. No fee, no commitment, nothing written to a packet.
   - **Not covered** (nurse → Board of Nursing, doctor → TMB) → **say so immediately and
     stop.** Do not walk them into an hour of data entry for the wrong agency. **(A14)**

3. **Stage 6 — selection + guidelines lookup.** Shortlist pre-loaded. For each trade,
   show TDLR's published crime categories and TDLR's stated reason. **Cite. Attribute.
   Do not interpret.**

4. **The honesty banner** (H1/H2), prominent — non-exclusive list, multiple violations
   always reviewed, *this does not tell you what TDLR will decide.*

5. **No screening. No red lights. No "direct recommendation."** TDLR says no crime
   automatically disqualifies, and the Texas CHEL forecloses nothing — **there is
   nothing to warn about and no recommendation to make.** Do not manufacture one. (L1, L2)

6. Running total: `3 trades → 3 packets → 3 separate $10 money orders → $30.`

**Done when:** `A10` and `A14` green. Selecting 3 trades emits 3 correct packets from
Phase 1's service. Searching "nurse" stops the user cold, kindly, in ten seconds.

---

## PHASE 4 — Narrative assistant + LLM proxy (Days 7–8)

The highest-value and highest-risk feature. Read `CLAUDE.md` **L3, L4, L5** before writing a line.

1. **Inline in the incident card.** Not a corner widget.
2. Free text box first. The user can just write. Nothing is forced.
3. **Static coaching copy** below it — the `§53.025(a)` factors, quoted and cited. Plus
   general guidance, clearly marked as general. **Pre-written strings. Not model output.** (L5)
4. Opt-in **"Help me write this"** → the 4 structured prompts
   (facts / why / what changed / what you did to make it right).
5. `/api/narrative` — stateless proxy. **Reject any payload containing an identifier-shaped
   key. Fail closed.** Zero-retention provider config — verify it, record it. Log status only. (D6)
6. **The provenance check.** Map every output sentence back to a span in `rawAnswers`.
   Flag anything that doesn't map. Require explicit confirmation. Show the draft
   **side-by-side with the raw input.** (L3)
7. Style variants only — *shorter / chronological / more detailed*. **Never ranked.** (L4)
8. *(Nice-to-have)* mic button via `SpeechRecognition`. Many users find talking far easier
   than writing. **Cut without regret if the sprint tightens.**

**Done when:** `A3` `A7` `A8` green. And: paste in a self-sabotaging rant
(*"it was mostly my buddy's fault"*) and confirm the tool **does not invent accountability
the user never expressed** — it asks for it.

---

## PHASE 5 — Review + generate (Day 9)

The completeness wall. This is where the product actually earns its keep.

1. **Stage 7 — Review.** The count, large and unmissable:
   > **"You have listed 9 convictions across 3 incidents."**
   > **"Check this against your official criminal history report."**
2. Full list: offense · date · court. *(Not the narratives — the point here is **counting**.)*
3. Warnings (H3/H4): advisory letter · only as good as what you disclosed · a new charge
   changes everything · the real application runs a full DPS/FBI fingerprint check.
4. **Stage 8 — Generate.** Wire Phase 1's service to the real UI. Download the Blob.
5. Checklist reminds them to **delete the PDF from the Downloads folder** on a shared machine.

**Done when:** end-to-end. Landing → download. A real person could mail the result.

---

## PHASE 6 — Content pages (Day 10)

Cheap, high-value, low-risk. Deliberately late — it's writing, not engineering.

1. **Stage 0 — Landing.** Hero, logo, state dropdown. TX live; everything else →
   "not yet supported." *(SVG map is a nice-to-have. Dropdown first.)*
2. **Stage 1 — Texas overview copy.** $10 · 90 days · **advisory, forecloses nothing** ·
   you must disclose your entire record, no matter how old.
   *(The trade catalog + coverage gate on this screen was built in **Phase 3** — it's a
   trust gate, not content. Only the prose lands here.)*
3. **Stage 2 — Get your record** (the hard stop). Texas DPS · **FBI Identity History
   Summary** for out-of-state/federal · call the county clerk (misdemeanors) or district
   clerk (felonies) · what you'll need for every conviction.
4. **Stage 6.5 — Supporting evidence.** ⚠️ **Behind a feature flag** pending
   `OPEN_QUESTIONS.md` Q1. Ships as a checklist if TDLR says yes; as a
   "here's what you'll need later" page if they say no. **One hour either way.**

---

## PHASE 7 — Zero-knowledge escrow (Day 11) · CUTTABLE

`ARCHITECTURE.md` §9.2. WebCrypto PBKDF2 → AES-256-GCM in the browser, `/api/escrow`
forwards **ciphertext only**, passphrase **never transmitted**.

**~1 day.** Not on the demo critical path. **Cut it without regret** if anything slipped —
but keep the design in the architecture doc either way. It's the right answer to the
library-computer user and it's a strong Q&A answer even unbuilt.

---

## Continuous

- **`A6` as a lint rule, from day 1.** Ban `eligible` / `qualify` / `your chances` /
  `likely` in reference to the user. In UI copy, in LLM prompts, in PDF output. **CI-blocking.**
- Re-read `CLAUDE.md` before touching the LLM, the PDF output, storage, or user-facing copy.
- Log TDLR's answers into `OPEN_QUESTIONS.md` the day they arrive.

---

## If you run out of time, cut in this order

1. Escrow email (Phase 7)
2. Voice input
3. SVG map — dropdown is fine
4. Style variants — one draft is fine
5. Stage 6.5 supporting evidence — becomes a static page
6. **Trade count in the demo** — one trade end-to-end beats three half-done

**Never cut the coverage gate (A14).** It is ten lines of code and it is the difference
between respecting someone's time and wasting the hardest hour of their week.

**Never cut:** the document service, the inheritance guard, the provenance check, the
completeness wall, or **any invariant assertion.** Those are the product. Everything else
is decoration.

---

## The demo, in one line

> A man with 3 arrests and 9 convictions sits down, and twenty minutes later he is holding
> a 24-page, correctly-assembled, mail-ready packet — with a checklist telling him the eight
> places to write his SSN and the exact money order to buy.
>
> **By hand that is 228 boxes and nine essays, and if he forgets one conviction the whole
> thing is worthless.**
