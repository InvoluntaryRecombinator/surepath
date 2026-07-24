# SurePath — Setup & Operating Manual

**This is the only file you need open while you build.** Pre-flight, then the prompt
sequence, then the rhythm.

---

# PART 1 — PRE-FLIGHT

## 1.1 What you need to grab

| Thing | When | Notes |
|---|---|---|
| **Node.js 20+** | now | `node -v`. Below 20 → install from nodejs.org. |
| **VS Code** | now | |
| **Claude Code CLI** | now | Run it from the **project root** so it auto-loads `CLAUDE.md`. |
| **git** | now | Non-negotiable. See §3.3. |
| ~~API keys~~ | **NOT YET** | **Phases 0–3 need ZERO keys.** |
| Anthropic API key | **Phase 4** | Only for the narrative assistant. |
| Email relay key | **Phase 7** | Only for escrow. Cuttable. |
| Domain | never (for this) | `npm run dev` on localhost **is** the demo. |

> **You do not need a backend, a database, a domain, or a single API key to build the
> document service and the entire intake wizard.** That isn't a shortcut — **it's the
> architecture.** (`CLAUDE.md` D4, D5.)

## 1.2 Scaffold

```bash
node -v                                          # must be >= 20

npm create vite@latest surepath -- --template react-ts
cd surepath
npm install
git init && git add -A && git commit -m "scaffold"

npm install pdf-lib
npm install tailwindcss @tailwindcss/vite
```

**`vite.config.ts`:**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({ plugins: [react(), tailwindcss()] })
```

> ⚠️ **Tailwind's install steps change between major versions.** If the above doesn't match
> what you see, **read the current Tailwind docs. Do not let the agent guess.** The part
> that matters is the **`@theme` token block** — that's the mechanism that makes the default
> palette *unreachable*.

### Why Vite and not Next.js

Next.js App Router makes **Server Components the default** and Server Actions the idiomatic
way to handle a form. An agent building a form in Next.js **will** reach for a server action
— that's what the framework wants. The moment it does, the user's name, DOB, address, and
criminal history flow through a server, violating **D5**, the invariant the entire security
story rests on.

> With **Vite**, D5 is enforced by **the absence of a server.**
> With **Next.js**, D5 is enforced by **developer discipline.**

`CLAUDE.md` exists because helpful agents violate invariants while trying to be useful.
**Pick the architecture where it structurally cannot.**

## 1.3 File placement — tick every box

```
surepath/
├── CLAUDE.md                        ☐  ROOT. Claude Code auto-loads it. NOT in docs/.
├── docs/
│   ├── SETUP.md                     ☐  (this file)
│   ├── BUILD_SEQUENCE.md            ☐  the agent executes against this
│   ├── ARCHITECTURE.md              ☐
│   ├── PRD.md                       ☐
│   ├── DESIGN_SYSTEM.md             ☐
│   └── OPEN_QUESTIONS.md            ☐
├── data/
│   ├── tdlr_field_map.json          ☐  THE VERIFIED FIELD MAP. Source of truth.
│   ├── tdlr_links.json              ☐  every external URL. Never hardcode one in a component.
│   └── tdlr_guidelines.json         ☐  ← Phase 3 builds this. Empty for now.
├── public/
│   └── forms/
│       └── texas/
│           ├── ENF006_blank.pdf     ☐  ⚠️ MUST be in public/ — the browser fetch()es these
│           └── ENF003_blank.pdf     ☐
└── src/
```

**Three things people get wrong here:**

1. **`CLAUDE.md` goes in the ROOT, not `docs/`.** That's what the CLI auto-loads.
2. **Texas blank PDFs go in `public/forms/texas/`.** The document service runs *in the browser*:
   ```ts
   const bytes = await fetch('/forms/texas/ENF006_blank.pdf').then(r => r.arrayBuffer())
   ```
   Anywhere else and they don't ship. The agent will lose an hour to this.
3. **Use the fresh blanks** (`public/forms/texas/ENF006_blank.pdf`,
   `public/forms/texas/ENF003_blank.pdf`) —
   form-pages-only, from tdlr.texas.gov, verified zero-residue. **Not the originals with
   instruction sheets attached** — you'd mail TDLR their own instructions.

---

# PART 2 — THE PROMPT SEQUENCE

**Do NOT one-shot this.** An agent given the whole spec will emit forty files, a third of
them wrong, and you'll spend two days untangling it. **Work in slices. Look at each one.**

## PROMPT 1 — Read and plan. **No code.**

```
claude
```

> Read `CLAUDE.md`, then `docs/BUILD_SEQUENCE.md`, `docs/ARCHITECTURE.md`,
> `docs/DESIGN_SYSTEM.md`, `docs/PRD.md`, and `docs/OPEN_QUESTIONS.md`.
>
> **Do not write any code yet.**
>
> Produce a plan:
> 1. The file tree you intend to create, with a one-line purpose for each file.
> 2. The TypeScript types you'll define, and where.
> 3. The five things in these docs you think are most likely to trip you up.
> 4. Anything in the docs that is ambiguous or contradictory — **ask me, don't guess.**
>
> Then stop and wait.

**Read the plan. This is the cheapest possible place to catch a misunderstanding.** If it
says "Next.js," "database," "localStorage," "ENF001," or "server action" — stop and fix it
now, not after 2,000 lines.

## PROMPT 2 — Phase 0 only. The smoke test.

> Execute **Phase 0** from `BUILD_SEQUENCE.md` — the day-1 smoke test. **Only Phase 0.**
>
> Write it as `src/smoke.ts`, runnable in the browser, printing PASS/FAIL for each of the
> eleven checks. Then stop.

**The one that can actually blow up: does `form.flatten()` throw on the `/Sig` field?**
If it does, **come back to me** — I have two fallbacks ready.

`git commit -m "phase 0: smoke test green"`

## PROMPT 3 — Phase 1. The document service. **Still no UI.**

> Execute **Phase 1**. The document service, driven by a hardcoded fixture. **No UI.**
>
> Fixture: Marcus Rivera, 3 incidents, 9 convictions, on probation, not on parole, not a
> business owner. **Include a 1998 conviction** (regression guard for D1) **and one deferred
> adjudication with no conviction** (D2).
>
> `data/states/texas/tdlr_field_map.json` is the source of truth. **Do not re-derive field names.**
>
> Green these tests before you stop: **A1, A2, A2b, A4, A5, A11, A13.**

**Then PRINT IT. On paper. Look at it.** If a human wouldn't mail it, it isn't done.

`git commit -m "phase 1: document service green"`

## PROMPT 4 — The shell. Design tokens, header, stepper, action bar. **No content.**

> Build **only the app shell** from `DESIGN_SYSTEM.md` §12:
> the `@theme` token block (**Tailwind's default palette DISABLED — only the seven tokens
> exist**), the header + wordmark, the stepper, the live counter, the sticky bottom action
> bar.
>
> Stub every stage as an empty page. **Never vertically center content.**
>
> Then stop. I want to look at it.

**LOOK AT IT. This is where you decide if it's ugly.** Fixing the shell now is ten minutes;
fixing it after six stages are built is a day.

`git commit -m "shell"`

## PROMPT 5 — One stage at a time

**Never more than one stage per prompt.** After each: look, correct, commit.

> Build **Stage 3 — Your record** (`PRD.md` Stage 4). Incidents → charges. Two doors
> (`+ Add an incident`, `+ Add a single charge` — same data structure). The inheritance
> guard: incident fields read-only on charge rows; `exactOffense` and `sentence` empty,
> required, no pre-fill.
>
> **One incident = ONE screen with all its fields.** Not one field per screen.
>
> Then stop.

Repeat for each stage. **Look at every one.**

## PROMPT 6 — STOP HERE

After Stage 5 (Review) and packet generation: **stop.** Do not build the narrative
assistant, the LLM proxy, the guidelines lookup, or the escrow email.

Leave `<NarrativeStep>` as a **plain textarea** writing to `narrative.draft`, and build
`buildNarrativeContext(incident)` as a **pure function** even though nothing calls it yet
(`ARCHITECTURE.md` §8.4, §8.5). **The seam must exist so Phase 4 drops in with no refactor.**

---

# PART 3 — THE RHYTHM

## 3.1 Build → LOOK → correct → commit

**Yes — build one screen, look at it, change it, then continue.** That's the loop. Every
time.

The failure mode is letting an agent run for an hour and produce six screens you've never
seen. You will not be able to tell *which* decision went wrong, and you'll rewrite more
than you fix.

## 3.2 Talk to it like you've been talking to me

**"I'm thinking X because Y"** beats a directive, every time. It lets the agent argue with
your *reasoning* instead of just obeying a conclusion — which is how it catches the thing
you missed.

Every real save in this project came from exactly that: *"I'm not trying to break the box,
I just want the site to look nice."* *"We can't hide the trade list until the end."*
**Keep doing that.**

## 3.3 Commit at every green checkpoint

```bash
git add -A && git commit -m "phase N: <what works now>"
```

Non-negotiable. When the agent goes sideways — and it will — you need a floor to fall back
to. `git reset --hard HEAD` is a lot cheaper than an argument.

## 3.4 When it violates an invariant

It will. That's what `CLAUDE.md` is for. Don't debate it — **point at the rule:**

> That violates **D1** in `CLAUDE.md`. Re-read it. There is **no lookback window** — every
> conviction is reported no matter how old. Remove the filter.

**Invariants are not negotiable and are not a matter of taste.** Cite the letter and move
on.

## 3.5 What you still owe the project

- ☐ **Make the TDLR call / send the email.** Q1–Q8 in `OPEN_QUESTIONS.md`.
      **Q8 (expunged/sealed records) is the highest-stakes one — get that one in WRITING.**
- ☐ **Verify the links** in `data/states/texas/tdlr_links.json` marked `"verify": false`
      (the FBI Identity History Summary URL and fee, and the county clerk directory).
- ☐ **Rewrite the proposal** to match the build: Texas only (not TX+AZ), no RAG, and the
      moat reframed as *verified state adapters*, not a triage classifier.
