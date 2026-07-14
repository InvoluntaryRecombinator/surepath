# SurePath — Design System

> **This file exists to prevent one specific failure: the app looking like generic,
> AI-generated slop.** Floating white cards on gray. Rounded inputs with drop shadows.
> A lonely 600px centered column. `bg-blue-600` buttons. Emoji.
>
> Every rule below is enforceable. **§8 is a hard ban list.** Read it before writing a
> component.

---

## 1. The thesis

> **THE FORM IS THE ENEMY. THIS SITE IS THE ANTIDOTE.**

TDLR's form is hostile: dense, cramped, badly designed, and it is the reason people give up
before they start. SurePath's entire promise is **"you never have to face that document."**

Therefore: **the site must look like the opposite of the form.** Calm where the form is
cramped. Spacious where it is dense. One decision at a time where it is a wall. Obvious
where it is confusing.

⚠️ **A correction, so nobody restores it.** An earlier revision of this file derived the UI
from the government form itself — "ledger cells," ENF006's grid, its black header bars. That
was **wrong**. Grounding a design in the subject's materials is a real principle, but when
the artifact is *the thing you are rescuing people from*, you do not pay homage to it. **Do
not make this site look like a government form. Do not reference ENF006's layout. Do not
reclaim its design devices.** There is nothing there worth reclaiming.

### The line that matters

| | |
|---|---|
| **PDF correctness** | **Life or death.** Field map, `/Choice3`, `zeroAllFields()`, `/Sig` untouched, no blanks. See `CLAUDE.md` F1–F10. **Nothing here changes, ever.** |
| **PDF aesthetics** | **Irrelevant.** The user sees the PDF **once, at the end, already finished.** It is never a design reference. |

**The user is never asked to think about the PDF. That's the product.**

## 2. What it should feel like

Typeform, not the DMV. A calm interview with someone who is on your side.

- **Screen boundaries follow the TASK boundary, not the field boundary.**

  ⚠️ **Correction — an earlier revision said "one decision per screen." That was wrong**,
  lifted from Typeform without checking whether it applies. It doesn't. Typeform's
  one-question-per-screen works for *surveys*, where questions are independent. Here the
  user is **transcribing a row off a rap sheet** — county, court, date committed, date
  convicted, offense, sentence. **That is one row. It belongs on one screen.** Making
  someone click Next six times per conviction, nine times over, would be actively hostile.

  A screen holds **one task**: "who are you" (~10 fields), "tell me about this arrest"
  (incident fields + a repeating charge block), "tell me what happened that night" (one
  story). **The stepper's steps ARE the task boundaries.**
- **Obvious click targets.** These users are stressed, often on old machines and bad
  monitors, doing the hardest paperwork of their lives. **Affordance beats cleverness every
  single time.** Nothing minimal, nothing tricky, nothing they have to figure out.
- **Generous space**, but not empty — you should always know what to do next.

### The floating-tiny-box problem — and the two rules that kill it

A short screen (three fields) rendered as a `max-w-2xl` box **vertically centered** in a
tall viewport gets framed like a portrait — dead air above *and* below. It looks broken.

1. **NEVER vertically center page content. Ever.** Content starts at a fixed offset below
   the header and grows downward. A short page is just a short page — the empty space ends
   up *below the fold*, where nobody looks, instead of framing the content like a museum
   piece.
2. **A sticky bottom action bar.** Back / Continue, pinned to the viewport. Now every screen
   has a top edge and a bottom edge and **nothing floats.** This is what real products do
   (Stripe, Linear) and it reads as professional instantly.
3. Soft rule: a screen with only three fields should carry **more weight, not more air** —
   bigger type, real explanation. **If a screen feels empty, we usually didn't say enough;
   the box isn't too small.**

### Where the polish actually comes from

There **will** be a lot of ordinary boxes. Forms are forms. **Don't fight that.** The
distinctiveness budget goes to the surfaces that aren't forms:

1. **The stepper** (§5.5) — the anchor.
2. **The header / wordmark** — small, confident.
3. **The counter** (§6) — `3 incidents · 9 convictions · 22 pages · $10`.
4. **The incident cards on the story-select screen** — wide, thin, listed. **Lists are where
   design gets to be good.** This should be the best-looking screen in the app.
5. **The review screen** — also a list. Also a chance.
6. **Micro-moments** — the checkmark landing, the counter ticking up, the step transition.

**Forms are competent. Chrome and lists are where it looks expensive.**
- **The stepper is the anchor** (§5.5). The counter is the promise (§6).

## 3. Palette — six tokens. That is all there is.

```css
@theme {
  --color-paper:   #E7E0CF;   /* warm ground. WHY: white glares on a bad monitor. That's the whole reason. */
  --color-card:    #F2EDE1;   /* lifted surface for inputs/panels */
  --color-ink:     #1C1E26;   /* body text. near-black, slightly blue. */
  --color-rule:    #B6AE99;   /* borders, dividers */
  --color-pen:     #1F3A8A;   /* primary actions, focus, links */
  --color-state:   #B3261E;   /* HARD REQUIREMENTS ONLY */
  --color-muted:   #6B6553;   /* captions, hints */
}
```

**Seven values. Nothing else exists.** The Tailwind default palette is **disabled** (§8) —
an agent physically cannot type `bg-blue-500`, because it isn't there.

`--color-state` is for **real requirements only**: a blank required field, a missing
conviction, a genuine warning. **Never a stylistic accent. Never a delete button.**

> **Deliberately avoided:** khaki + burnt orange. That lands on the most common AI-design
> cliché (cream ground, warm-clay accent) and reads as generated no matter how well it's
> executed.

## 4. Type

| Face | Role |
|---|---|
| **Public Sans** | Everything. Headings, prose, buttons, labels, guidance. |
| **IBM Plex Mono** | **Only for data the user entered** — dates, offense names, case details. |

The mono is **functional, not conceptual**: it makes the review screen scannable, so a
nine-conviction list can be checked at a glance against a rap sheet. That's the entire
reason. No philosophy attached.

> **Public Sans** is the U.S. government's open typeface — built for legibility and forms,
> free, and *not* the default choice (that's Inter, which is banned in §8).
>
> **No display serif.** A high-contrast serif on a warm ground is AI-design cliché #1. Scale
> and weight do the work: Public Sans 800, large, tight tracking, for the few moments that
> need force.

```css
--font-sans: "Public Sans", system-ui, sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, monospace;
```

## 5. Inputs — normal, obvious, well-made

**Nothing clever. Nothing minimal. Nothing to figure out.**

```css
.field input {
  background: var(--color-card);
  border: 1px solid var(--color-rule);
  border-radius: 4px;
  box-shadow: none;                 /* NEVER a drop shadow. That's the slop tell. */
  font-family: var(--font-mono);    /* user data */
  font-size: 1rem;
  padding: 0.75rem;
  width: 100%;
}
.field input:focus {
  outline: none;
  border-color: var(--color-pen);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-pen) 20%, transparent);  /* focus RING — required */
}
.field input[data-invalid] { border-color: var(--color-state); }
```

Label above (Public Sans, medium, `--color-ink`). Hint below (small, `--color-muted`). A
real `<label>` on every input.

**A focus ring is not a drop shadow.** Rings are required — they're an accessibility floor.
Drop shadows on cards and inputs are what's banned.

**Layout:** generous single column, ~640px, centered, one decision per screen. Two fields
side by side only when they're genuinely a pair (month/day/year, county/state). **No dense
grids. No black header bars. No ledgers.**

---

## 5.5 The stepper — the single biggest lever on whether this feels premium

A long multi-step wizard lives or dies on its stepper. Get this right and the whole app
reads as considered.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  SUREPATH        ✓───────✓───────●───────○───────○───────○                        │
│                  YOUR     YOUR    YOUR    YOUR    REVIEW  PACKET                  │
│                  TRADE   RECORD   STORY  LICENSES                                 │
│                                                                                   │
│                  Step 3 of 6 · Your story        3 INC · 9 CONV · 22p · $10       │
└──────────────────────────────────────────────────────────────────────────────────┘
  Sticky. ~64px. 1px --color-rule bottom border. NO SHADOW.
```

**Why cheap steppers look cheap:** equal-width segments, generic circles, an icon-library
checkmark, a blue fill, a tooltip. Avoid all five.

**What makes this one read as expensive:**

- **Three states that differ in FORM, not just color** — legible at a glance, no decoding:
  - **Done** — filled `--color-pen` disc, hairline check, label at full weight.
  - **Current** — `--color-pen` **ring**, unfilled, slightly larger. Label at full weight.
  - **Ahead** — hollow, `--color-rule`, label at 50% opacity.
- **The connector fills.** `--color-pen` behind you, `--color-rule` ahead. It is a *record
  of work done*, not decoration.
- **Real labels**, Public Sans, uppercase, small, tracked. Never numbers alone.
- **The second line does two jobs:** `Step 3 of 6 · Your story` (orientation) on the left,
  the **live counter** on the right.
- **Completed steps are clickable. Future ones are not.** Always able to go back and fix
  something. Never able to skip work.
- **150ms color transition. That is the ENTIRE animation budget.** No spring, no GSAP, no
  bounce. **Restraint is what reads as expensive.**

**Wordmark:** type-only for now — `SUREPATH` in Public Sans 800, tight tracking, ink. A
type-only wordmark is honest as a placeholder and usually beats a bad logo. Leave room for
a mark later.

## 6. The counter — the emotional core

Persistent. Always visible. Top-right of the rail. **Monospace.** It grows as they work.

```
3 INCIDENTS · 9 CONVICTIONS · 22 PAGES · $10
```

The form is infinite. **This is finite.** That single line is the product's promise,
rendered. Do not bury it, do not make it a "stat card," do not put it behind a tab.

## 7. The progress rail

**Thin. Fixed. Does not eat the page.** ~44px, hairline bottom border in `--color-rule`.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  SUREPATH   ·──●──○──○──○──○──○   YOUR RECORD    3 INC · 9 CONV · 22p · $10│
└────────────────────────────────────────────────────────────────────────────┘
     ↑           ↑                       ↑                    ↑
  wordmark   stage dots            current stage           the counter
             (done = filled ink, current = ring, ahead = hollow)
             CLICKABLE backward. Never forward past incomplete work.
```

- Dots, not a filling bar. A bar implies a percentage we can't honestly compute.
- Completed stages are **clickable** — they can always go back and fix something.
- No animation beyond a 150ms color transition. **No GSAP. No spring physics. No confetti.**

## 7.5 Component primitives

Use **Radix primitives** underneath (focus management, keyboard nav, accessible
dropdowns/dialogs). Do **not** hand-roll these in an 11-day sprint.

**Do NOT use Shadcn's default theme.** Shadcn's out-of-the-box look *is* the AI-slop look —
it is precisely what an agent emits by default. **Radix for behavior. Our seven tokens for
everything visible.**

## 8. BAN LIST — enforceable, non-negotiable

Set these up so violating them is *impossible*, not merely discouraged. Same philosophy as
`CLAUDE.md`: make the wrong thing unreachable.

**Disable the entire default Tailwind palette.** Only the seven tokens in §3 exist.

| Banned | Why |
|---|---|
| `bg-blue-500`, `text-gray-600`, any default Tailwind color | Not in the system. Disabled at the theme level. |
| **Drop shadows** on inputs, cards, or the rail | The single loudest "AI generated this" tell. *(A **focus ring** is not a drop shadow. Focus rings are required — see §5.)* |
| Rounded cards floating on a gray background | We have a **ledger**, not a deck of cards. |
| Border radius above 2px | 2px on things you touch. 0 on things that organize. |
| Shadcn's default theme | It *is* the slop look. Radix primitives only; our tokens for everything visible. |
| **Anything that makes the site resemble the government form** | Ledgers, dense grids, black header bars, boxed cells, numbered form-style sections. **The form is the enemy.** |
| Minimal/clever inputs (bare underlines, invisible fields) | **Affordance beats cleverness.** Stressed users on bad monitors must never guess where to click. |
| A lonely centered 600px column with acres of dead space | You said it yourself: *too much white space is glaring*. **Density is honest here** — the real form is dense. Use a measured two-column grid that mirrors it. |
| Gradients. Any gradient, anywhere. | |
| Emoji, anywhere, ever | These are people's criminal records. |
| **Inter** | The default typeface tell. We use Public Sans. |
| A high-contrast serif display on a warm ground | AI-design cliché #1. |
| Icon-library decoration (icons that don't *do* anything) | Structure encodes truth or it doesn't exist. |
| The word **"Submit"** | Name the real action: **"Generate my packet."** |
| The words **eligible, qualify, your chances, likely** | `CLAUDE.md` **L1**. This is a **CI-blocking lint rule (A6)**, not a style note. |

## 9. Layout

- **Single column, ~640px, centered.** One decision per screen.
- Pair two fields side by side only when they're genuinely a pair (month/day/year,
  county/state).
- **The narrative step is the only full-bleed takeover.** Nothing else earns it.
- **No dense grids. No black header bars. No ledger.** We are not reproducing the form.

## 10. Copy

- **Active voice. Name the real action.** "Generate my packet," never "Submit." The button
  that says *Generate* produces a screen that says *Generated*.
- **Errors don't apologize and are never vague.** Say what happened and how to fix it.
  *"Item 13 is blank. TDLR will not process a request with blank fields."*
- **Empty states are invitations**, not decoration. *"No convictions added yet. Start with
  the oldest one on your record."*
- **Be specific, never clever.** These users have been condescended to by systems their
  whole lives. Say the true thing plainly.
- **Never soften the hard facts.** $10 per trade. 90 days. Every conviction, no matter how
  old. Say it once, say it clearly, and don't say it again.

## 11. Quality floor — build it in, don't announce it

Responsive down to a laptop. Visible keyboard focus (the rule thickens — you get it free).
`prefers-reduced-motion` respected. Real labels on every input. **These users are often on
old machines with old browsers. Nothing fancy.**


---

## 12. The shell — wireframe

> **On wireframes generally:** don't make image mockups. **An agent reads text, not
> pictures**, and it will deviate from a mockup anyway. Write the *structure* down (below),
> then let the agent build the real screen — **you get a real thing in an hour, and a real
> thing is far better feedback than a picture of a thing.**

### The frame (every screen)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  SUREPATH        ✓───────✓───────●───────○───────○───────○         [Save]  [Clear]    │  ← sticky, 64px
│                  YOUR     YOUR    YOUR    YOUR    LICENSES REVIEW                     │    1px rule below
│                  TRADE    INFO   RECORD   STORY                                       │    NO SHADOW
│                                                                                       │
│                  Step 3 of 6 · Your record        3 INC · 9 CONV · 22p · $10          │  ← counter, mono
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│      ┌────────────────────────────────────────────────────────────┐                   │
│      │                                                            │                   │
│      │   CONTENT — starts at a FIXED offset. Grows DOWNWARD.      │  ← ~640px         │
│      │   ⚠️ NEVER VERTICALLY CENTERED. A short page is just       │    left-ish,      │
│      │      a short page; the dead space goes BELOW the fold,     │    not floating   │
│      │      where nobody looks.                                   │    in the middle  │
│      │                                                            │                   │
│      └────────────────────────────────────────────────────────────┘                   │
│                                                                                       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│   ← Back                                                          Continue →          │  ← STICKY BOTTOM.
└──────────────────────────────────────────────────────────────────────────────────────┘    Every screen has a
                                                                                             bottom edge. Nothing
                                                                                             floats. This alone
                                                                                             kills the tiny-box bug.
```

### Stage 4 — Your story (the best-looking screen in the app)

Lists are where design gets to be good. This one is a list. **Spend the effort here.**

```
   YOUR STORY
   TDLR asks what you did and why, for every conviction. Write it once per
   incident — one arrest, one account.

   ┌──────────────────────────────────────────────────────────────────────────┐
   │  ☑   MAR 14 2019 · Harris County · 178th District Court                   │
   │      Possession of a Controlled Substance · Evading Arrest · Assault      │   ← mono
   │      3 charges                                                  Edit →    │
   └──────────────────────────────────────────────────────────────────────────┘
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  ☐   JUL 22 2016 · Harris County · 351st District Court                   │
   │      Theft of Property ≥ $100 < $750                                      │
   │      1 charge                                        Tell this story →    │
   └──────────────────────────────────────────────────────────────────────────┘
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  ☐   NOV 02 2011 · Dallas County · 194th District Court                   │
   │      Criminal Mischief · Driving While Intoxicated                        │
   │      2 charges                                       Tell this story →    │
   └──────────────────────────────────────────────────────────────────────────┘

                                                             1 of 3 stories done
```

Wide, thin cards. Checkbox on the left. Charges in mono. **Continue is disabled until all
three are checked** — Item 21 cannot be blank or TDLR won't process the request. But the
copy is kind, not an error:

> *"2 of 3 still need an explanation. TDLR won't process a request with Item 21 left blank."*

### The narrative takeover (click a card)

**The only full-bleed screen in the app.** It earns it.

```
   ← Back to your record

   MARCH 14, 2019 · HARRIS COUNTY
   Possession of a Controlled Substance · Evading Arrest · Assault        ← ALL charges,
                                                                            visible while
   ───────────────────────────────────────────────────────────────────      they write.
                                                                            This is the point.
   What happened?
   ┌──────────────────────────────────────────────────────────────────┐
   │                                                                  │
   └──────────────────────────────────────────────────────────────────┘

   Why did you make the decisions you made?
   ┌──────────────────────────────────────────────────────────────────┐
   └──────────────────────────────────────────────────────────────────┘

   What has changed since then?
   ┌──────────────────────────────────────────────────────────────────┐
   └──────────────────────────────────────────────────────────────────┘

   What have you done to make it right?
   ┌──────────────────────────────────────────────────────────────────┐
   └──────────────────────────────────────────────────────────────────┘

   ┌─ WHAT TDLR LOOKS AT ─────────────────────────────────────────────┐   ← static copy.
   │  Tex. Occ. Code §53.025(a) — the factors TDLR weighs:            │     NOT model output.
   │  time elapsed · your conduct and work before and after ·         │     Quoted. Cited. (L5)
   │  evidence of rehabilitation · letters of recommendation          │
   └──────────────────────────────────────────────────────────────────┘

   [ Phase 4: "Help me write this" lands here. Phase 2: nothing. ]

                                                              Save this story →
```

**All the charges from that night are on screen while they write.** That's not decoration —
it's what makes one honest account possible instead of three amputated fragments.

### The FAQ panel

TDLR published 16 FAQs. **The state's own words, on the state's own site** — quotable,
citable, scrivener-safe. Surface them **where the question actually arises**, not on a help
page nobody opens.

```
   ▸ What if I can't remember which court it was?
   ▸ Do I have to report a DWI? Isn't that a traffic violation?
   ▸ I got deferred adjudication and wasn't technically convicted. Do I still report it?
   ▸ ⚠️ What about expunged or sealed records?          ← OURS, not TDLR's. Marked OPEN. (L8)
```

Collapsed by default. Sits above the record intake. Content and placement live in
`data/tdlr_links.json` → `tdlr_faq_panel`.
