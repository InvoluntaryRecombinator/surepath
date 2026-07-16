# SurePath — Open Questions

**These are genuinely unresolved. Do not invent answers. Do not let a web search
convince you otherwise — the public materials are silent or contradictory on every
item below, which is exactly why they're here.**

Where a question blocks a build decision, the fallback design is stated. **Build
the fallback.** It is designed to be robust to whichever way the answer lands.

---

## BLOCKED ON TDLR

Contact: **TDLR Enforcement Division** · `enforcement@tdlr.texas.gov` ·
(512) 539-5600
*(Not the general Customer Service line — those reps cannot answer these.)*

Status: **email sent / callback requested — awaiting answer.**

---

### Q1 — Can rehabilitation evidence be submitted *with* a CHEL request?

**Why it's open.** TDLR's *Guidelines*, Section II, say the applicant is responsible
for obtaining and providing recommendations from prosecution / law enforcement /
correctional authorities, and proof of steady employment, support of dependents,
good conduct, and payment of all court costs, supervision fees, fines, and
restitution.

**But neither ENF006 nor ENF003 has a field for any of it, or mentions it exists.**

**Evidence it applies at the CHEL stage:**
- The Guidelines say: *"Individuals may request TDLR review their criminal
  background before actually applying for a license. **TDLR uses the same process
  for this pre-application evaluation as the process described below.**"* —
  "below" being the sections that include applicant responsibilities and the
  §53.025(a) factors.
- The CHEL review is investigative, not clerical: TDLR reviews the history *"the
  same as if an actual license application had been filed,"* and the review may
  include court records, police records, **interviewing the requestor**, and
  interviewing third parties like probation officers and counselors.
- **TxDMV** — a sister Texas agency running the same Ch. 53 statute — says it
  outright for its own pre-licensing evaluation: provide the criminal history **and
  any additional evidence of fitness you would like considered**, e.g. evidence of
  conduct and work activity, rehabilitation, compliance with supervision, and
  letters of recommendation.

**Evidence against:** none. But no *TDLR* source states it, and the forms are silent.

**Also worth noting:** nothing suggests submitting it *hurts*. Nobody gets denied
for volunteering proof they paid their restitution.

**Fallback:** build Stage 6.5 (supporting-evidence checklist + generated cover
sheet) behind a **feature flag**. If TDLR says yes → ship it. If TDLR says it's only
weighed at the real license application → flip the copy to *"here's what you'll need
later"* and keep it. **One hour either way.**

---

### Q2 — What does an "additional sheet" actually look like?

Both forms say: *"If you need more space to write, attach additional sheets."*
They define nothing else. It is not clear whether that means a blank continuation
page, another copy of the questionnaire, or something else.

**Sub-questions:**
- If a continuation sheet is attached, **what goes in the box on the form itself?**
  ENF006 says *"Do not leave blank fields, use N/A if not applicable"* — so it can't
  be blank. **Can it say "SEE ATTACHED"?**
- Does the attached sheet need to be **labeled** — name, SSN, which conviction it
  belongs to?

**Fallback (already designed, robust either way):** the continuation sheet carries a
header block repeating **every identifier on the questionnaire** (name, SSN line,
county/state, court, date crime committed, date of conviction, exact crime,
"Questionnaire 3 of 7"). It cannot be orphaned regardless of TDLR's convention. The
form box gets `SEE ATTACHED CONTINUATION SHEET — QUESTIONNAIRE 3 OF 7`, which is not
a blank field.

**This is not a blocker. Build it.**

---

### Q3 — One event, four convictions: one narrative or four?

A single arrest routinely produces several convictions sharing a county, a court, a
date, and one story. Four questionnaires are required (F1). But item 14 asks for a
detailed description of the person's *actions*.

**May one attached explanation cover all four questionnaires from that event, or
must each questionnaire carry its own?** And would repeating an identical
explanation across four questionnaires look wrong to a reviewer?

**Fallback:** author the narrative **once per incident** (correct either way — it's
one event, it's one story, that's the truth). Then either:
- **(a)** one shared continuation sheet, referenced by all questionnaires from that
  incident, **or**
- **(b)** duplicate it into each questionnaire's continuation sheet.

**Make this a config toggle.** The data model is identical; only the assembly step
differs. Default to **(b)** — it's the safer of the two, since every questionnaire is
self-contained.

---

### Q4 — Is a CHEL reviewed by an Enforcement attorney?

The Guidelines describe an Enforcement Division **attorney** reviewing criminal-history
referrals for license applications, and say the pre-application evaluation uses the
**same process**. So probably yes.

**Not build-blocking.** It matters only for how we describe the process to users
(and for the capstone's accuracy). Don't assert it until confirmed.

---

### Q5 — Fee confirmation

$10.00, per license type, regardless of the number of convictions.

The May 2025 ENF006 and the TDLR FAQ both say $10. **However**, some TDLR PDFs for
other programs and a Google AI Overview say **$25**, and older form revisions
disagree. This goes on a checklist that tells someone the exact amount to put on a
money order. **A wrong number means a rejected packet.**

**Confirm before shipping the checklist.** Current build value: **$10**.

---

### Q6 — Can the packet be submitted through the TDLR webform?

ENF003 says the form may be uploaded to TDLR's secure site via the TDLR webform.
But the linked webform is a **General Inquiry contact form** (program dropdown,
name, DOB, phone, email, a 1000-character message box, attachments) — **not** a CHEL
submission portal. And the **fee must be a mailed cashier's check or money order**,
and TDLR won't process the request until the fee arrives.

**Working conclusion:** mail is the operative channel. **Say it precisely in the
proposal:** *"There is no online submission pipeline for this request. TDLR accepts
attachments through a general inquiry form, but the fee requirement makes mail the
operative channel."*

**Do not say "no state portal exists."** That's overclaiming and it's checkable.

---

### Q7 — ENF003 item 16 (renewals) — tick "No", or leave it unticked?

Item 16 asks: *"For renewals, did this conviction or deferred adjudication occur
since last license was issued?"*

**SurePath users are always NEW applicants** (item 1 = New). So item 16 is not
applicable. But it's a **radio button** — you can't write "N/A" into it, and ENF006
says *"Do not leave blank fields."*

Ticking **No** is factually defensible (no license was ever issued, so the
conviction did not occur since one was issued). Leaving it `/Off` risks a blank-field
rejection.

**Current build value: `/Choice1` (No).** Confirm with TDLR.

### Q8 — Expunged and sealed records: must they be disclosed? ⚠️ HIGH STAKES

**This is the most consequential open question in the project.**

TDLR's FAQ says: report all convictions and all deferred adjudications, no matter how old.
**It says nothing about expunction or orders of nondisclosure.**

- **Expunction** (Tex. Code Crim. Proc.) — record destroyed; the person may generally deny
  it occurred. Presumably TDLR never sees it.
- **Order of nondisclosure** (Tex. Gov't Code ch. 411) — record sealed from the public, but
  **certain agencies retain access**. Most commonly granted after **deferred adjudication**
  — which TDLR *does* require be reported.

**Ask TDLR, in these words:**
> "If someone received a deferred adjudication and later obtained an **order of
> nondisclosure**, must they still report it on a Criminal History Evaluation Letter
> request? And what about a record that was **expunged**?"

**Until answered — and quite possibly forever — SurePath does not advise on this.**
See `CLAUDE.md` **L8**. We state the difference, we say it's a question for TDLR or a
lawyer, and **we let the user decide.** We never omit a record for them, and we never tell
them they may omit one.

---

## NOT BLOCKED — product decisions still open

- **US map SVG on the landing page.** Nice-to-have. Ship the dropdown first.
- **Voice input on the narrative assistant** (`SpeechRecognition`). High user value,
  low cost. Cut if the sprint tightens.
- **Where the guidelines lookup appears** — Stage 6 only, or also previewed at Stage
  1? Leaning Stage 6 only, so users don't shop for a trade before facing their
  record.

---

## RESOLVED — do not reopen

| Was open | Resolved | How |
|---|---|---|
| Is the form ENF001? | **No — ENF006.** ENF001-I is the instruction sheet. | Decoded the form footers in the actual PDFs. |
| Is it N × ENF003? | **No — ENF006 + (N−1) × ENF003.** ENF006 carries conviction #1. | ENF006 p.2 contains the full criminal-history section (items 15–24). |
| X/Y coordinate stamping? | **No.** Both forms are **AcroForm with named fields.** | Extracted 32 fields from ENF006, 23 from ENF003. |
| 10-year lookback? | **No lookback. Report everything.** | TDLR FAQ #9, explicit. (The 7-year rule is California AB 2138 — different state.) |
| "Incident" vs "crime" — how many questionnaires? | **Per crime.** The FAQ's "incident" is loose drafting; the forms are unambiguous (items 13/15 are charge-specific). | Read the forms. *(Ask anyway — it's the setup for Q3.)* |
| localStorage vs sessionStorage vs accounts? | **None of them.** JSON export/import to the user's own disk. | localStorage leaks on library computers; accounts create a PII honeypot. |
| Mobile? | **Desktop-first, deliberately.** | Transcribing a 20-charge rap sheet is a sit-down task. |
| RAG for the guidelines? | **No.** It's a structured table → parse to JSON. | ~37 license types × 4–6 crime categories, rigidly regular. |
| ENF003 `MonthDayYear_2` vs `_3`? | **`_2` = date crime committed (item 11). `_3` = date of conviction (item 12).** | Field-probe render, read off the labeled overlay. |
| ENF003 `PO Phone Number 1` — parole or probation? | **PAROLE** officer's phone. Probation's is `Area Code Phone Number_3`. | Same. |
| ENF003 SSN field name? | The **bare** `See instruction sheet for disclosure information`. (Email is the one prefixed `ex johndoeaolcom...`.) | Same. |
| Checkbox export values? | **ENF006 = `/Yes`/`/No`. ENF003 = `/ChoiceN`, non-sequential AND semantically arbitrary**: `#17` parole **No = `/Choice3`, Yes = `/Choice1`** · `#18` probation **No = `/Choice2`, Yes = `/Choice1`** · `#16` renewals No = `/Choice1`, Yes = `/Choice2`. *(⚠️ Corrected 2026-07-14 — this row previously said parole Yes = `/Choice3`, which was INVERTED and shipped a packet claiming a not-on-parole man was on parole. `/Choice1` means Yes on `#17` and No on `#16`; the number carries no meaning.)* | Widget geometry off the real blank: each widget's `/AP` `/N` on-value **plus its rectangle**. "No" is the LEFT box, "Yes" is the RIGHT box — the only ground truth independent of us being right. Walking `/Fields` → `/Kids` → `/AP` `/N` alone found the *values* but not their *meanings*, which is how the inversion got in. See `CLAUDE.md` F8. |
| ENF006 county/state? | **Two separate fields.** The one *named* "County and State..." is **county only**. | Probe render. See F10 — ENF003 combines them into one. |
| Are the uploaded PDFs usable as templates? | **NO.** They contain developer test data — `/General Partnership` and `Renewal` were pre-ticked. **Re-download from tdlr.texas.gov.** | Dumped `/V` on every field. See `CLAUDE.md` D7. |
