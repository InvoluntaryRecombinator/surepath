# SurePath — Project Constitution

**Read this file at the start of every session. Re-read it before any change that
touches the LLM, the PDF output, data storage, or user-facing copy.**

These are **invariants, not preferences**. Violating one is a project failure even
if the code works and the tests pass. Each rule has its reason attached — the
reason is there so you do not rationalize around the rule. If a rule seems wrong,
**stop and ask the human. Do not "fix" it.**

---

## GIT WORKFLOW — commit constantly, in small pieces

**This is a standing rule for every session. Follow it without being asked.**

The human needs a dense, legible commit history — both to roll back cleanly when something
goes wrong, and to see progress. **Large uncommitted working trees are a failure state.**

### Commit after every meaningful unit of work

Not "at the end." After each unit — a passing test, a working component, a fixed bug, a
completed doc correction. If you just made something work, **commit it before starting the
next thing.** A good rule of thumb: if you would be annoyed to lose it, it should already be
committed.

**Never batch a whole phase into one commit.** A phase is many commits.

### Commit message format

```
<type>: <what changed, imperative, specific>

<why, if not obvious. reference the invariant or acceptance criterion.>
```

`type` ∈ `feat` · `fix` · `test` · `docs` · `chore` · `refactor`

**Good:**
```
fix: correct ENF003 parole export values (were inverted)

Parole yes was /Choice3, is actually /Choice1. Verified by widget geometry
on the real blank — "No" is the left box. Old value made the packet tell TDLR
a man not on parole IS on parole. CLAUDE.md F8.
```
```
test: add set-equality "no charge dropped" guard (D1)
feat: Stepper — three states differ in form not color (DESIGN_SYSTEM §5.5)
docs: resolve header height to 80px across DESIGN_SYSTEM
```

**Bad:** `updates` · `wip` · `phase 2` · `fixed stuff` · `changes per feedback`

### Rules

- **Commit before you refactor**, so the working version is a restore point.
- **One logical change per commit.** Don't mix a bug fix and a new feature. If you did two
  things, make two commits (`git add -p` for partial staging).
- **Never commit broken code to `main`** knowingly. If a test is red, either fix it or mark it
  clearly in the message (`test: add failing case for X (not yet implemented)`).
- **After a batch of commits, print `git log --oneline -n 10`** so the human can see the trail.
- **Do not `git push` unless asked** — the human controls the remote.
- The human commits at their own checkpoints too; your commits and theirs interleave. Keep
  yours small enough that theirs never collides.

### This repo will be reviewed by humans — commit like it

This project is a **portfolio piece**. The commit history itself is part of what gets
judged — by a course reviewer, and potentially by people evaluating the author for jobs.
A history of many small, well-described commits reads as competent, deliberate engineering.
A history of three giant "wip" commits reads as the opposite.

So, beyond the granularity rules above:
- **Err on the side of MORE commits, smaller.** A component, a test, a fix, a doc
  correction, a refactor — each is its own commit. If you did two nameable things, that's
  two commits.
- **Every commit message is a sentence someone will read.** Specific, imperative, and it
  says *what* and (if not obvious) *why*, referencing the invariant or acceptance criterion.
- **TDD is visible in the history when you let it be.** When you write a test then make it
  pass, that can be two commits — `test: add failing X` then `feat: implement X` — and that
  sequence is *good* to show: it demonstrates test-driven work to anyone reading the log.
  Do this whenever it's natural; don't contort the work for it.
- The history should read like a **clean, steady narrative of the build** — someone
  scrolling `git log --oneline` should be able to follow what happened and when.

### At the start of a session

If `git status` shows an uncommitted working tree from a previous session, **stop and tell the
human before doing anything** — don't bury their work under yours. Offer to commit it with a
descriptive message first.

## 0. What SurePath is

SurePath helps a justice-impacted person in Texas assemble a **complete, correct
Criminal History Evaluation Letter (CHEL) request packet** for the Texas
Department of Licensing and Regulation (TDLR), and mail it — so they can find out
where they stand *before* spending years and money training for a licensed trade.

It is a **document assembly tool**. It is a very good typist with a checklist.

It is not a lawyer. It is not an advisor. It is not an oracle. It does not know
what TDLR will decide, and it must never behave as though it does.

**The safe verb, everywhere:** SurePath helps you **request an answer from TDLR**.
The **board** is the source of every determination. SurePath is the source of none.

---

## 1. LEGAL INVARIANTS

The project's entire legal posture is the **scrivener's exception** (the
LegalZoom / TurboTax posture): we format the *user's own facts* onto a pro-se
government form and surface *published public statutes* as cited information.
Every rule below protects that posture. Break one and the posture collapses.

### L1 — Never assert eligibility, in any form, anywhere.

Never tell a user they are eligible, ineligible, likely to be approved, likely to
be denied, a "good candidate," or that they have "a strong case."

Not in UI copy. Not in a tooltip. Not in LLM output. Not in a loading message.
Not in the generated PDF. Not in a comment the user will never see.

**Banned words, when applied to the user:** *eligible, ineligible, qualify,
disqualified, your chances, likely, probably, should pass, strong case, good
candidate, you'll be fine, don't worry.*

**Allowed:** "TDLR will decide." "This is what TDLR publishes." "You will receive
TDLR's answer within 90 days of a complete request."

*Reason: this is the instructor's #1 concern and the single largest liability in
the product. A tool that predicts a government body's decision is both practicing
law and taking on wrong-answer liability.*

### L2 — There is no auto-disqualifier. Do not build one.

TDLR states plainly: **"There is no specific crime which will result in the
automatic denial of a license."**

Therefore SurePath has **no basis whatsoever** to screen anyone out. Do not build
a gate, a filter, a red light, a "this probably isn't worth it" screen, or any
logic that discourages a user from filing based on their record.

*Reason: TDLR itself refuses to make this call in advance. We are in no position
to make it for them. Conveniently, this also means we never have to.*

### L3 — The LLM may not introduce propositions.

Every factual assertion, every characterization of the user's conduct, and every
claim about the user's state of mind in generated text **must trace back to
something the user typed.**

The model **reorganizes**. It does not argue, invent, embellish, infer motive, or
add connective rhetoric the user did not supply.

If the user wrote *"I was 22 and broke and I took the money"*, the model may
produce *"At 22, facing financial pressure, I took the money."* It may **not**
produce *"I have since dedicated myself to becoming someone my family can rely
on"* — because the user never said that.

**Implement this as a visible feature, not just a prompt:** show the generated
draft side-by-side with the user's raw input, and flag any output sentence that
does not map back to an input sentence. Make the user confirm it.

*Reason: the user signs an affidavit affirming the packet is their full and
accurate account. If the model puts words in their mouth and they sign it, the
harm is real and it is ours. This is a bigger risk than UPL.*

### L4 — Never rank or recommend by predicted legal effect.

Style variants are fine. Label them by **form**: "shorter," "chronological,"
"more detailed."

Never label them by **strength**: "this one is stronger," "the board will respond
better to this," "recommended."

*Reason: ranking by predicted effect on a licensing board's decision is legal
strategy. Generating three phrasings is word processing. The line is the ranking,
not the count.*

### L5 — Coaching must be general and published, never case-specific strategy.

**OK** (published, general, citable):
> "Tex. Occ. Code §53.025(a) lists the factors TDLR considers, including time
> elapsed since the offense, conduct and work activity before and after, and
> evidence of rehabilitation."

**OK** (general, clearly marked as general guidance, not attributed to the statute):
> "In general, licensing boards look for an account that takes responsibility.
> This is your account to write."

**NOT OK** (case-specific strategy):
> "In your case, emphasize the job and downplay the assault charge."

*Reason: applying law to a specific person's facts to advise a course of action is
the definition of legal advice. Reciting published law is information.*

### L6 — The app never submits anything, and never signs anything.

The user reviews the packet, prints it, hand-writes their SSN, signs it in ink,
buys a money order, and mails it. There is no auto-submit, no e-file, no
"send for me." Liability transfers to the user at physical execution.

**Both forms carry a `/Sig` (cryptographic digital signature) field** —
`Signature of person who is subject of this evaluation` on ENF006, `Signature3` on
ENF003 — and the AcroForm sets `/SigFlags 1`. **NEVER POPULATE THEM.**

SurePath applying a signature on a user's behalf, to a document affirming their
record is full and accurate *under penalty of administrative sanction*, would be
catastrophic. **Wet ink. Their hand. Always.**

*(`form.flatten()` has been smoke-tested with `/Sig` present and works — but verify
in the browser on day 1. Some libraries throw on `/Sig`.)*

### L9 — SurePath informs. It does not steer.

**The through-line of L1, L2, L5, and L8, stated plainly.** SurePath presents accurate
information about the user's options. **It does not make the user's decisions for them.**

**The concrete case: how they get their criminal record.** Texas offers two paths, with a
real tradeoff:

| | Online name search | Fingerprint personal review |
|---|---|---|
| Cost | ~$3 | ~$25 |
| Time | minutes, right now, on this computer | days to weeks, in person |
| Shows | convictions + deferred adjudications | the complete record |
| Accuracy | matched on **name** — DPS warns it can miss records or match someone else | matched on **fingerprints** — positively them |

**Present both. Flat. No thumb on the scale.** Which one to use — trading cost against time
against completeness — is a decision about **their own life and their own money.** It is not
ours to make.

⚠️ **Do not hard-gate on the fingerprint review.** *"Go get fingerprinted, wait two weeks,
then come back"* means **nobody comes back.** A gate like that doesn't make the product
safer. It makes it **unused** — which helps precisely zero people.

**The right mitigation is a reframe, not a gate:**

> **The report is a starting point, not the final word. You know things it doesn't.**
> If you remember a conviction that isn't on the report, **put it in anyway.**

The report is a **memory aid, not an oracle.** And SurePath has **save/resume** — so the
honest path is: *start now from memory, save, get your report, come back and reconcile.*
The Review stage's count check is exactly where that reconciliation lands.

### L8 — SurePath does not advise on expunged or sealed records. Ever.

Texas has **two different instruments** and people confuse them constantly:

- **Expunction** — the record is destroyed. The person may generally deny it happened.
  TDLR likely never sees it. **Telling them to disclose it may talk them into
  volunteering something they had a legal right to never mention.**
- **Order of nondisclosure** — the record is sealed from the *public*, but certain
  agencies can still access it. It is most commonly granted after **deferred
  adjudication** — which TDLR explicitly requires be reported. **Telling them they
  don't have to list it, when TDLR can see it, makes them look like a liar on a form
  they signed under penalty of administrative sanction.**

**Two instruments. Opposite answers. Either error badly harms the user.**
TDLR's published FAQ addresses neither.

**Therefore SurePath:**
- **NEVER** says "you don't have to list that."
- **NEVER** silently omits a record from intake because it was sealed or expunged.
- **NEVER** decides this for the user, in either direction.
- **DOES** state plainly that expunction and nondisclosure are different legal
  instruments with different consequences, and that **this is a question for TDLR or a
  lawyer** — before they decide.
- **DOES** surface what TDLR publishes: report all convictions and deferred
  adjudications, no matter how old. *(Which is evidence, but does not settle sealing.)*

*This is the single most likely place a well-meaning tool gets someone into real
trouble. It is exactly the judgment the scrivener's exception forbids us from making.*
*(See `OPEN_QUESTIONS.md` Q8 — pending TDLR.)*

### L7 — SurePath does not touch appeals.

The post-denial administrative appeal (SOAH hearing) is out of scope permanently.
SurePath exists so users never reach that stage. Do not build toward it, do not
mention it as a feature, do not offer help with it.

---

## 2. DATA INVARIANTS

### D1 — REPORT EVERY CONVICTION. NO LOOKBACK WINDOW. EVER.

**TDLR FAQ #9, verbatim question:** *"Do I have to report convictions that are
more than ten years old?"* **Answer: yes.** All convictions and deferred
adjudications must be reported **no matter how long ago they occurred**, because
TDLR needs the full history to assess whether there is a pattern.

**DO NOT** build a filter, a toggle, a "these are probably too old to matter"
hint, or any logic that drops, hides, de-emphasizes, or makes optional a
conviction based on its age. **Not one. Not ever.**

*Reason: this is the single most likely way an agent destroys this product while
trying to be helpful. An omitted conviction voids the evaluation letter — TDLR
runs a full DPS/FBI fingerprint check at the real license application, finds the
gap, and the "yes" the user got is worthless or worse. **We would have caused the
exact harm the product exists to prevent.***

*If you are thinking of the 7-year rule: that is **California AB 2138**. A
different state. It appears in this project's background research for a different
reason. **It does not apply to Texas.***

### D2 — Deferred adjudications are reported too.

Even though a deferred adjudication is not technically a conviction, TDLR requires
it be reported (FAQ #8). The intake must capture them. Do not treat "was I
actually convicted?" as a filter.

### D3 — SurePath never touches the Social Security Number.

- There is **no SSN input field** in the UI. Do not add one.
- The SSN AcroForm field in every generated PDF is **left empty**.
- The cover checklist instructs the user to **hand-write it, in pen, on every
  page that asks for it**, and tells them exactly how many places that is.

*Reason: SSN is the one piece of radioactive PII we can completely avoid touching.
Refusing to collect it eliminates the risk rather than mitigating it. It is also
the cleanest thing we can say to a security reviewer.*

*Note: ENF006 says "Do not leave blank fields, use N/A if not applicable." The SSN
is applicable, so N/A is wrong. The user must write it in. The checklist must be
**loud** about this — a blank SSN box can get the packet rejected.*

### D4 — No database. No accounts. No server-side persistence of user data.

The user's data lives **on the user's own device** and is carried between devices by a
**file the user exports** (download or email). It is **never** stored on our servers.

Do not add: user accounts, login, JWTs, Postgres, Mongo, Redis, Supabase, Firebase,
session cookies carrying user data, or any **server-side** store of anything the user typed.

**On-device autosave IS allowed, and is required.** Autosave to **`localStorage`** so an
accidental tab-close doesn't destroy 45 minutes of work.

> ⚠️ **This reverses an earlier version of this rule, which banned `localStorage`.** The
> reversal is deliberate and the reasoning is:
> - The honeypot risk D4 exists to prevent is a **server-side database** of criminal
>   histories — a single breachable store of many people's data. `localStorage` is none of
>   that: it's one person's data, on their own machine, that never transmits.
> - **Nobody clicks "Save" mid-session.** If autosave died on tab-close (`sessionStorage`),
>   the exact failure we're trying to prevent — lost work from a stray Cmd-W — is what we'd
>   ship. Autosave must survive tab-close. That requires `localStorage`.
> - **The SSN is never in the data at all (D3)** — the most radioactive field never touches
>   the disk. That's what makes on-device storage defensible here.
> - The residual risk (data left on a shared/library computer) is mitigated by a prominent
>   **"Delete my information from this computer"** control, framed as protection. See
>   `SITE_STRUCTURE.md` §4.

**Never say "localStorage" or "sessionStorage" to the user** — the words alarm without
informing this audience. Frame storage as protection and deletion as safety, not loss.

### D5 — PDF generation is entirely client-side.

`pdf-lib` runs in the browser. The blank official PDFs are static assets served to
the client. Filling and assembly happen on the user's machine. The completed
packet is produced as a Blob and downloaded locally.

**Identity fields never leave the browser.** No name, DOB, address, phone, or email
is ever POSTed anywhere.

### D6 — The only data that may reach a server is narrative text, and be honest about it.

The narrative-structuring LLM call is the sole server round-trip. It sends the
user's account of an incident **without** name, DOB, SSN, or address.

**It must be a zero-retention API configuration.** Verify this against the
provider's terms and record which provider/config in the architecture doc.

**Do not claim this is anonymization.** A first-person account of a specific
conviction, with dates and a rehabilitation history, is identifying on its own.
The honest claim is **data minimization**:

> "Identity fields never leave the browser. Narrative text is sent without
> identifiers attached, under a zero-retention configuration, and is not persisted."

Never write "100% PII-safe" or "fully anonymous." A security reviewer will take
that apart and they will be right.

### D8 — The escrow email is the ONE exception to D5, and it ships ENCRYPTED or not at all.

A person on a library computer has no USB stick, no account, and no way to carry a
JSON file to their future self. Email is the only channel they have. So SurePath
offers **"Email me my progress"** — but **blind**.

**"We don't write it to a database" is NOT a privacy property.** Function logs
capture request bodies on error. SMTP relays queue and retain message bodies for
days or weeks. Inboxes are forever, indexed, and frequently shared with partners,
family, or employers. One typo'd address discloses a criminal record to a stranger,
irreversibly. Plaintext escrow is **not** acceptable.

**Therefore, mandatory:**

1. Encrypt **in the browser** before anything is sent. WebCrypto:
   `PBKDF2(passphrase, salt, 250k, SHA-256)` → **AES-256-GCM**.
2. **POST ciphertext only.** `{ to, blob }`. Nothing else.
3. **The passphrase is NEVER transmitted.** Not to the function. Not in the email.
   Not in the subject. It is shown on screen once and **printed on the mailing
   checklist**.
4. The email body carries **zero identifying content**. The attachment is an opaque
   `.enc` blob.
5. `/api/escrow` writes nothing and logs nothing but a status code.

**Do not oversell it. State the residual risks:**
- The destination **email address does reach our function** (unavoidable — you need
  it to send mail). Never log it. Never store it.
- **Metadata leaks:** the relay learns that *someone at that address* used a reentry
  legal tool. That association is itself sensitive.
- **Lost passphrase = lost data, permanently.** Correct trade. Say it LOUDLY.

**A3 amends to:** *no network request contains **readable** PII.* Still true. Still
assertable. Still testable.

### D7 — Templates must be authoritative blanks, and the fill routine MUST zero every field.

**This bit us already.** The PDFs originally uploaded to this project were *not*
blank — they were copies someone had typed test data into. Residue included junk
text in every box, **`/General Partnership` ticked on ENF006**, and **`Type of
Request = Renewal` ticked on ENF003**.

Building on those templates would have shipped, to TDLR, a signed statement that
the applicant was a general partnership renewing a license. **A material
misstatement on a government form the user signs under penalty of administrative
sanction.**

Two rules, both mandatory:

1. **Source the blank forms directly from `tdlr.texas.gov`.** Never from a copy
   that has been opened in a PDF editor.
2. **The fill routine zeroes `/V` and `/AS` on every field and every kid widget
   *before* writing anything.** A field you don't explicitly write **keeps whatever
   the template had.** Do not assume the template is clean. Assume it is dirty.

Assert it: after generating a packet, **re-read it and confirm no field holds a
value the app did not intend to write.** Acceptance criterion A2 (SSN empty) caught
this residue on its very first run. Keep that test.

---

## 3. FACTUAL INVARIANTS

**These were verified against the primary source documents. Do not "correct" them
from memory or from a web search that surfaces older material.**

### F1 — The packet is ENF006 + ENF003. It is NOT "ENF001."

| Document | Form # | Revision | Role |
|---|---|---|---|
| Request for Criminal History Evaluation Letter | **ENF006** | May 2025 | **The form you fill out and mail.** 2 pages. |
| Criminal History Questionnaire | **ENF003** | Aug 2024 | One per **additional** conviction. |
| Instruction sheet | ENF001-**I** | May 2025 | Instructions only. **Not a form. Never filled, never mailed.** |

**Critical structural fact:** ENF006 page 2 contains a full criminal-history
section (items 15–24: county, court, dates, exact crime, sentence, narrative,
parole, probation, signature). **ENF006 carries the FIRST conviction.**

> **N convictions ⟹ 1 × ENF006 + (N − 1) × ENF003.**

*Not* N × ENF003. Getting this wrong is an off-by-one that produces an incomplete
or duplicated packet.

*Older sources, law-firm blogs, and earlier drafts of this project call the request
form "ENF001." They are wrong — that is the instruction sheet's number. TDLR
renumbered the form in the May 2025 revision. Work from the actual PDF.*

### F2 — Both forms are AcroForm PDFs with named fields.

Fill by **field name** (`form.getTextField('Last Name').setText(...)`).

**Do NOT do X/Y coordinate stamping.** Earlier architecture notes for this project
assumed coordinate mapping. That assumption is dead. It would waste days.

*Caveat: ENF003's field names were auto-derived from label text and are ugly and
ambiguous (e.g. the SSN field is literally named `See instruction sheet for
disclosure information`). Build the field map from a **field-probe render**, not
from guessing. See `docs/DATA_CONTRACTS.md`.*

### F3 — Fee: $10.00, per license type.

- **$10.00**, cashier's check or money order, **payable to TDLR**. Not cash.
- The fee is **per license type requested**, *not* per crime.
- ENF006: *"If you are seeking a determination of your eligibility for more than
  one license type you must submit a separate request and application fee for each
  license type. You do **not** have to submit a separate request for each crime."*
- So: 3 trades ⟹ 3 complete packets ⟹ 3 × $10.

### F4 — Mailing address

```
Texas Department of Licensing and Regulation
P.O. Box 12157
Austin, TX 78711-2157
```
Do not send cash. TDLR does not return submitted documents — the user must keep a copy.

### F5 — The CHEL is ADVISORY.

- **Not binding** on TDLR.
- **No appeal right** from it.
- TDLR issues it **within 90 days** of receiving a *complete* request.
- TDLR's view can change later (new information, changed circumstances, changed policy).
- The user may apply for the license regardless of what the letter says.

This is *why* Texas is the safe state to start with: filing forecloses nothing.

### F6 — "Do not leave blank fields, use N/A if not applicable."

ENF006 says this explicitly and will not process an incomplete request. Every
field must be populated or explicitly `N/A`. **The SSN is the sole exception** —
the user hand-writes it (see D3).

### F8 — The two forms use DIFFERENT checkbox conventions. Verified by render.

**ENF006** uses semantic export values. **ENF003 uses `/ChoiceN` — non-sequentially.**

| Form | Field | Ticks |
|---|---|---|
| ENF006 | `Gender` | `/Male` · `/Female` |
| ENF006 | `Type of Ownership` | `/General Partnership` · `/Sole Proprietor` · `/Corporation` · `/LLC` · `/LLP` · `/Off` |
| ENF006 | `Are you currently on parole?` | **`/Yes`** · **`/No`** |
| ENF006 | `Are you currently on probation?` | **`/Yes`** · **`/No`** |
| ENF003 | `Type of Request` | New = **`/Choice1`** · Renewal = `/Choice2` |
| ENF003 | `#16` (renewals) | No = **`/Choice1`** · Yes = `/Choice2` |
| ENF003 | `#17` (parole) | No = **`/Choice3`** · Yes = **`/Choice1`** ⚠️ |
| ENF003 | `#18` (probation) | No = **`/Choice2`** · Yes = **`/Choice1`** ⚠️ |

🚨 **THE TWO PAROLE/PROBATION ROWS ABOVE WERE INVERTED IN EVERY EARLIER REVISION OF THIS
FILE, AND THE PACKET LIED TO TDLR BECAUSE OF IT.**

The old table said parole *Yes* = `/Choice3`. **It is the opposite — `/Choice3` is NO.**

Verified by reading each widget's on-value **together with its rectangle** off the real
blank. On the printed form, **"No" is the LEFT box and "Yes" is the RIGHT box:**

```
#16 (renewals)   left x=481 → /Choice1 = NO      right x=529 → /Choice2 = YES
#17 (parole)     left x=192 → /Choice3 = NO      right x=226 → /Choice1 = YES
#18 (probation)  left x=191 → /Choice2 = NO      right x=225 → /Choice1 = YES
```

**What that bug actually did:** for a man who is **not on parole** and **is on probation**,
the generated packet ticked *"Yes, I am on parole"* and *"No, I am not on probation."* Both
backwards — on a form he signs **under penalty of administrative sanction**, affirming it is
his full and accurate account.

**And every single check was green.** The field map said so. pdf-lib validated the export
value and read it back. The PDF was well-formed. **A13 confirmed the packet held exactly the
values we intended to write — we intended the wrong ones.** No test could catch it, because
**the error was in the ground truth the tests were written from.**

**ONLY PRINTING THE PAGE AND LOOKING AT IT CAUGHT THIS.** That is why `BUILD_SEQUENCE` Phase 1
ends with *"Then print it. On paper. Look at it."* **It is not a nicety. It is the only
control that can detect a lie the entire system agrees on.**

⚠️ **`/Choice1` means YES on `#17` and NO on `#16` — same form, same value, opposite
meanings. THE NUMBER CARRIES NO MEANING. Never reason from it.** And if the thing you are
checking *is the map*, read the **geometry** — it is the only ground truth independent of us
being right.

**⚠️ pdf-lib call syntax — the map stores the truth, the helper strips the slash.**
This table lists the **real PDF export values, with the slash** — that is literally
what is inside the file. But `PDFRadioGroup.select()` wants the **bare name**:

```ts
select('Choice3')     // ✅
select('/Choice3')    // ❌ THROWS
```

Route **every** tick through **one** helper that strips the slash, asserts the value
exists on that field, selects it, and **reads it back.** Map stays true; adapter
absorbs the quirk.

*Correction to an earlier revision of this file: it claimed that guessing `/Yes` on
ENF003 would leave every box **silently** `/Off`. **It doesn't — pdf-lib throws
loudly.** So that failure is a nuisance, not a catastrophe. **But the map still earns
its keep:** pdf-lib will tell you `'/Choice3'` is malformed. It will **never** tell you
that **`Choice3` is what parole-yes means.** The probe found the value; pdf-lib only
validates the syntax.*

### F11 — `/Off` IS NOT AN OPTION. Never `select` it.

**`/Off` is the ABSENCE of a selection, not a selectable value.** It does not appear in
a radio group's option list. **`select('Off')` throws.**

To leave a group unselected: **clear it, or never touch it.** Build `clearButton()` as a
**distinct primitive** from `tickButton()`.

**Where this bites:** `Type of Ownership` on ENF006. Its real options are
`[/General Partnership, /Sole Proprietor, /LLC, /LLP, /Corporation]` — **and nothing
else.** The **non-business-owner** case is **both the default and the common one.**

*An earlier revision of `tdlr_field_map.json` listed `"none": "/Off"` for this field.
**That was wrong**, and it is exactly the kind of thing that reads as fine in code review
and **ships a packet declaring the applicant a General Partnership.* Caught in the Phase 0
browser probe. Fixed.*

Full map: `data/tdlr_field_map.json`. Labeled renders: `probe/*_labeled.png`.

### F9 — ENF006 splits county and state. ENF003 combines them. Same packet.

- **ENF006** — the field *named* `County and State of conviction or deferred
  adjudication` holds the **COUNTY ONLY** (`"Harris"`). The state goes in a
  **separate** field, `State (ex: Texas)` (`"Texas"`).
  *Writing `"Harris, Texas"` into the first field is wrong **and** leaves the second
  blank.*
- **ENF003** — `ex Travis TX` is **one** field holding **both** (`"Harris, TX"`).

Same data. Two shapes. Two forms. One packet. Do not unify them in the mapper.

### F10 — Authoritative form structure (and a correction).

The **authoritative blanks from tdlr.texas.gov** are structurally sound:

| | ENF006 | ENF003 |
|---|---|---|
| Fields | **33** (32 fillable + 1 `/Sig`) | **24** (23 fillable + 1 `/Sig`) |
| `/DR` (default font) | present | present |
| `/SigFlags` | 1 | 1 |
| Residual values | none | none |

**Correction to an earlier note in this file:** a previous revision warned that these
forms lack a `/DR` font resource. **That was wrong.** It was an artifact of the
*mangled* copies (see D7), which had been opened in an editor that stripped the `/DR`
dict *and* the `/Sig` fields *and* left test data behind — **three** separate
corruptions.

**The lesson is D7, not F10:** never characterize a form from a copy. Go to the source.

Still true regardless: **smoke-test the fill + flatten pipeline in the browser on day
1, not day 8.**

### F7 — Who to contact

TDLR **Enforcement Division** — the division that actually processes the CHEL.
- `enforcement@tdlr.texas.gov`
- (512) 539-5600

*(The general Customer Service line — (800) 803-9202 / (512) 463-6599 — routes to
reps who cannot answer questions about this form.)*

---

## 4. SCOPE INVARIANTS

### S1 — Texas only. TDLR only.

MVP is **Texas / TDLR**, end to end. Arizona is *designed for* (the state model is
data-driven so Arizona is a data addition, not a rewrite) but **not built**. Every
other state renders a "not yet supported" page.

### S2 — Desktop-first. Mobile is explicitly not a goal.

Transcribing a 20-charge rap sheet, cross-referencing court names and dates, and
writing several narratives is a **sit-down-with-your-documents task**. It is also
how the institutional user (a caseworker at a reentry org or trade school) will
run it.

Responsive layout is fine. **Do not spend time on mobile optimization.** This is a
deliberate product decision, not an oversight.

### S3 — No RAG. No vector store. No embeddings.

The TDLR *Criminal Conviction Guidelines* are a **structured table**:
`occupation → crime category → TDLR's published reason`. Roughly 37 license types,
4–6 crime categories each.

**Parse it to JSON once.** Look it up deterministically. There is no retrieval
problem here. Adding a RAG layer adds a hallucination surface to a lookup that is
currently exact — it makes the product *worse*.

---

## 5. THE HONESTY RULES

These are product rules, not legal ones. They exist because the users are people
who get lied to by systems constantly, and because a capstone reviewer will find
any place we shaded the truth.

- **H1.** Tell users the guidelines are **not an exclusive list** — TDLR can
  consider crimes not listed.
- **H2.** Tell users with long records that TDLR says **"multiple violations of any
  criminal statute should always be reviewed, for any license type."** Do not sell
  them a green light the state did not give.
- **H3.** Tell users the letter is **advisory**, that it is **only as good as what
  they disclose**, and that a **new charge** between the letter and the real
  application changes everything.
- **H4.** Tell users the real license application triggers a **full DPS/FBI
  fingerprint background check**. What they omit here will be found there.
- **H5.** Tell users this takes up to **90 days** and costs **$10 per trade**.
  Do not bury the wait or the cost.

---

## 6. WHEN IN DOUBT

Three tests. If a change fails any of them, it is wrong:

1. **Does it make SurePath appear to know something about the user's outcome?**
   → Wrong.
2. **Does it make the user's words less their own?**
   → Wrong.
3. **Does it put PII on a server, or lose a conviction?**
   → Wrong.

Ask the human. Do not proceed.

---

## 7. Document map

| File | Contents |
|---|---|
| `CLAUDE.md` | **This file.** Invariants. Read first, always. |
| `docs/SETUP.md` | **Read this to start.** What to install, what keys you need (almost none), where files go, the agent kickoff prompt. |
| `docs/DESIGN_SYSTEM.md` | Tokens, the ruled-line input, the progress rail, the counter, and a **hard ban list** that keeps the UI from looking AI-generated. |
| `docs/PRD.md` | Product: problem, users, screen-by-screen flow, 14 acceptance criteria. |
| `docs/ARCHITECTURE.md` | Stack, data model, document service, LLM boundary, the two serverless functions, threat model. |
| `docs/BUILD_SEQUENCE.md` | **Start here to build.** Day-1 smoke test, 7 phases, definitions of done, cut order. |
| `docs/OPEN_QUESTIONS.md` | Unresolved. **Blocked on TDLR.** Do not invent answers. |
| `data/tdlr_field_map.json` | **The verified AcroForm field map.** Source of truth for the document service. Every trap annotated. **Do not re-derive field names.** |
| `data/tdlr_guidelines.json` | *(to build — Phase 3)* `license → [{ crimeCategory, tdlrStatedReason }]`. |
| `assets/ENF006_blank.pdf` | Authoritative blank, form pages only, fresh from tdlr.texas.gov. |
| `assets/ENF003_blank.pdf` | Same. |
| `probe/*_labeled.png` | Field-map overlay renders. Evidence, and a good capstone artifact. |
