# SurePath — Site Structure & Architecture

> The app is **two different animals** sharing one design language. Getting this
> separation right is what keeps the codebase clean for review. Read before routing.

---

## 1. Two animals, two shells, shared primitives

**Animal 1 — the marketing site.** Static content. Anyone lands on any page. No
session, nothing sensitive. Normal header with nav, normal footer, SEO-able.

**Animal 2 — the application.** The left-rail form flow. Stateful, persistent, its
own frame (the rail — *no marketing header*), its own rules. You enter it from a
marketing page and stay in it until you leave with a finished packet.

They **share tokens and primitives** (colors, type, buttons, inputs, cards). They
have **different shells**. That separation *is* the clean architecture — spaghetti is
what happens when one shell tries to do both jobs.

```
<MarketingLayout>   header + nav + footer      →  content pages
<AppLayout>         left rail + content + no marketing header  →  the form flow
        both consume the same src/ui primitives and the same @theme tokens
```

## 2. Routes

```
/                    marketing — landing / hero
/about               marketing — content
/faq                 marketing — content (the full FAQ; a place to look nice later)
/states              marketing — choose your state (map or list; TX live, others "coming")
/texas               marketing — Texas intro: what the process is, "get your whole
                                 record first", the disclosure warning. CTA → begin.
/texas/apply         THE APP — <AppLayout>, the rail flow, its own state machine.
                       final step (generate → preview → download) stays inside the rail.
```

**Not a modal.** The app is its own full-screen **route** (`/texas/apply`), not a box
floating over a page. It should *feel* like "you've gone somewhere focused" — but it's
a real URL, so a refresh doesn't nuke progress and the person can bookmark where they
are. **Modal-feel, page-mechanics.**

**Per state = another route, same skeleton.** `/arizona`, `/arizona/apply` when the
time comes. It is **not** a JSON-injection into one shared page — it is a real route
per state that renders the shared chassis with that state's config (§3). A real page
per state, all sharing the components.

## 3. The state-config chassis — build once, populate per state

**This is the reusable-skeleton goal. Tell the agent explicitly, or it will hardcode
Texas everywhere and force a refactor later.**

`/<state>/apply` renders `<AppLayout>`, which reads **`stateConfig[<state>]`** — the
*only* thing that differs between states:

```ts
type StateConfig = {
  code: 'TX';
  label: string;                    // "Texas · TDLR"
  railSections: SectionDef[];       // TX has 5; another state might have 8, or different ones
  fields: /* which fields each section collects */;
  forms: /* the blank PDFs + field map for THIS state's packet */;
  copy: /* the state-specific strings */;
};
```

Everything else is **built once and reused**, driven by the config:

```
<Rail/>            ← renders railSections. A different state = a different list. That is the
                     whole "different sidebar per state" mechanism. Nothing else changes.
<Section/>         ← a step's content area
<IncidentCard/>    ← incident → charges (identical across states)
<StoryInterface/>  ← the narrative writer (identical, reusable — Phase 4)
<ReviewStage/>
<PacketGenerator/> ← reads forms + field map from the config
```

**Onboarding a new state = write its `StateConfig` (sections, fields, forms, copy).**
No layout change, no component change, no story-writer change. The rail is
**driven by the config's section list**, which is exactly the "populate the sidebar
differently / paginate within it" behavior.

For the MVP there is one config: `TX`. Build the seam anyway.

## 4. Persistence — DECIDED

- **Autosave to `localStorage`, constantly, every change.** Close the tab, reopen
  `/texas/apply`, land exactly where you were. **This is the whole point** — nobody
  clicks "Save" mid-session, so autosave must survive an accidental tab close, and
  that requires `localStorage`, not `sessionStorage`.
- **"Save my progress" (download JSON)** and **"Email it to myself"** are the
  *portability* path (move to another computer, come back later), **not** the
  survive-a-refresh path. Do not rely on the user clicking them to avoid data loss.
- **"Delete my information from this computer"** — prominent, at the end and reachable
  throughout. This is the mitigation for `localStorage` on shared/library machines.
- **Resume:** on load, if a saved profile exists in `localStorage`, offer to continue.
  Uploading a saved JSON file drops the user back in where they left off.

**Never say "localStorage" or "sessionStorage" to the user.** These users are
tech-wary and justice-impacted; the words alarm without informing. Frame storage as
**protection**, and deletion as **safety**, not loss:

> Progress bar: *"Your information is saved on this computer as you go — we never send
> it to our servers."*
>
> Delete button: *"We never store your information on our servers — it stays on this
> computer while you work. Click here to make sure nothing is left behind on this
> computer. Download or email your progress file first so you can pick up where you
> left off on any computer later."*

*(Note: there is no SSN anywhere in the stored data — D3 — so the most radioactive
field never touches the disk in the first place. That is what makes `localStorage`
defensible here.)*

## 5. The end of the flow (inside the rail, last section)

Generate → a brief loading animation (there's little real wait; the animation gives a
sense of *something was accomplished*) → **preview** (scroll the packet in an
in-browser viewer) → **download**, with the print/keep-a-copy/save-your-file guidance.
Then "I'm done" returns to a marketing page. All still inside `<AppLayout>`.

## 6. What a reviewer should see

- `src/marketing/` — the content pages, `<MarketingLayout>`.
- `src/app/` — the rail flow, `<AppLayout>`, the state machine.
- `src/ui/` — shared primitives consumed by both.
- `src/state-config/` — `tx.ts` today; each new state is a new file here.
- `src/documents/` — the packet service (already built), driven by the config's forms.

The separation of `marketing/` and `app/`, and the isolation of everything
state-specific into `state-config/`, is the architecture. It is what makes "onboard
Arizona" a matter of adding one config file, not editing the whole app.
