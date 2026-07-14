# SurePath — Product Requirements

> **Prerequisite:** read `CLAUDE.md` first. It contains the invariants. This
> document describes *what to build*; that one describes *what must never happen*.
> Where they conflict, `CLAUDE.md` wins.

---

## 1. The problem

A justice-impacted person who wants to enter a licensed trade faces a trap.

They can spend **four to five years** and thousands of dollars — an HVAC or
electrical apprentice logs on the order of 8,000 hours to reach a journeyman exam —
and then be denied the license at the end, over a conviction from a decade ago,
on discretionary criteria. The loss is not the tuition. It is a **career they
already built, capped**.

After a denial, the only recourse is a full administrative appeal: litigation
against the board's government counsel, escalating to court, requiring a lawyer,
with historically low success.

**Texas offers an escape hatch almost nobody uses.** Under Tex. Occ. Code §51.4012
and Ch. 53, anyone may ask TDLR to review their criminal history and issue a
**Criminal History Evaluation Letter (CHEL)** *before* enrolling in anything. It
costs $10. It takes up to 90 days. It forecloses nothing — it is advisory, and you
may still apply for the license regardless of what it says.

Utilization is near zero, because the process is a paper maze: a request form, a
separate questionnaire **for every single conviction**, a hand-written SSN on every
page, a cashier's check, and a P.O. box.

## 2. Who this is for

| User | Situation |
|---|---|
| **The returning citizen** | Out, wants a trade, has 3–20 convictions, doesn't know if it's worth trying. Likely at a desktop — a library, a program office, a friend's laptop. |
| **The reentry caseworker** | Runs 40 cases. Needs to produce correct packets at volume without becoming a paralegal. |
| **The trade-school admissions officer** | Loses funding if placement rates fall. Wants to pre-clear applicants before enrolling them. |

The MVP serves the first two. The third is the business model, not the build.

## 3. What SurePath actually does — the arithmetic

This is the value proposition. It is not "the form is confusing." It is arithmetic.

**A realistic user: 4 arrest events, 12 convictions.** (Not unusual. One traffic
stop can produce a DUI, driving on a suspended license, possession, and resisting
— four convictions from one night.)

Every field on the packet sorts into exactly one of three tiers:

| Tier | Fields | Entered by hand | Entered in SurePath |
|---|---|---|---|
| **User** | name, all known names, DOB, gender, address, phone, email, program, license type, parole status + officer, probation status + officer | on **every one** of 12 documents | **once** |
| **Incident** | county, state, court, date crime committed, date of conviction | on every document for that event | **once per event** (4×) |
| **Charge** | exact offense name, sentence imposed | genuinely unique per conviction | **once per conviction** (12×) |

**Only two fields on the entire packet are genuinely charge-unique.**

> **By hand:** ~19 fields × 12 documents = **~228 field entries**, plus **12
> separate narratives**, plus writing the SSN 12 times.
>
> **With SurePath:** ~11 user fields + (4 × 5 incident fields) + (12 × 2 charge
> fields) = **~43 entries**, plus **4 narratives**. SSN still hand-written 12
> times — that part is the state's requirement and we do not touch it.

That's the pitch. **We do not make the form easier to read. We make it harder to
fail.**

### The three real value-adds, ranked

1. **You cannot silently omit a conviction.** Omission is the failure mode that
   voids the letter — TDLR runs a full DPS/FBI fingerprint check at the real
   application and finds what you left out. SurePath forces a structured,
   countable record and makes you reconcile it against your official rap sheet.
2. **You enter shared data once.** See the arithmetic above.
3. **You find out what the state expects of you.** TDLR's *Guidelines* say the
   applicant is responsible for providing evidence of rehabilitation, employment,
   and paid restitution — **and neither form has a field for any of it, or mentions
   it exists.** A person filling this out alone will never know. (⚠️ See
   `OPEN_QUESTIONS.md` — whether this may be submitted *with a CHEL request* is
   pending TDLR confirmation.)

### What it is not

It is not magic. It turns a monumental effort into a manageable one. That is the
honest claim and it is enough.

## 4. MVP scope

**In:** Texas / TDLR, end to end. One user journey: landing → record → licenses →
review → downloadable packet + mailing checklist.

**Out (explicitly, and say so in the proposal so it reads as a decision, not a gap):**

- Mobile optimization (see `CLAUDE.md` S2)
- User accounts / any database (D4)
- Arizona (designed for, not built)
- Rap-sheet OCR ingestion — *the obvious V2 feature, deliberately deferred: a
  silent parse failure produces exactly the omission the product exists to
  prevent, and that needs human-in-the-loop verification UX we can't validate in
  this window.*
- Appeals (L7)
- E-filing / online submission

---

## 5. Screen-by-screen flow

**Paginated stages, not one long scroll.** A 20-charge endless scroll *is* the
ENF006 experience reproduced in HTML. Discrete stages give a progress indicator,
natural save points, and let the completeness check be a wall the user must
acknowledge rather than something buried mid-scroll.

**Exception:** *within* Stage 4, the record is one scrollable page of cards — the
user needs to see the whole thing at once to notice what's missing.

Persistent chrome on every stage: progress indicator, **"Save progress"** (JSON
export), and a **"Clear my data"** button (these users are on shared computers).

---

### Stage 0 — Landing

- Logo, hero line, one-sentence explanation.
- **Choose your state.** SVG map of the US with the ~20 states that have a
  pre-application process highlighted, or a plain dropdown. *Map is a nice-to-have;
  build the dropdown first and only do the map if there's time.*
- Texas is the only live option. Every other state → **"Not yet supported"** page
  that names the state and says the process exists there but isn't built yet.

*Note: only Texas is real. Do not fake data for other states.*

### Stage 1 — Texas overview + **"Is my trade even here?"**

Two jobs. **Expectation-setting**, and — critically — **letting the user find out in
thirty seconds whether this tool can help them at all.**

> **Design note (a correction).** An earlier draft of this PRD put *all* occupation
> handling at Stage 6, after the record. That was wrong, and wrong in a way that
> contradicted the product's own premise. SurePath's entire pitch is *"find out
> before you commit."* Making someone type in nine convictions before telling them
> what they're even finding out about inverts that on screen one.
>
> **And the failure case is severe:** if someone wants to be a **nurse** (Texas Board
> of Nursing) or a **doctor** (Texas Medical Board), TDLR does not license them at
> all — different agency, different form, out of scope. Letting that person complete
> the single most painful hour of data entry of their life and *then* telling them
> they were in the wrong building is not a UX flaw. It is a betrayal of the exact
> person this exists for.
>
> **The fix: separate BROWSE from SELECT.**
> - **Browse** (*"is my trade here?"*) needs **no record** → **Stage 1**.
> - **Select + guidelines lookup** (*"which letters do I want, and what does TDLR
>   publish about my offenses relative to each?"*) is **worthless without** the
>   record → **stays at Stage 6**.

**1 — What Texas actually offers.** Plain words. Honest, not a sales page.

- Texas lets you ask TDLR about your record **before** you enroll in anything.
- **$10** per trade. TDLR answers **within 90 days**.
- **It is advisory.** Not binding on TDLR. No appeal from it. You can still apply for
  the license no matter what it says. **Asking forecloses nothing — it costs you $10
  and time, and nothing else.**
  *(This single paragraph **is** the "triage" for Texas. There is nothing to warn
  about here, and no recommendation to make. Do not manufacture one. **L1, L2.**)*
- **You must disclose your entire criminal record** — every conviction and every
  deferred adjudication, **no matter how old**. The real license application runs a
  full DPS/FBI fingerprint check. What you leave out here gets found there, and it
  makes this letter worthless. (H4)
- Link to TDLR's own CHEL page.

**2 — The trade catalog + coverage gate.** *(This is a cheap feature with a large
payoff, and it's a strong five-second demo moment.)*

- A **searchable list** of every trade TDLR licenses, grouped by industry.
- A prominent search box: **"What do you want to do?"**
- **If their trade IS TDLR-regulated** → show it, let them **shortlist** it
  (a soft "I'm interested" star — **no fee, no commitment, nothing written to a
  packet**). Multi-select. The shortlist carries forward to Stage 6.
- **If their trade is NOT TDLR-regulated** → say so **immediately, plainly, and
  without wasting their time**:
  > *"Nursing is licensed in Texas by the Board of Nursing, not by TDLR. They have
  > their own criminal history evaluation process and their own form. SurePath
  > doesn't support that board yet. Here's their page."*

  **Then stop.** Do not walk them into an hour of data entry for a packet that goes
  to the wrong agency.

**Why shortlist and not select?** Because the *fee commitment* shouldn't happen before
they know what the work costs, and because the guidelines lookup at Stage 6 may
legitimately change their mind. Shortlist is a foot in the door. Selection is a
decision made with information.

CTA → **"First, get your record."**

### Stage 1.5 — What this actually involves ⚠️ (the anti-abandonment screen)

**Not a numbered step.** An interstitial. It is not work — it's an honest statement of the
cost, before anyone types a single character.

> **Placement rationale.** This lands *after* the trade catalog, not before. The trade gate
> is a **hard filter** — if you want to be a nurse, nothing else matters and you deserve to
> know in thirty seconds. This screen is a **commitment decision**, and you can't make it
> meaningfully until you know the tool applies to you at all. Telling a would-be nurse
> *"this will take an hour and require your full criminal history"* before telling them
> *"we can't help you"* is the worse order. **Both land before any typing.**

**The abandonment problem this solves:** people start, get twenty minutes in, hit the wall
of *"wait, I need my rap sheet,"* and quit. Or they reach the narrative, realize how heavy
it is, and quit. **The fix isn't a better funnel. It's honesty.** Tell them everything up
front and let them choose to come back ready. Counterintuitively this should *raise*
completion — the people who start are the people who are actually ready.

**Say, plainly:**

- This means cataloguing your **entire criminal record.**
- **Every conviction.**
- **Every deferred adjudication** — even though a deferred adjudication is technically not
  a conviction, **TDLR requires it.**
- **Every misdemeanor**, not just felonies. *(A DWI counts. TDLR says so explicitly.)*
- **No matter how old.** There is no ten-year cutoff. There is no cutoff at all.
- ⚠️ **Expunged or sealed records:** *"We can't tell you whether those have to be disclosed.
  Expunction and an order of nondisclosure are different, and the answer is different for
  each. Ask TDLR or a lawyer before you decide."* **(`CLAUDE.md` L8 — we do not advise here,
  and we never decide for them in either direction.)*
- **This takes about an hour** if you have several convictions. **Longer without your record
  in front of you.**
- **You will also have to explain what you did and why, in detail, for each incident.**
  That part is hard. Set aside real time.
- **$10 per trade. Up to 90 days for TDLR's answer.**
- **You can save and come back. Nothing is lost.**

CTA → **"I understand — get my record"** · Secondary → **"Come back later"**

### Stage 2 — Get your record (the hard stop)

Do not let anyone believe they can guess.

- **Do not guess your record.** If you leave out a conviction, TDLR may recommend you — and
  then find the omission at the real application, where they run a **full DPS/FBI
  fingerprint check.** The letter becomes worthless, or worse.
- **Texas record:** request your criminal history from the **Texas Department of Public
  Safety.**
- **Out-of-state or federal convictions:** request an **FBI Identity History Summary.**
  *(TDLR requires you report in-state, out-of-state, **and** federal offenses.)*
- **Can't remember the court?** TDLR's own FAQ says: call the **county clerk**
  (misdemeanors) or **district clerk** (felonies) in the county where it happened.
- **What you'll need, for every conviction:** county & state · court · date the crime was
  committed · date of conviction or deferred adjudication · the exact offense name from
  your court records · the sentence imposed.

CTA → **"I have my record — start"** · Secondary → *"Continue without it"* (allowed, shows
the warning again — **we inform, we don't lock people out**).

### Stage 3 — About you

Collected **once**. Stamped onto every page of the packet.

Name (last/first/middle/suffix) · all names ever known by · DOB · gender · mailing address ·
phone · email · **on parole?** (→ officer name + phone) · **on probation?** (→ officer name +
phone) · **business owner?** (**default NO — company/DBA/Tax ID/ownership hidden**, written
as `N/A` in the PDF).

**There is no SSN field. There will never be an SSN field.** (D3) Show the copy explaining
why, right where the SSN would be.

### Stage 4 — Your record (facts only — no stories yet)

**Mechanical, fast, rap sheet in hand.** This is a transcription groove. **Do not interrupt
it.**

**Two doors, one structure:**

```
+ Add an incident      →  "one arrest or event that led to several charges"
+ Add a single charge  →  "one conviction, on its own"
```

A standalone charge **is** an incident with exactly one charge. Same type, same tree, same
PDF loop. **No second code path.** The UI never says "an incident with one charge" — that's
our word, not theirs.

**One incident = one screen**, holding:
- **Incident fields:** county · state · court · date crime committed · date of conviction
  *(these are almost always shared across every charge from one arrest — that's the whole
  reason incidents exist)*
- **A repeating charge block:** `+ Add a charge` → exact offense · sentence imposed.
  **These are the only two charge-unique fields on the entire packet.**

**The inheritance guard:** charge rows show inherited incident fields **read-only** with an
explicit *"inherited — edit"* affordance. `exactOffense` and `sentence` render **empty,
required, no default, no pre-fill.** (A12)

**Strict about completeness. Forgiving about precision.** You cannot skip a conviction. You
*may* write "Harris County — court unknown." **The design permits uncertainty; the copy
never invites it.**

**Running count, always visible:** `3 incidents · 9 convictions`

**No age filter. No lookback. Ever.** (D1)

### Stage 5 — Your story (a separate stage — this is the important structural change)

> **Design note — a correction, and it fixes a real bug.** An earlier revision buried the
> narrative *inside* the add-an-incident flow. Splitting it out is better for three reasons,
> and the third one is a defect in the old design:
>
> 1. **Rhythm.** Transcribing nine convictions is a groove. Stopping after each one to write
>    an essay about the worst night of your life destroys it and exhausts people. Do the
>    fast mechanical work first; it builds momentum and the end is already in sight.
> 2. **The checkmark list makes an unbounded emotional slog countable.** *"2 of 4 stories
>    done."*
> 3. **The old flow let someone write the story of an arrest before entering all four
>    charges from it.** This one guarantees the full charge list exists first — so when they
>    sit down to write about that night, **all four charges are on screen in front of
>    them.** That is materially better writing input, and it's what makes one honest account
>    possible instead of four amputated fragments.

**The screen:** a list of **wide, thin cards** — every incident and every standalone charge.
Each card shows the date, the county, and the charges it contains. Each card has a status:

```
☐  Mar 14 2019 · Harris County · 3 charges                    Tell this story →
☑  Jul 22 2016 · Harris County · 1 charge                     Edit
☐  Nov 02 2011 · Dallas County · 2 charges                    Tell this story →

   1 of 3 stories done
```

**Click a card → the narrative step takes over the screen.** Full width. No form chrome.
**The only full-bleed takeover in the app** — it earns it. Four structured prompts, the
static coaching copy (§53.025(a), cited), a plain textarea in Phase 2 / the assistant in
Phase 4. Save → **back to the list, checkmark landed.**

**Hard gate:** cannot advance until every card has a story. **Q21/Q14 cannot be blank —
TDLR will not process a request with a blank field.** But the copy is kind, not an error:
> *"2 of 4 still need an explanation. TDLR won't process a request with Item 21 left blank."*

**This stage feeds the agent cleanly:** each card = one `NarrativeContext` — that incident's
charges, dates, and court, and nothing else. No name, no DOB, no other incidents.
(`ARCHITECTURE.md` §8.4)

### Stage 6 — Choose your license(s)

**This comes AFTER the record, deliberately.**

Two reasons:
1. The guidelines lookup is worthless until we know their record.
2. **Occupation is a late-binding parameter.** The entire packet is
   occupation-independent except **two fields on ENF006** (Program, Specific License
   Type). So: fill everything once → fan out across N trades → N complete packets.
   That is the shotgun, and it only works if occupation binds last.

**This screen does not introduce trades cold.** The user already browsed the catalog
and **shortlisted** at Stage 1 — they knew before they typed a single conviction that
their trade was covered. Stage 6 is where the shortlist becomes a **decision**, now
that TDLR's guidelines finally have a record to speak to.

**What this screen shows:**

- **Their Stage 1 shortlist, pre-loaded**, plus the full catalog to add or remove from.
  *(MVP demo depth: barbering, HVAC, electrical. Breadth is real — ENF006 covers all
  TDLR programs — but curate for the demo.)*
- For each trade, using the parsed **Criminal Conviction Guidelines** table:
  *"TDLR publishes that these categories of crime relate to this occupation:
  [list]. TDLR's stated reason: [quote]."*
  **Cite it. Attribute it to TDLR. Do not interpret it.**
- **The honesty banner (H1/H2), prominently, not in a footnote:**
  > *"These guidelines are not an exclusive list — TDLR can consider crimes not
  > listed. TDLR also states that multiple violations of any criminal statute are
  > always reviewed, for any license type. **This does not tell you what TDLR will
  > decide. Only TDLR can tell you that.**"*

**Multi-select.** Running total, stated plainly:
> `3 trades selected → 3 separate packets → 3 separate $10 money orders → $30 total.`

**No screening. No red lights. No "this probably isn't worth it."** (L2 — TDLR
itself says no crime automatically disqualifies. We have no basis to.)

### Stage 6.5 — Supporting evidence ⚠️ PENDING

**Gate this behind a feature flag. Do not ship it until `OPEN_QUESTIONS.md` Q1 is
answered.**

TDLR's *Guidelines*, Section II, say the applicant is responsible for obtaining and
providing: recommendations from prosecution / law enforcement / correctional
authorities; proof of steady employment; proof of support of dependents; proof of
good conduct; and proof of **payment of all outstanding court costs, supervision
fees, fines, and restitution.**

**None of this is on either form.** Neither form mentions it exists.

If TDLR confirms it may be submitted with a CHEL request, this becomes a **checklist
+ a generated cover sheet** for the user's attachments. If TDLR says it's only
considered at the real license application, this becomes a **"here's what you'll
need later"** informational page.

Either way it is valuable. Build it as a toggle so the answer flips it in an hour.

### Stage 7 — Review

The completeness wall. This is where we prevent the failure mode.

- Personal info block (editable).
- **The count, large and unmissable:**
  > **"You have listed 9 convictions across 3 incidents."**
  > **"Check this against your official criminal history report. If a conviction is
  > missing, TDLR's answer may be wrong — and they will find it at the real
  > application, where they run a full fingerprint background check."**
- The full list: offense · date of conviction · court. *(Not the narratives — those
  are long and they've already reviewed them. The point here is **counting**.)*
- Warnings (H3):
  - This letter is **advisory**. TDLR is not bound by it.
  - It is **only as good as what you disclosed**.
  - A **new charge** between now and your real license application changes
    everything.
- Back / edit on every section.
- CTA → **"Generate my packet."**

### Stage 8 — Generate & download

Client-side. `pdf-lib`. No server. (D5)

**Per selected trade, assemble one packet:**

```
[ Page 1 ]   SurePath Mailing Checklist   ← FOR YOU. DO NOT MAIL THIS PAGE.
[ ENF006 ]   2 pages — user data + Conviction #1 (+ Program / Specific License Type)
[ ENF003 ]   × (N − 1)  — one per additional conviction
[ Continuation sheets ] — one per incident narrative
```

**The continuation sheet** carries a header block that repeats **every identifier on
the questionnaire**, so it cannot be orphaned no matter what filing convention TDLR
uses:

```
CRIMINAL HISTORY QUESTIONNAIRE — CONTINUATION SHEET
Applicant: [Last, First, Middle]              SSN: ______________ (write in by hand)
Continuation of Item 14 — Questionnaire 3 of 7

County/State of conviction:  Harris, Texas
Court:                       178th District Court
Date crime committed:        03/14/2019
Date of conviction:          11/02/2019
Exact crime:                 Possession of Controlled Substance, PG1 <1g
──────────────────────────────────────────────────────────────────────────
[narrative]
```

**The mailing checklist (page 1)** must be specific to *this* packet. Not generic.

```
☐ Write your Social Security Number by hand, in pen, in ALL 8 places:
      • ENF006, page 1, item 7
      • Questionnaire 1 of 7, item 4
      • Questionnaire 2 of 7, item 4
      • ... [enumerate every single one]
   Make sure it is the same number every time. Do not leave any of them blank —
   TDLR will not process a request with blank fields.

☐ Sign and date, in ink, in ALL 8 places:
      • ENF006, page 2, item 24
      • Questionnaire 1 of 7, item 19
      • ... [enumerate]

☐ Buy a $10 cashier's check or money order, payable to TDLR.
   (You selected 3 trades → you need 3 separate $10 money orders, one per packet.)
   DO NOT SEND CASH.

☐ Mail to:
      Texas Department of Licensing and Regulation
      P.O. Box 12157
      Austin, TX 78711-2157

☐ Keep a copy. TDLR does not return documents.

☐ This packet is 22 pages. Make sure you print and mail all 22.

☐ If you're on a shared or public computer: delete the downloaded PDF from the
   Downloads folder when you're done printing.
```

*(That last item matters: the "Clear my data" button doesn't touch the file the
browser wrote to disk.)*

**Also on this screen:** `Save progress (.json)` — so they can come back, add a
trade, or regenerate if they lose the PDF. This is the entire persistence layer.
(D4)

---

## 6. Acceptance criteria

These are the tests that matter. Several are regression guards against the
invariants — an agent will violate them while trying to be helpful.

| # | Given | Then |
|---|---|---|
| **A1** | A user with 3 incidents and 9 convictions | The packet contains exactly **1 × ENF006** and **8 × ENF003**. |
| **A2** | Any generated packet | The **SSN field is empty** in every PDF. |
| **A3** | Any user session | **No network request** contains the user's name, DOB, address, phone, email, or SSN. *(Assert on outbound payloads.)* |
| **A4** | A conviction dated **1998** | It is **retained**, appears in the packet, and is never hidden, dimmed, or marked optional. |
| **A5** | A deferred adjudication with no conviction | It is **captured and reported** like any other. |
| **A6** | The entire UI, all copy, all LLM output | The words **"eligible," "qualify," "your chances," "likely"** never appear in reference to the user. |
| **A7** | LLM narrative output | Every sentence traces to user input. Non-traceable sentences are **flagged** and require confirmation. |
| **A8** | Narrative variants | Labeled by **style only**. No variant is marked "recommended" or "strongest." |
| **A9** | A user who is not a business owner | Company / DBA / Tax ID / ownership fields are **hidden in the UI** and written as **`N/A`** in the PDF. |
| **A10** | 3 trades selected | 3 complete packets generated; the checklist says **3 separate $10 money orders**. |
| **A11** | Any generated packet | **No field is blank** except the SSN. (F6) |
| **A12** | An incident with 4 charges | The user must type a **distinct exact-offense name** for each; no pre-fill, no default. |
| **A14** | A user searches a trade TDLR does **not** license (e.g. "nurse", "doctor") | They are told **immediately**, at Stage 1, which board does regulate it and that SurePath doesn't support it — **before any data entry.** They are never walked into an hour of intake for the wrong agency. |

---

## 7. Open design questions (product, not blocked on TDLR)

- **US map SVG on the landing page** — nice-to-have. Dropdown first.
- **Voice input on the narrative assistant** — nice-to-have, high user value, cheap
  (`SpeechRecognition`). Cut if the sprint tightens.
- **Should the guidelines lookup show at Stage 6 only, or also as a preview at Stage
  1?** Leaning Stage 6 only, so users don't shop for a trade before they've faced
  their record. Revisit.
