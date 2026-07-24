# SurePath — Architecture

> Read `CLAUDE.md` first. It is the constitution. This document says *how*; that one
> says *what must never happen*. Where they conflict, `CLAUDE.md` wins.

---

## 1. Principles

Every principle below is downstream of an invariant. They are not style preferences.

| Principle | From |
|---|---|
| **The browser is the trust boundary.** Identity data is born, lives, and dies in the tab. | D3, D5 |
| **The server is stateless and blind.** Two functions. No database. Neither can read what it handles. | D4, D6 |
| **The document pipeline is deterministic.** Same input → same bytes. No model anywhere near it. | F2, L3 |
| **Everything the state publishes is data, not prose.** Guidelines are a table. Statutes are citations. | S3 |
| **The model reorganizes; it never asserts.** | L3, L4 |
| **Every claim is checkable.** If we say it, a test asserts it. | §11 |

---

## 2. System shape

```
┌─────────────────────────────── BROWSER (trust boundary) ────────────────────────────────┐
│                                                                                          │
│   React SPA                                                                              │
│   ├── Intake wizard        (stages 0–7)                                                  │
│   ├── Case state           incidents[] → charges[]   ← never leaves the tab in plaintext │
│   ├── Guidelines lookup    static JSON, deterministic                                    │
│   ├── Document service     pdf-lib: zero → fill → tick → flatten → assemble              │
│   └── Crypto              WebCrypto: PBKDF2 → AES-256-GCM (escrow only)                  │
│                                                                                          │
└───────┬──────────────────────────────────────────────────────────┬───────────────────────┘
        │                                                          │
        │ narrative text ONLY                                      │ ciphertext ONLY
        │ (no name/DOB/SSN/address)                                │ + destination email
        ▼                                                          ▼
   ┌─────────────────┐                                    ┌──────────────────┐
   │  /api/narrative │  stateless LLM proxy               │   /api/escrow    │  stateless relay
   │  zero-retention │  ──► model provider                │   no logging     │  ──► SMTP
   └─────────────────┘                                    └──────────────────┘
        NO DATABASE.  NO PERSISTENCE.  NEITHER FUNCTION CAN READ A NAME.

   OUTPUT ──►  packet.pdf   (downloaded locally, never uploaded)
```

**That is the entire backend.** Two functions. If you find yourself adding a third, or a
data store, stop and re-read `CLAUDE.md` D4.

---

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React + Vite + TypeScript** | Types matter here — a swapped date field is a silent, unrecoverable bug. |
| Styling | Tailwind | Fast. Not the point. |
| PDF | **pdf-lib** (browser) | Isomorphic, AcroForm fill by name, `flatten()`. Runs client-side — that's the whole security model. |
| Crypto | **WebCrypto** (native) | No dependency. PBKDF2 + AES-GCM. |
| Backend | Two serverless functions (Vercel/Netlify/Workers) | Stateless. No server to own, no DB to breach. |
| State | React context + reducer | No Redux. The case tree is small. |
| Tests | Vitest | The invariant assertions in §11 are the tests that matter. |

**No database. No ORM. No auth library. No vector store. No RAG.** If a dependency implies
persistence or retrieval, it is wrong for this project.

---

## 4. Data model

The whole product is this tree. Get it right and everything else follows.

```ts
type Case = {
  applicant: Applicant;
  incidents: Incident[];        // one per ARREST EVENT
  licenses: LicenseSelection[]; // late-binding; chosen AFTER the record
  supportingEvidence?: SupportingEvidence;  // ⚠️ NO UI YET. See below.
  version: 1;
};

type Applicant = {
  lastName: string; firstName: string; middleName: string; suffix: string;
  allKnownNames: string;        // maiden, alias, nickname
  dob: string;                  // MM/DD/YYYY
  gender: 'male' | 'female';
  mailingAddress: string;
  phone: string;
  email: string;

  // SSN IS ABSENT BY DESIGN. There is no field. Do not add one. (D3)

  isControllingPerson: boolean; // default FALSE -> business branch hidden
  business?: { companyName: string; dba: string; federalTaxId: string;
               ownershipType: 'general_partnership'|'sole_proprietor'|'corporation'|'llc'|'llp' };

  onParole: boolean;    paroleOfficer?:    { name: string; phone: string };
  onProbation: boolean; probationOfficer?: { name: string; phone: string };
};

type Incident = {
  id: string;
  county: string;               // "Harris"  (ENF006 splits; ENF003 combines. See F9.)
  state: string;                // "Texas"
  court: string;                // "178th District Court"
  dateCrimeCommitted: string;   // MM/DD/YYYY
  dateOfConviction: string;     // MM/DD/YYYY
  narrative: Narrative;         // ONE story per event -> ONE continuation sheet
  charges: Charge[];            // 1..n convictions from this single event
};

type Charge = {
  id: string;
  exactOffense: string;   // REQUIRED. No default. No pre-fill. No inherit. (A12)
  sentence: string;       // REQUIRED. Same.
  // NOTHING ELSE. These are the ONLY two charge-unique fields on the entire packet.
};

type Narrative = {
  rawAnswers: { facts: string; why: string; whatChanged: string; madeItRight: string };
  draft: string;          // model output OR the user's own writing
  edited: boolean;
  provenance: ProvenanceFlag[];  // sentences in `draft` not traceable to rawAnswers (L3)
};

type LicenseSelection = { program: string; specificLicenseType: string }; // one packet + one $10 each

// ⚠️ OPTIONAL. NO UI IN THE MVP. The field exists NOW, on purpose.
// OPEN_QUESTIONS Q1 (can rehab evidence ride along with a CHEL request?) is pending TDLR.
// Adding the field today costs nothing and means that when they answer, you add a SCREEN --
// not a schema migration that breaks every saved progress file already on users' disks.
type SupportingEvidence = {
  employmentProof?: string[]; recommendationLetters?: string[];
  restitutionPaid?: boolean;  programCompletions?: string[];
};
```

### Two doors. One structure.

The UI offers **two** ways in:

```
+ Add an incident        →  "one arrest or event that led to several charges"
+ Add a single charge    →  "one conviction, on its own"
```

**A standalone charge IS an incident with exactly one charge.** Same type, same tree, same
PDF loop. There is no second code path and no `standaloneCharges[]` array.

The UI never says "an incident with one charge" — that's our word, not theirs. It just says
*a single charge*, opens the same card with the incident fields inline, and moves on. **Two
doors into one room.**

### Strict about completeness. Forgiving about precision.

These are **not the same thing**, and conflating them will make the product hostile.

| | Rule |
|---|---|
| **Completeness** | **HARD.** You cannot skip a conviction. The count reconciliation at Stage 7 is a wall. An omitted conviction voids the letter — TDLR runs a full DPS/FBI fingerprint check at the real application and finds it. **This is the failure the product exists to prevent.** |
| **Precision** | **SOFT.** People genuinely do not remember which of Harris County's courts heard a case in 2011. **Never block on a court name.** Accept "Harris County — court unknown." Populate the field with what they know. |

**Why this asymmetry is correct:** TDLR does not use the applicant's clerical details to
*find* their crimes — they find the crimes with their own tools. What sinks a person is a
conviction they **didn't disclose**, not a court name they got slightly wrong.

> **But do not put that in the UI.** The interface **encourages accuracy and permits
> uncertainty.** It never *invites* imprecision, never says "close enough," and never
> implies the details don't matter. It just doesn't hold someone hostage over a detail they
> cannot possibly retrieve. **Design permits it. Copy never invites it.**

### Why `Incident → Charge`

One arrest routinely produces 4–6 convictions sharing a county, a court, a date, and a
story. The packet requires **one questionnaire per conviction** (F1) — but only
**`exactOffense` and `sentence`** actually differ between them.

Modeling charges flat would force the user to retype the county, court, and both dates for
every charge, and to write the same essay four times. Modeling incident-first means:

> **4 incidents, 12 convictions → ~43 field entries and 4 narratives.**
> By hand: **~228 field entries and 12 narratives.**

That arithmetic is the product.

### The inheritance guard (mandatory)

Charge cards render inherited incident fields **read-only**, with an explicit
*"inherited from Incident 2 — edit"* affordance. `exactOffense` and `sentence` render
**empty, required, no default, no placeholder value**. The user cannot advance a charge
without typing that charge's own offense name.

> This makes the failure mode we most fear — over-populating charge documents with
> incident-level data and silently losing charge-specific detail — **structurally
> impossible**, not merely unlikely.

If sentences genuinely were concurrent, offer a *"same as the other charges in this
incident"* tick — an **explicit affirmative act**, never a silent inherit.

**No lookback filter. No age-based hiding. Ever.** (D1)

---

## 5. Persistence — three tiers, no database

| Tier | Mechanism | Threat handled |
|---|---|---|
| **In-session** | React state + `sessionStorage` | Nuked when the tab closes. Safe on a shared terminal. **Never `localStorage`.** (D4) |
| **Take it with you** | `Save progress` → downloads `surepath-progress.json` | User owns the file. Nothing on our servers. Default path. |
| **Public-terminal escrow** | `Email me my progress` → **client-side encrypted** | The library user with no USB stick and no account. See §9. |

Plus a **`Clear my data & exit`** button on every screen — big, red, always visible.

⚠️ **The generated PDF lands in the Downloads folder and `Clear my data` does not touch it.**
The mailing checklist must tell the user to delete it after printing on a shared machine.

---

## 6. The document service

The core. **Deterministic. No model. No network.** Build it *first* (see `BUILD_SEQUENCE.md`).

### 6.1 The pipeline

```
For each selected license:

  loadTemplate(ENF006_blank.pdf)          // static asset, fresh from tdlr.texas.gov
    │
    ├── zeroAllFields()                   // D7 — MANDATORY. Never trust the template.
    ├── fillByName(applicant + license)
    ├── fillByName(incident[0].charges[0]) // ENF006 CARRIES CONVICTION #1  (F1)
    ├── tickButtons(gender, parole, probation, ownership)   // /Yes | /No   (F8)
    ├── setNarrativeRef("SEE ATTACHED CONTINUATION SHEET — INCIDENT 1 OF n")
    └── flatten()                         // burn text in. /Sig field untouched. (L6)

  For conviction 2..N:
    loadTemplate(ENF003_blank.pdf)
      ├── zeroAllFields()
      ├── fillByName(applicant + this charge + its incident)
      ├── tickButtons(typeOfRequest=/Choice1, #16, #17, #18)  // /ChoiceN !! (F8)
      └── flatten()

  generateContinuationSheets()            // one per incident
  generateMailingChecklist()              // page 1 — DO NOT MAIL

  assemble: [ checklist, ENF006(2pp), ENF003 × (N−1), continuation sheets ]
    ──► single Blob ──► local download
```

### 6.2 Rules that are not negotiable

1. **`zeroAllFields()` runs first, every time.** Clear `/V` and `/AS` on every field and
   every kid widget. **A field you don't write keeps whatever the template had.** This
   already bit us once — the original templates shipped with `/General Partnership` and
   `Renewal` pre-ticked. (D7)
2. **Never write the SSN field.** `Social Security Number` (ENF006) /
   `See instruction sheet for disclosure information` (ENF003). (D3)
3. **Never write the `/Sig` fields.** `Signature of person who is subject of this
   evaluation` (ENF006) / `Signature3` (ENF003). Both are cryptographic signature fields.
   Wet ink only. (L6)
4. **Never leave a text field blank.** Write `N/A`. TDLR will not process a request with
   blanks. (F6) The SSN is the sole exception — the user hand-writes it.
5. **Button conventions differ between the two forms.** ENF006 = `/Yes` `/No`.
   ENF003 = `/ChoiceN`, **non-sequentially** (parole *Yes* is `/Choice3`). Read the map.
   Do not guess. (F8)
6. **County/state shape differs between the two forms.** ENF006 splits them into two
   fields; ENF003 combines them into one. Do not unify. (F9)
7. **`flatten()` on output.** Text is burned into the page content → identical on every
   library printer. Smoke-tested with `/Sig` present; it works.

The authoritative map is **`data/states/texas/tdlr_field_map.json`**. It is generated, verified against
a render, and annotated with every trap. Read it. Do not re-derive it from field names.

### 6.3 Continuation sheets

The Q21/Q14 box holds ~11 printed lines and the form field overruns the printed rules. So
the narrative goes on a generated sheet, and the box says `SEE ATTACHED CONTINUATION SHEET`.

Each sheet carries a header repeating **every identifier on the questionnaire**, so it
cannot be orphaned regardless of TDLR's filing convention:

```
CRIMINAL HISTORY QUESTIONNAIRE — CONTINUATION SHEET
Applicant: RIVERA, MARCUS, D            SSN: ______________  (write in by hand)
Continuation of Item 14 — Questionnaire 3 of 7

County/State of conviction:  Harris, Texas
Court:                       178th District Court
Date crime committed:        03/14/2019
Date of conviction:          11/02/2019
Exact crime:                 Possession of Controlled Substance, PG1 <1g
─────────────────────────────────────────────────────────────────────────────
[narrative]
```

⚠️ **`OPEN_QUESTIONS.md` Q2/Q3 are unresolved.** The design above is deliberately robust to
either answer. `NARRATIVE_MODE` config toggle: `shared` (one sheet referenced by all
questionnaires from an incident) vs `per_questionnaire` (duplicated). **Default
`per_questionnaire`** — self-contained is safer.

### 6.4 The mailing checklist (page 1, DO NOT MAIL)

Generated per packet. **Specific, never generic.** It enumerates *by name and item number*
every place the user must hand-write. See `PRD.md` §5 Stage 8.

---

## 7. The guidelines table

TDLR's *Criminal Conviction Guidelines* are **structured data**, not prose:

```
license type  →  [ { crimeCategory, tdlrStatedReason } ]
```

~37 license types × 4–6 categories. **Parse once to `data/states/texas/tdlr_guidelines.json`.**

Lookup is a **deterministic table read**. No embeddings. No retrieval. No model in this
path. It cannot hallucinate because there is nothing to hallucinate with. (S3)

**Display rules (H1/H2 — these are not optional):**
- Attribute everything to TDLR. Quote their stated reason. Cite it.
- Banner, prominent, not a footnote:
  > *"These guidelines are not an exclusive list — TDLR can consider crimes not listed.
  > TDLR also states that multiple violations of any criminal statute are always reviewed,
  > for any license type. **This does not tell you what TDLR will decide.**"*
- **No screening. No red lights. No discouragement.** TDLR says no crime automatically
  disqualifies; we have no basis to imply otherwise. (L2)

---

## 8. The LLM boundary

The model does exactly **one** job: reorganize the user's own words into the factor
structure Texas publishes. It never asserts, argues, predicts, or ranks.

### 8.1 Contract

**Input** (from `/api/narrative`, containing **no identifiers**):
```json
{ "facts": "...", "why": "...", "whatChanged": "...", "madeItRight": "...",
  "offenses": ["Possession of Controlled Substance PG1 <1g"],
  "style": "chronological" | "shorter" | "more_detailed" }
```

**Output:** one draft. Not three ranked options. (L4)

### 8.2 The provenance check — build this, it's the feature

Post-process every output sentence and attempt to map it back to a span in `rawAnswers`.
Any sentence that doesn't map is **flagged in the UI** and requires explicit user
confirmation before it can enter the packet.

Render the draft **side-by-side with the user's raw input.**

> This is not a nicety. The user signs an affidavit affirming the packet is their full and
> accurate account. If the model puts words in their mouth and they sign it, **the harm is
> real and it is ours.** A visible provenance check is how L3 becomes a fact instead of a
> hope. It is also the single best thing you can demo to Shahzad.

### 8.3 Coaching copy is static

The `§53.025(a)` factors and the general guidance are **pre-written UI strings**. Not model
output. Not case-specific. (L5)

### 8.4 The follow-up interviewer

The model may ask for more detail where factor coverage is thin
(*"You mentioned a program — what was it, and when?"*).

**Asking a question asserts nothing.** This is the safest part of the entire feature and
where most of the real value lives. Build it.

---

## 8.4 The agent context contract — one incident in, one package out

**The data architecture question:** what exactly gets handed to the narrative agent?

**Answer: a `NarrativeContext`, built by a pure function from a single `Incident`.**
Self-contained. Identifier-free. No global state, no reaching around the tree.

```ts
// The ONLY thing the narrative agent ever sees.
// NO name. NO DOB. NO SSN. NO address. NO other incidents. And NO county, NO court,
// NO exact dates — state + YEARS + charges only. County + court + day-precise dates +
// offense is a public-court-record fingerprint; the slim shape anchors a draft
// ("In 2019…") without being lookup-able. Asserted by test. (D6)
type NarrativeContext = {
  incidentId: string;
  state: string;
  yearOfEvents: string;    // "2019" — derived on-device from the full date
  yearResolved: string;
  charges: { exactOffense: string; sentence: string }[];   // ALL charges from this event
  rawAnswers: {
    facts: string;        // what happened
    why: string;          // why you made those decisions
    whatChanged: string;  // work, programs, family, treatment, time
    madeItRight: string;  // restitution, fines, court costs, supervision completed
  };
  style?: 'shorter' | 'chronological' | 'more_detailed';
};

function buildNarrativeContext(incident: Incident): NarrativeContext   // pure. no side effects.
```

### Why it carries ALL charges from the incident

Because **that is the point of modelling incidents at all.**

A person with 3 arrests and 17 convictions writes **3 stories, not 17**. And the model needs
every charge from that night in one context so it can write one *true* account —
*"I had marijuana on me when the assault charge happened"* — instead of four amputated
fragments that each pretend the others didn't exist.

### It also enables the V2 feature without a refactor

Item 21 / Item 14 is **per questionnaire**, i.e. **per charge**. So one incident with four
charges produces four narrative boxes. Two ways to fill them:

- **`NARRATIVE_MODE = 'shared'`** — one account, referenced by all four questionnaires.
- **`NARRATIVE_MODE = 'per_charge'`** *(V2)* — the model derives a charge-specific framing
  from the same incident account. Same context object. Same call. Different output shape.

**Default `shared`.** The context already carries every charge, so V2 is a prompt change,
not an architecture change. **Do not build `per_charge` now.**

---

## 8.5 The narrative component seam (build this in Phase 2, empty)

The narrative is **its own full-width step**, one per incident — not a chat widget, not a
corner bubble, not a box inside a card.

Four structured prompts, a follow-up conversation, a generated draft, a side-by-side
provenance view, and free editing **do not fit in a card** — and they *shouldn't*. This is
where someone writes about the worst night of their life. It earns the screen. It is the
**only** full-bleed takeover in the app.

**The seam that makes the assistant droppable later without a refactor:**

```ts
<NarrativeStep incident={incident} onSave={(n: Narrative) => void} />
```

- **Phase 2 (skeleton):** a plain textarea + the static coaching copy. Writes straight to
  `narrative.draft`. `rawAnswers` stays empty.
- **Phase 4 (assistant):** the *same component, the same props, the same type.* The
  assistant fills `narrative.rawAnswers`, generates `narrative.draft`, and populates
  `provenance`.

**Same seam. No refactor.** Build the boundary in Phase 2 even though there is nothing
behind it yet.

---

## 9. The two serverless functions

### 9.1 `/api/narrative` — the LLM proxy

```
POST { facts, why, whatChanged, madeItRight, offenses[], style }
  →   { draft }
```

- Exists only because API keys cannot live in a frontend bundle.
- **Receives no name, DOB, SSN, address, phone, or email.** Reject the request if any
  key resembling an identifier is present. Fail closed.
- **Provider + retention, recorded (D6, verified 2026-07-20 against OpenAI's docs):**
  the OpenAI API via the Vercel AI SDK (`@ai-sdk/openai`, `generateObject`,
  Zod-validated, default `gpt-4.1`). OpenAI's published policy: *"data sent to the
  OpenAI API is not used to train or improve OpenAI models"* (default since 2023-03-01);
  abuse-monitoring logs are *"retained for up to 30 days"*; **true Zero Data Retention
  exists but requires OpenAI approval.**
  ⚠️ **This means the default configuration is NOT zero-retention.** Until ZDR is granted,
  any user-facing copy must say the honest thing: *narrative text is not used for
  training and is deleted from the provider's abuse logs within 30 days* — never
  "zero-retention." Apply for ZDR, or keep the softer claim. Re-verify before the demo.
  Provider is swappable in one line in `src/agent/server.ts`.
- **Log nothing but a status code.** Not the body. Not on error.
- Stateless. No storage.

**Say this, and only this:** *"Identity fields never leave the browser. Narrative text is
sent without identifiers attached, under a zero-retention configuration, and is not
persisted."*
**Never say "anonymous" or "100% PII-safe."** A first-person account of a specific
conviction is identifying on its own, and a reviewer will take that claim apart. (D6)

### 9.2 `/api/escrow` — zero-knowledge email

The library-computer user has no USB stick, no account, and no way to carry a file to
their future self. Email is the only channel they have. So we built it — **blind.**

```
BROWSER
  1. generate 4-word passphrase (diceware). Display it LARGE.
     Force the user to type it back to confirm they wrote it down.
  2. salt = randomBytes(16); iv = randomBytes(12)
     key  = PBKDF2(passphrase, salt, 250_000 iters, SHA-256) → AES-256-GCM
  3. ciphertext = AES-GCM(JSON.stringify(case))
  4. blob = base64(salt ‖ iv ‖ ciphertext)

  POST /api/escrow  { to: <email>, blob }        ← THAT IS ALL WE SEND

FUNCTION
  5. relay.send({ to,
                  subject: "Your SurePath saved progress",
                  body:    <zero identifying content>,
                  attach:  surepath-progress.enc })
  6. return 204. Write nothing. Log nothing but status.

RESUME
  7. user drops the .enc file into SurePath, types the passphrase, decrypts IN-BROWSER.
```

**THE PASSPHRASE IS NEVER TRANSMITTED.** Not to our function. Not in the email. Not in the
subject. It is shown on screen once and printed on the mailing checklist.

**What this buys:**

| Threat | Outcome |
|---|---|
| Function logs capture the request body | **ciphertext** |
| Relay retains the message (they all do) | **ciphertext** |
| Relay is breached | **ciphertext** |
| Email sent to a typo'd address | stranger receives an **unreadable blob** |
| Shared / family / employer inbox | they see an **unreadable blob** |
| Inbox sits in Gmail forever, indexed | **ciphertext** |

**Residual risks — state them honestly, do not hide them:**

- **The destination email address does reach our function.** Unavoidable if you send mail.
  Never log it. Never store it. It is a weak identifier alone.
- **Metadata leaks.** The relay knows *someone at that address* used a reentry legal tool.
  That association is itself sensitive. Generic sender domain, generic subject. Document it.
- **Lost passphrase = lost data. Permanently.** This is the correct trade, but the UI must
  say so **loudly**, and the passphrase must be printed on the checklist.
- **Passphrase UX is where features like this die.** People forget. Memorable 4-word phrase,
  forced confirm-typing, printed on the packet.

**A3 amends to:** *no network request contains **readable** PII.* Still assertable. Still true.

---

## 10. Threat model, stated honestly

| Asset | Where it lives | Exposure |
|---|---|---|
| SSN | **Nowhere.** Never collected. | **None.** Only place it exists is the user's pen. |
| Name, DOB, address | Browser memory + `sessionStorage` | Device compromise (keylogger on a library machine). We cannot fix this. Data minimization is the mitigation. |
| Criminal history | Same | Same |
| Narrative text | Browser → `/api/narrative` → provider | In flight + provider processing. Zero-retention config. **Identifying on its own — do not claim otherwise.** |
| Escrowed case | Browser → **ciphertext** → relay → inbox | Ciphertext at every hop. Passphrase never transmitted. |
| Generated PDF | User's Downloads folder | **Real leak on a shared machine.** The checklist must tell them to delete it. |
| Anything on our servers | — | **Nothing. There is no store.** |

**What a CISO would actually say:** *"Your server-side risk is near zero because there's
nothing there. Your residual risk is the user's device, and you can't engineer that away.
So don't collect what you don't need."* That is exactly why there is no SSN field.

---

## 11. Invariant assertions (these are the tests that matter)

From `PRD.md` §6. Wire them as **CI-blocking** tests. Several are regression guards against
an agent "helpfully" breaking an invariant.

| # | Assertion |
|---|---|
| A1 | 3 incidents / 9 convictions → packet has exactly **1 × ENF006 + 8 × ENF003**. |
| A2 | **SSN field empty** in every generated PDF. *(This test caught real contamination on its first run. It stays.)* |
| A2b | **`/Sig` fields unsigned** in every generated PDF. |
| A3 | **No network request contains readable PII** — name, DOB, address, phone, SSN. *(Assert on outbound payloads. The escrow blob must be ciphertext.)* |
| A4 | A conviction dated **1998** is **retained**, appears in the packet, is never hidden or dimmed. |
| A5 | A deferred adjudication with no conviction is captured and reported. |
| A6 | The strings **"eligible", "qualify", "your chances", "likely"** never appear in reference to the user — UI copy, LLM output, or PDF. |
| A7 | Every LLM output sentence traces to user input, or is **flagged** and requires confirmation. |
| A8 | Narrative variants are labeled by **style only**. No variant is "recommended" or "strongest". |
| A9 | Non-business-owner → business fields hidden in UI, written as **`N/A`** in the PDF. |
| A10 | 3 trades → 3 packets; checklist says **3 separate $10 money orders**. |
| A11 | **No text field is blank** in any generated PDF except the SSN. |
| A12 | An incident with 4 charges requires **4 distinct exact-offense entries**. No pre-fill. |
| A13 | **`zeroAllFields()` ran**: re-read every generated PDF; no field holds a value the app did not intend to write. |
| A14 | Looking for a **non-TDLR trade** ("nurse", "doctor") on the `/texas` intro page surfaces the correct board **before the user enters the application**; the Licenses stage carries an escape hatch for direct arrivals. **No user ever completes the record for the wrong agency.** |

---

## 12. Deliberately not built

State these as decisions in the proposal. A named non-goal reads as judgment; an unnamed
one reads as an oversight.

- **Mobile optimization.** Transcribing a 20-charge rap sheet is a sit-down task. (S2)
- **User accounts / any database.** A store of names + criminal histories of
  justice-impacted people is a honeypot. The people harmed by a breach are the people we
  serve. (D4)
- **Rap-sheet OCR ingestion.** The obvious V2 and genuinely the highest-leverage feature —
  *deliberately deferred*: **a silent parse failure produces exactly the omission the
  product exists to prevent.** It needs human-in-the-loop verification UX we cannot
  validate in this window.
- **RAG / vector store.** The guidelines are a table. Retrieval would add a hallucination
  surface to a lookup that is currently exact. (S3)
- **Appeals.** SurePath exists so users never reach a SOAH hearing. (L7)
- **Arizona.** Designed for — the state model is data-driven, so Arizona is a data addition,
  not a rewrite. Not built. (S1)
- **E-filing.** There is no online submission pipeline for this request. TDLR accepts
  attachments via a *general inquiry* form, but the cashier's-check requirement makes mail
  the operative channel. *(Say it that precisely. "No state portal exists" is overclaiming
  and it is checkable.)*
