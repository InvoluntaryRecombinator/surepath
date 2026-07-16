# SurePath — Design System

> **This file exists to prevent one specific failure: the app looking like generic,
> AI-generated slop.** Floating white cards on gray. Rounded inputs with drop shadows.
> A lonely 600px centered column. `bg-blue-600` buttons. Emoji.
>
> Every rule below is enforceable. **§8 is a hard ban list.** Read it before writing a
> component.

---

## 0. Read this first — the guardrails are a floor, not a ceiling

Most of this document is rules and prohibitions. **They are guardrails, not the goal.** They
exist to prevent specific, real failures (cards floating on gray; the default-Tailwind look;
the site accidentally resembling the government form it rescues people from). **Stay inside
them. But do not mistake "inside the guardrails" for "done."**

Within the tokens, the type, and the one-sheet rule, **you are expected to bring real craft.**
Judgment about rhythm, weight, spacing, and restraint is wanted here, not suppressed. A screen
that merely *avoids every banned thing* and stops there will be bland — and bland, for this
product, is a failure. **Clear the fences, then make it genuinely good.**

### What "good" feels like here

The emotional target is **"I am in steady, competent hands."** Not delight. Not playfulness.
Not flash. The person on the other side has nine convictions and is filling out paperwork that
decides their future. What earns their trust is **calm, clarity, and obvious competence** —
the feeling that whoever built this knew exactly what they were doing.

That is a real aesthetic, and it is hard to achieve. It is not the absence of design — it is
**disciplined** design. Reference points, in spirit:

- **Stripe** — dense information made calm. Nothing shouts; everything is legible; you trust it
  with your money without thinking about why.
- **Linear** — typographic confidence. Type, weight, and space do the work; almost no
  decoration; it still looks unmistakably *crafted*.
- **A great tax or legal product** (not a bad one) — it makes a frightening task feel handled.

**Calm is not the same as unfinished.** A first reviewer may read *restraint* as *incomplete*.
The answer to that is not to add flash — it is to make the restraint more precise: better
spacing rhythm, better type hierarchy, a more confident header, a cover page that carries the
brand. **Elevate through craft, not decoration.**

### Where flash IS welcome

Restraint governs the **form**. It does **not** govern:

- **The landing page** — nobody is vulnerable yet. Big type, motion, a real logo moment, scroll
  reveals. Sell hard.
- **The header and footer** — these frame every screen as a *product*. Make them genuinely
  polished.
- **The generated cover page and checklist** — **this is the sleeper.** It is the one piece of
  paper in the packet that is entirely *ours* — our fonts, our layout, our mark. It is the first
  thing anyone sees when the PDF downloads. Make it beautiful. It should look like a branded
  action plan, not a script dump. (Details in §13.)

**On the form screens themselves: elevate through precision, not ornament.** The win there is
that a scared person feels safe. Calm *is* the win.

---

## 1. The thesis## 1. The thesis

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

## 3. Palette — white fields on a soft warm ground

> ⚠️ **Two corrections from earlier revisions, both learned from live screenshots the
> human rejected:**
> 1. **The old khaki-on-khaki was murky** — input fields and background blurred into one
>    muddy surface. **Fix: crisp white/near-white fields on a soft tinted ground.** That
>    field-vs-ground contrast is what reads as clean and modern. See §5.
> 2. **Mono type is dead.** (See §4.) It made the whole thing read as dated and hostile.

```css
@theme {
  --color-ground:  #F1EBDD;   /* the app ground / rail. soft, warm, NOT white. */
  --color-surface: #FBF7EF;   /* a section/panel, one step lighter than ground */
  --color-field:   #FFFFFF;   /* INPUT FIELDS. crisp white. this is the contrast that fixes "murky". */
  --color-ink:     #24221C;   /* primary text */
  --color-muted:   #8A8266;   /* labels, hints, secondary */
  --color-line:    #D8D0BC;   /* borders, dividers */
  --color-accent:  #2A4BA8;   /* primary actions, focus, links, current-step. a warm confident blue. */
  --color-state:   #A6392F;   /* HARD REQUIREMENTS ONLY */
}
```

**Contrast must be present at every layer — subtle, but always there:**
- rail ↔ ground (rail slightly darker/different from the content ground)
- content ground ↔ section surface (section a touch lighter)
- section surface ↔ **white input field** (the strongest of the three — this is the one
  that kills "murky")

Not loud. Not high-contrast. **Present.** A flat single-tone screen is the failure.

`--color-state` (red) is for **real requirements only** — a required-field mark, a missing
conviction, a genuine warning. **Never a stylistic accent.** The exact tints above are a
starting point; tune them against the reference image the agent is given.

## 4. Type — one friendly sans. Mono is DEAD.

> ⚠️ **Correction — earlier revisions used IBM Plex Mono for "the record's voice."**
> **Remove it entirely.** On data-entry fields, mono reads as terminal, dated, and cold —
> it was the single biggest reason the live screens felt hostile and unfriendly. There is
> no mono in this product.

**One warm, highly legible sans, everywhere.** Labels, values, headings, buttons, prose.

- Recommended: **Inter is BANNED** (the default-AI tell). Use a friendly, humane sans —
  e.g. **Public Sans**, or another warm grotesque/geometric with real personality. Pick one
  with a friendly lowercase and good weights. Self-host it.
- **The label-vs-value distinction is carried by weight, color, and size — NOT by a second
  font:**
  - **Label** (what we ask): smaller, `--color-muted`, medium weight. It recedes.
  - **Value** (what they type): larger, `--color-ink`, on a white field. It's the figure.
- **Type must be comfortably large.** The old screens were too small and too tight. Generous
  size, generous line-height (~1.6 on prose). When in doubt, bigger.

```css
--font-sans: "Public Sans", system-ui, sans-serif;   /* or another friendly sans — NOT Inter, NOT mono */
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


### Placeholder examples in fields

Every field where the format isn't obvious carries a **greyed, legible example** as
placeholder text — it disappears on typing:

```
Sentence imposed:  [ e.g. 6 months county jail; $1,500 fine (paid)        ]
Exact offense:     [ e.g. Possession of Controlled Substance, PG1 <1g     ]
```

This teaches format without a manual, and it fills the empty-field silence with something
warm and human. Use it liberally.

### Info bubbles — help on demand, not flags everywhere

Some fields need deeper explanation (what "exact offense" means, why deferred adjudication
still counts). **Do not** put that explanation inline as a permanent block — that's flag
soup and it overwhelms. Instead: a small **ⓘ** next to the label. Click → a small dismissible
popover (with an ✕) explaining it. Quiet by default, there when needed.

```
Exact offense ⓘ *
```

This keeps the screen calm while making depth reachable — the opposite of drowning the user
in warnings. Reserve the always-visible red (`--color-state`) for real requirements; put
*explanation* behind the ⓘ.

### The rail (the app's left nav — see SITE_STRUCTURE.md)

The form flow uses a **persistent left rail**, not a top stepper. (Klaviyo's shape, chosen
because this product collects a lot of information and the rail gives the content room to be
long while keeping the user oriented.)

- Static on the left; content scrolls on the right; the rail stays put.
- The rail **is** the progress indicator — same three states as the stepper, vertical:
  done (filled accent + check) · current (accent ring + fill on the row) · ahead (hollow,
  muted). **A dashed connector between the dots** is welcome — it reads friendlier than bare
  gaps.
- Completed sections are **clickable**; future ones are not.
- The rail is **driven by the state config's section list** — a different state shows a
  different list, and that's the entire per-state difference. (SITE_STRUCTURE.md §3.)
- Counter (INCIDENTS · CONVICTIONS only) sits in the rail. Save / Delete live in the rail.
- **Logo:** a real mark (SVG) top-left when available — not just the wordmark. Placeholder
  wordmark is fine for now; leave the slot.

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
| **Cards floating on the khaki ground** | §4.5. **ONE SHEET.** This is "cards on gray" with a different palette. |
| **A border inside a border** | Two levels of nesting, max — and the second level is **indent + one left rule**, not a box. |
| **Dashed borders** | Cliché. A "+ Add" affordance is a text button with an icon. |
| **More than one elevated surface on a screen** | The sheet is it. |
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


---

## 13. The cover page & checklist — the one surface that is fully OURS

Every TDLR form in the packet looks how TDLR made it look — you cannot change them. **But the
cover page and the continuation/addendum sheets are generated by our code.** They are the only
paper in the packet with our fonts, our layout, and our mark. **Spend real craft here** — it is
the first thing anyone sees when the PDF opens, and in a demo it is what makes the product look
finished.

**This is not "later" polish. It is a demo centerpiece.** Treat it with the same care as a
landing page.

**The cover page (page 1, DO NOT MAIL):**
- SurePath wordmark/mark, top corner. Quiet, confident.
- The applicant's name and the trade this packet is for.
- A real, typeset **checklist** — actual checkbox glyphs, generous leading, not a text dump:
  - every place to hand-write the SSN, **by document and item number**
  - every place to sign, by document and item number
  - the exact money-order amount and payee
  - the mailing address, in a clean block
  - the page count ("you are mailing 22 pages")
  - the reminder to keep a copy, and to delete the download on a shared computer
- It should read like a **branded action plan**, not a wall of instructions.
- Typographically calm: our two faces, clear hierarchy, real white space. It can be beautiful
  and still be all business.

**The continuation / addendum sheets:** same typographic care. A clean header block (the
identifiers that link it to its questionnaire), then the narrative, set to read well on paper —
correct size, correct measure, correct leading. Not dumped 11-point text overflowing a box.

**Font sizing is a real requirement, not a nicety.** These are printed on a library printer and
read by a reviewer. Size, measure, and leading must be deliberate. This is exactly the kind of
detail that separates "looks like a product" from "looks like a script wrote it."
