# Data-collection quality — the standing standard

**This should never require a conversation. Every input in this application — and every
input added in the future, for any state — meets this checklist by default.** The point
of the app is that what the user types prints onto a government form they sign; input
quality IS product correctness here, not polish.

## The checklist — every field, no exceptions

1. **Right control for the value.** Finite set → select or radio (Suffix, Gender,
   disposition). Large known set → type-ahead over a bundled static list (County: 254
   entries in `data/states/texas/counties.json`, suggestions only — free text stays legal
   because out-of-state incidents name other states' counties). Truly open → text.
   Free text is the *last* resort, because free text is what prints typos onto forms.

2. **Masks are universal, not per-page.** If one date field auto-inserts slashes, every
   date field does. Dates: `formatDate` mask + `inputMode="numeric"` + pattern. Phone:
   `formatPhone`. ZIP: `formatZip`. A format inconsistency between two pages of the same
   flow is a bug, full stop.

3. **Validate the value, not the shape.** A mask proves format; it does not prove truth.
   Dates go through `dateProblem()` (`src/app/lib/format.ts`): real month, real day for
   that month (leap years included), not in the future, sane year. Cross-field rules run
   at the same layer: a disposition date cannot precede the crime date
   (`dateOnOrAfter`). "99/99/9999" passing a regex is not validation.

4. **Errors fire where the user is.** Live format errors ("banana" in a date field) show
   AT the field, immediately, via the `error` prop (`aria-invalid` + state-red message —
   `src/ui/Field.tsx`). Required-empty errors show at the field once the user attempts
   Continue (`AttemptedContext`, provided by AppLayout). On a failed Continue, the view
   scrolls to the first `aria-invalid` field. A summary count at the bottom is a
   supplement, never the display.

5. **Every field that prints into a fixed-size PDF box has a character budget.** pdf-lib
   shrinks overflow to fit, which prints ant-sized on the official form. Budgets live in
   `StateConfig.fieldBudgets` (offense, sentence, street, court, names), surface as a
   `maxLength` + counter (visible from 70% usage), and are derived per-state from the
   form's box geometry — re-probe when the forms revise.

6. **Multi-value data gets a list UI, not a delimiter convention.** "Other names" is
   add/remove entries, one name each (a maiden name and a prior alias are separate
   facts), joined for storage/fill. Never ask a user to know that semicolons are the
   separator.

7. **Autofill is the browser's, never a third party's.** `autoComplete` attributes on
   every identity field (`family-name`, `bday`, `street-address`, `postal-code`, `tel`,
   `email`). Mapbox/Google Places-style services are BANNED here — they stream identity
   keystrokes off-device and would falsify the privacy claims in the README. Everything
   in this checklist is client-side.

8. **Guidance survives refactors.** Info bubbles (ⓘ) and group descriptions are part of
   the field. Changing a field's control type without carrying its guidance is a
   regression.

## Two constraints that outrank "cleaner input"

- **The incident State field is never restricted to the flow's state.** Out-of-state and
  federal convictions are required disclosures (CLAUDE.md D1/D2); narrowing that dropdown
  drops convictions and voids the letter.
- **Nothing here talks to a server.** Lists ship with the app; validation runs in the
  browser; the only network call in the product remains the narrative assistant (D6).

## Where things live

| Concern | Location |
| --- | --- |
| Masks + date validation | `src/app/lib/format.ts` (`formatDate`, `dateProblem`, `dateOnOrAfter`) |
| Field error/counter rendering | `src/ui/Field.tsx` (`error`, `maxLength` → counter) |
| Attempted-continue signal | `src/app/validationUI.ts`, provided in `AppLayout` |
| Step-level rules | `src/app/sectionValidation.ts` |
| County list | `data/states/texas/counties.json` → `StateConfig.counties` |
| PDF character budgets | `StateConfig.fieldBudgets` (per state, geometry-derived) |
| Enforcement tests | `tests/sectionValidation.test.ts` (impossible dates, future dates, cross-field, leap day) |
