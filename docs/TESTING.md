# SurePath — Testing Strategy

> **Test what fails SILENTLY. Everything else is noise.**
>
> Nearly every bug that matters in this project produces **a PDF that looks perfect and is
> wrong** — discovered months later by a stranger at a licensing board. The compiler won't
> catch it. Your eyes won't catch it. A code review won't catch it.
>
> **Only an assertion on the generated artifact will.**

---

## 1. What to TDD, and what not to

| TDD it | Why |
|---|---|
| **`packetPlan()`** | Pure. Precisely specified in the docs *before any code exists*. Fails silently. **The perfect TDD target.** |
| **`buildNarrativeContext()`** | Pure. Carries a hard invariant (D6 — no identifiers). |
| **`tickValue()` / the field-map adapter** | Pure. Encodes F8/F9/F11, all of them unguessable. |
| **`deriveCounts()`** | Pure. The counter lies to the user if this is wrong. |

| Do **NOT** TDD it | Why |
|---|---|
| React components | You don't know the design yet. The tests will churn harder than the code. |
| Styling, the stepper, layout | Look at it. That's the test. |
| Anything you're still exploring | TDD is for *specified* behavior, not discovery. |

**One exception on the UI side:** the **fetch guard** (A3). That gets an integration test, because
a PII leak is exactly the kind of thing you never see by looking.

---

## 2. Two rules that make the difference between a real test and a lie

### Rule 1 — Re-read the BYTES. Never inspect the in-memory object.

```ts
// ❌ THIS TEST CONFIRMS A LIE
const doc = await fillENF006(fixture)
expect(doc.getForm().getTextField('Social Security Number').getText()).toBeUndefined()

// ✅ THIS TESTS WHAT SHIPS
const bytes = await generatePacket(fixture, license)
const reread = await PDFDocument.load(bytes)      // ← from bytes. the real artifact.
```

The in-memory object can say `/Off` while the **appearance stream** still renders a tick.
`/V` and `/AS` are different things. **Assert on the bytes or you're asserting on your own
intentions.**

### Rule 2 — After `flatten()`, there are no fields left. Test BOTH sides.

`getFields()` on a flattened document returns `[]`. So an "SSN is empty" assertion needs two
shapes:

- **Pre-flatten:** the field's value is unset.
- **Post-flatten:** the extracted **text content** contains no SSN-shaped string.

The second one is the stronger test, because it's the thing that actually gets mailed.

### And: do NOT mock pdf-lib. Do NOT mock the forms.

Load the real blanks from `public/forms/` off disk (`fs.readFileSync` — pdf-lib is isomorphic,
it doesn't care). **The whole reason these tests exist is that the real forms are weird.** A
mock of a form you invented tests nothing.

---

## 3. The one test to write first

Before anything else, write this. It is the product's entire reason for existing, as one
assertion:

```ts
it('EVERY charge in the case appears in the packet — none dropped', () => {
  const plan = packetPlan(marcusRivera, hvac)

  const inCase   = marcusRivera.incidents.flatMap(i => i.charges.map(c => c.id))
  const inPacket = plan.documents.flatMap(d => d.chargeIds)

  expect(new Set(inPacket)).toEqual(new Set(inCase))
  expect(inPacket).toHaveLength(inCase.length)          // no duplicates either
})
```

**A set equality.** It catches *any* filter, *any* off-by-one, *any* dropped record, *any*
double-count — regardless of how the bug got in. If someone "helpfully" adds a lookback
window, **this test goes red.** (D1)

If you only ever write one test, write that one.

---

## 4. The files

```
tests/
  packetPlan.test.ts      ← the arithmetic. A1, A4, A5, A10. HIGHEST VALUE.
  narrativeContext.test.ts← the D6 leak test. Cheap, catches a security failure.
  fieldMap.test.ts        ← F8, F9, F11. The unguessable values, pinned.
  generatedPacket.test.ts ← A2, A2b, A11, A13. Slow. Runs on real bytes. THE ONE THAT MATTERS.
  copy.test.ts            ← A6. One regex over strings.ts. Ten seconds to write.
  fetchGuard.test.ts      ← A3. The PII leak.
```

---

## 5. `packetPlan.test.ts` — the arithmetic

```ts
import { describe, it, expect } from 'vitest'
import { packetPlan } from '../src/documents/packetPlan'
import { marcusRivera, singleConviction } from '../src/fixtures/marcusRivera'

const hvac = { program: 'Air Conditioning and Refrigeration', specificLicenseType: 'Technician' }

describe('packet composition (A1) — the off-by-one that ruins everything', () => {
  const plan = packetPlan(marcusRivera, hvac)   // 3 incidents, 9 convictions

  it('9 convictions → 1 × ENF006 + 8 × ENF003.  NOT 9 questionnaires.', () => {
    expect(plan.documents.filter(d => d.kind === 'enf006')).toHaveLength(1)
    expect(plan.documents.filter(d => d.kind === 'enf003')).toHaveLength(8)
  })

  it('conviction #1 rides on ENF006 and is NOT questionnaire 1', () => {
    const enf006 = plan.documents.find(d => d.kind === 'enf006')!
    const firstCharge = marcusRivera.incidents[0].charges[0].id
    expect(enf006.chargeIds).toContain(firstCharge)

    const q1 = plan.documents.find(d => d.kind === 'enf003' && d.ordinal === 1)!
    expect(q1.chargeIds).not.toContain(firstCharge)
  })

  it('questionnaires number 1..8, and the total is 8 — not 9', () => {
    const ordinals = plan.documents.filter(d => d.kind === 'enf003').map(d => d.ordinal)
    expect(ordinals).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(plan.questionnaireTotal).toBe(8)   // "QUESTIONNAIRE 3 OF 8"
  })

  it('THE BOUNDARY: 1 conviction → ENF006 and ZERO questionnaires', () => {
    const plan1 = packetPlan(singleConviction, hvac)
    expect(plan1.documents.filter(d => d.kind === 'enf003')).toHaveLength(0)
    expect(plan1.questionnaireTotal).toBe(0)
  })
})

describe('nothing is ever dropped (D1, D2)', () => {
  const plan = packetPlan(marcusRivera, hvac)

  it('EVERY charge in the case appears in the packet — THE test', () => {
    const inCase   = marcusRivera.incidents.flatMap(i => i.charges.map(c => c.id))
    const inPacket = plan.documents.flatMap(d => d.chargeIds)
    expect(new Set(inPacket)).toEqual(new Set(inCase))
    expect(inPacket).toHaveLength(inCase.length)
  })

  it('A4 — a 1998 conviction survives.  There is NO lookback window.', () => {
    const ancient = marcusRivera.incidents
      .flatMap(i => i.charges)
      .find(c => c.id === 'chg-1998')!
    expect(plan.documents.flatMap(d => d.chargeIds)).toContain(ancient.id)
  })

  it('A5 — a deferred adjudication with no conviction is reported like any other', () => {
    const da = marcusRivera.incidents
      .flatMap(i => i.charges)
      .find(c => c.disposition === 'deferred_adjudication')!
    expect(plan.documents.flatMap(d => d.chargeIds)).toContain(da.id)
  })
})

describe('the checklist cannot drift from the packet', () => {
  const plan = packetPlan(marcusRivera, hvac)

  it('one hand-written SSN per document: ENF006 + 8 questionnaires = 9', () => {
    expect(plan.ssnLocations).toHaveLength(9)
  })

  it('every SSN location names a real document and a real item number', () => {
    for (const loc of plan.ssnLocations) {
      expect(plan.documents.map(d => d.id)).toContain(loc.documentId)
      expect(loc.item).toBeGreaterThan(0)          // never "in all the places"
    }
  })
})

describe('multi-trade fan-out (A10)', () => {
  it('3 trades → 3 plans, 3 × $10, and IDENTICAL record content', () => {
    const plans = [hvac, barber, electrician].map(l => packetPlan(marcusRivera, l))
    expect(plans).toHaveLength(3)
    expect(plans.reduce((s, p) => s + p.feeUsd, 0)).toBe(30)

    // occupation is a LATE-BINDING parameter: only Program + License Type differ
    const charges = plans.map(p => p.documents.flatMap(d => d.chargeIds).sort())
    expect(charges[1]).toEqual(charges[0])
    expect(charges[2]).toEqual(charges[0])
  })
})
```

---

## 6. `narrativeContext.test.ts` — the leak test (cheap, and it catches a security failure)

The trick: **serialize the whole object and grep it for the fixture's actual values.** That
catches a leak no matter what shape it takes, and it survives schema changes.

```ts
describe('buildNarrativeContext — D6', () => {
  const incident = marcusRivera.incidents[0]     // 3 charges from one arrest
  const ctx = buildNarrativeContext(incident)
  const serialized = JSON.stringify(ctx).toLowerCase()

  it('carries NO identifiers.  None.  Not one.', () => {
    const identifiers = [
      marcusRivera.applicant.lastName,
      marcusRivera.applicant.firstName,
      marcusRivera.applicant.dob,
      marcusRivera.applicant.mailingAddress,
      marcusRivera.applicant.phone,
      marcusRivera.applicant.email,
    ]
    for (const id of identifiers) {
      expect(serialized, `LEAKED: ${id}`).not.toContain(id.toLowerCase())
    }
  })

  it('carries EVERY charge from the incident — that is the entire point', () => {
    // so the model can write "I had marijuana on me when the assault charge happened"
    // instead of three amputated fragments.
    expect(ctx.charges).toHaveLength(3)
    expect(ctx.charges.map(c => c.exactOffense))
      .toEqual(incident.charges.map(c => c.exactOffense))
  })

  it('carries NO charge from any OTHER incident', () => {
    const other = marcusRivera.incidents[1].charges[0].exactOffense
    expect(serialized).not.toContain(other.toLowerCase())
  })

  it('is PURE — same incident in, same context out, no ambient state', () => {
    expect(buildNarrativeContext(incident)).toEqual(buildNarrativeContext(incident))
  })
})
```

---

## 7. `fieldMap.test.ts` — pin the unguessable values

These tests exist to **freeze ground truth**. If someone "cleans up" the field map, they go red.

```ts
describe('button export values (F8) — proven, not remembered', () => {
  // ⚠️ CORRECTED 2026-07-14. An earlier revision of this example asserted parole
  // yes = Choice3 — INVERTED, copied from a field map that was itself wrong. Ground
  // truth, read off the widget geometry of the real blank ("No" is the LEFT box,
  // "Yes" is the RIGHT box — never trust the field name or the Choice number):
  //   #17 (parole)     no = Choice3   yes = Choice1
  //   #18 (probation)  no = Choice2   yes = Choice1
  it('ENF003 parole YES is Choice1 and NO is Choice3.  The number carries no meaning.', () => {
    expect(tick('ENF003', 'on_parole', 'yes')).toBe('Choice1')
    expect(tick('ENF003', 'on_parole', 'no')).toBe('Choice3')
  })

  it('ENF003 probation YES is Choice1 and NO is Choice2.', () => {
    expect(tick('ENF003', 'on_probation', 'yes')).toBe('Choice1')
    expect(tick('ENF003', 'on_probation', 'no')).toBe('Choice2')
  })

  it('the two forms use DIFFERENT conventions.  This is not a bug.', () => {
    expect(tick('ENF006', 'on_parole', 'no')).toBe('No')        // semantic
    expect(tick('ENF003', 'on_parole', 'no')).toBe('Choice3')   // ChoiceN, arbitrary
  })

  it('Choice1 means YES on #17 and NO on #16 — same form, same value, opposite meanings', () => {
    expect(tick('ENF003', 'on_parole', 'yes')).toBe(tick('ENF003', 'renewal_question', 'no'))
  })

  it('the leading slash is stripped for pdf-lib (the map stores the truth)', () => {
    expect(tick('ENF003', 'on_parole', 'yes')).not.toMatch(/^\//)
  })
})

describe('F11 — /Off is not an option', () => {
  it('you CANNOT select "off" on Type of Ownership.  You must CLEAR it.', () => {
    expect(() => tick('ENF006', 'ownership_type', 'none')).toThrow()
  })

  it('the five real options, and nothing else', () => {
    expect(ownershipOptions()).toEqual([
      'General Partnership', 'Sole Proprietor', 'Corporation', 'LLC', 'LLP',
    ])
  })
})

describe('F9 — county/state shape differs BETWEEN THE TWO FORMS', () => {
  it('ENF006 SPLITS county and state', () => {
    const f = enf006Fields({ county: 'Harris', state: 'Texas' })
    expect(f['County and State of conviction or deferred adjudication']).toBe('Harris')  // county ONLY
    expect(f['State (ex: Texas)']).toBe('Texas')
  })

  it('ENF003 COMBINES them into one field', () => {
    const f = enf003Fields({ county: 'Harris', state: 'Texas' })
    expect(f['ex Travis TX']).toBe('Harris, TX')
  })
})
```

---

## 8. `generatedPacket.test.ts` — slow, real bytes, and **the one that matters**

```ts
import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'node:fs'

describe('the generated packet — re-read from BYTES', () => {
  let bytes: Uint8Array
  let text: string

  beforeAll(async () => {
    bytes = await generatePacket(marcusRivera, hvac)   // the real thing. real blanks. no mocks.
    text  = await extractText(bytes)
  })

  it('A2 — no SSN-shaped string appears ANYWHERE in the mailed packet', () => {
    expect(text).not.toMatch(/\b\d{3}-?\d{2}-?\d{4}\b/)
  })

  it('A2b — the /Sig fields are unsigned', async () => {
    const doc = await PDFDocument.load(bytes)
    expect(doc.catalog.get(PDFName.of('AcroForm'))?.get?.(PDFName.of('SigFlags'))).toBeFalsy()
  })

  it('A13 — flattened: ZERO live fields remain.  Text is page content, not an editable box.', async () => {
    const doc = await PDFDocument.load(bytes)
    expect(doc.getForm().getFields()).toHaveLength(0)
  })

  it('A11 — no required field is blank in the MAILED packet', () => {
    // the generated PDF DELIBERATELY leaves SSN / signature / Date Signed empty.
    // the rule is about the mailed packet — the checklist enumerates every one.
    const plan = packetPlan(marcusRivera, hvac)
    for (const loc of [...plan.ssnLocations, ...plan.signatureLocations]) {
      expect(renderChecklist(plan)).toContain(`item ${loc.item}`)
    }
  })

  it('A9 — a non-business-owner is NOT a General Partnership', () => {
    // the D7 failure, as an assertion.
    expect(text).not.toContain('General Partnership')
    expect(text).toContain('N/A')   // company/DBA/TaxID written as N/A, group left CLEARED
  })

  it('the dates are not swapped', () => {
    // silent, unrecoverable, and the reason the field probe exists.
    const i = marcusRivera.incidents[0]
    const crimeIdx = text.indexOf(i.dateCrimeCommitted)
    const convIdx  = text.indexOf(i.dateOfConviction)
    expect(crimeIdx).toBeGreaterThan(-1)
    expect(convIdx).toBeGreaterThan(-1)
    expect(crimeIdx).toBeLessThan(convIdx)      // item 11 precedes item 12 on the page
  })
})
```

---

## 9. `copy.test.ts` — ten seconds to write, permanently useful

This is only possible because **every user-facing string lives in `copy/strings.ts`.** That's
why it lives there.

```ts
const BANNED = /\b(eligible|ineligible|qualif(y|ies|ied|ication)|disqualif\w*|your chances|you'?re likely|should pass|good candidate|strong case)\b/i

describe('A6 — SurePath never claims to know the outcome (L1)', () => {
  it('no banned word appears in any user-facing string', () => {
    for (const [key, value] of Object.entries(strings)) {
      expect(value, `strings.${key} → "${value}"`).not.toMatch(BANNED)
    }
  })

  it('...including loading messages and tooltips, where it creeps in by reflex', () => {
    expect(strings.generating).not.toMatch(BANNED)   // "checking whether you qualify" ← the classic
  })
})
```

---

## 10. `fetchGuard.test.ts` — A3

```ts
it('A3 — no outbound request carries readable PII', async () => {
  const calls: Array<[string, RequestInit | undefined]> = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (u, init) => {
    calls.push([String(u), init]); return new Response('{}')
  })

  await runFullFlow(marcusRivera)      // intake → generate → download

  for (const [url, init] of calls) {
    if (url.startsWith('/forms/')) continue          // static blank PDFs. fine.
    const body = String(init?.body ?? '')
    expect(body).not.toContain('Rivera')
    expect(body).not.toContain('04/11/1988')
    expect(body).not.toContain('Canfield')
  }
})
```

---

## 11. What these tests must NOT do

- ❌ **Mock pdf-lib or the forms.** The forms being weird **is the problem**. A mock of a form
  you invented tests nothing.
- ❌ **Assert on the in-memory PDF object.** It will confirm your intentions, not your output.
- ❌ **Test implementation details.** Nobody cares which helper called which. Test the
  **artifact** and the **invariant**.
- ❌ **Snapshot the PDF bytes.** They change on every pdf-lib bump and tell you nothing when
  they break.
- ❌ **Chase coverage.** A green 90% here would be a lie. **Fourteen assertions that each catch
  a silent, unrecoverable failure are worth more than four hundred that don't.**
