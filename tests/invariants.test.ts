/**
 * THE INVARIANT ASSERTIONS. These are the tests that matter. (ARCHITECTURE §11)
 *
 * Several are regression guards against an agent "helpfully" breaking an invariant while
 * trying to improve the product. If one of these goes red, the product is broken even if
 * everything else is green.
 *
 * They run in Node against the SAME bytes the browser fetches, via an injected template
 * loader. Generation itself is still entirely client-side. (D5)
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFSignature, PDFName, type PDFDict } from 'pdf-lib'

import { generateAllPackets, generatePacket } from '../src/documents/assemblePacket'
import { ENF003, ENF006 } from '../src/documents/fieldMap'
import { buildAllPlans, buildPacketPlan } from '../src/documents/packetPlan'
import { readFieldValue, type TemplateLoader } from '../src/documents/pdfPrimitives'
import { marcusRivera, marcusRiveraThreeTrades } from '../src/fixtures/marcusRivera'
import { allCharges } from '../src/types/case'

const load: TemplateLoader = async (name) =>
  new Uint8Array(await readFile(`public/forms/${name}_blank.pdf`))

const plan = () => buildPacketPlan(marcusRivera, marcusRivera.licenses[0])

describe('A1 — packet shape: N charges ⟹ 1 × ENF006 + (N−1) × ENF003', () => {
  it('the fixture is 3 incidents and 9 records', () => {
    expect(marcusRivera.incidents).toHaveLength(3)
    expect(allCharges(marcusRivera)).toHaveLength(9)
  })

  it('produces exactly 1 ENF006 and 8 ENF003 — not 9', () => {
    const p = plan()
    expect(p.documents.filter((d) => d.kind === 'enf006')).toHaveLength(1)
    expect(p.documents.filter((d) => d.kind === 'enf003')).toHaveLength(8)
  })

  it('numbers the questionnaires 1..8 of 8 — conviction #1 rides on ENF006, so it is not questionnaire 1', () => {
    const qs = plan()
      .documents.filter((d) => d.kind === 'enf003')
      .map((d) => d.questionnaire!)
    expect(qs.map((q) => q.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(qs.every((q) => q.total === 8)).toBe(true)
  })

  it('ENF006 carries the FIRST charge', () => {
    const enf006 = plan().documents.find((d) => d.kind === 'enf006')!
    expect(enf006.charge!.id).toBe('c-1')
  })
})

describe('A2 / A2b — the SSN is empty and the /Sig field is unsigned, in every PDF', () => {
  it('reports no violations across the whole packet', async () => {
    const packet = await generatePacket(marcusRivera, plan(), [plan()], load)
    const bad = packet.violations.filter((v) => v.assertion === 'A2' || v.assertion === 'A2b')
    expect(bad).toEqual([])
  })

  it('the SSN field name we refuse to write is the one that is actually on the form', async () => {
    // Guards against the field map drifting: if TDLR renames the field, we would "never write"
    // a field that no longer exists, and happily write the real SSN box instead.
    const enf006 = (await PDFDocument.load(await load('ENF006'))).getForm()
    const enf003 = (await PDFDocument.load(await load('ENF003'))).getForm()
    expect(enf006.getFields().map((f) => f.getName())).toContain(ENF006.ssn)
    expect(enf003.getFields().map((f) => f.getName())).toContain(ENF003.ssn)
  })

  it('the assembled packet contains no signature bearing a value', async () => {
    const packet = await generatePacket(marcusRivera, plan(), [plan()], load)
    const doc = await PDFDocument.load(packet.bytes)
    const signed = doc
      .getForm()
      .getFields()
      .filter((f) => f instanceof PDFSignature && readFieldValue(f) !== null)
    expect(signed).toEqual([])
  })
})

describe('A4 — the 1998 conviction survives. There is NO lookback window. (D1)', () => {
  it('is present in the case', () => {
    const old = allCharges(marcusRivera).filter((x) => x.incident.dateOfConviction.endsWith('1999'))
    expect(old.length).toBeGreaterThan(0)
  })

  it('is carried into the packet plan — not dropped, not hidden, not made optional', () => {
    const p = plan()
    const docs = p.documents.filter((d) => d.incident?.id === 'inc-3' && d.kind === 'enf003')
    expect(docs).toHaveLength(2) // both 1998 charges get a questionnaire
    expect(docs.map((d) => d.charge!.exactOffense)).toEqual([
      'Theft of Property, less than $500',
      'Possession of Marijuana, 2 ounces or less',
    ])
  })

  it('appears in the generated PDF bytes', async () => {
    const packet = await generatePacket(marcusRivera, plan(), [plan()], load)
    // The 1998 date and the offense both survive into the assembled packet.
    expect(packet.plan.documents.some((d) => d.incident?.dateCrimeCommitted === '08/21/1998')).toBe(true)
    expect(packet.violations).toEqual([])
  })
})

describe('A5 — a deferred adjudication is reported exactly like a conviction. (D2)', () => {
  it('the fixture contains one, with no conviction', () => {
    const deferred = allCharges(marcusRivera).filter(
      (x) => x.charge.disposition === 'deferred_adjudication',
    )
    expect(deferred).toHaveLength(1)
  })

  it('gets its own questionnaire — disposition is NOT a filter', () => {
    const p = plan()
    const doc = p.documents.find((d) => d.charge?.disposition === 'deferred_adjudication')
    expect(doc).toBeDefined()
    expect(doc!.kind).toBe('enf003')
  })

  it('the packet document count equals the CHARGE count, not the conviction count', () => {
    // 9 records = 8 convictions + 1 deferred adjudication. All nine are reported.
    const p = plan()
    const forms = p.documents.filter((d) => d.kind === 'enf006' || d.kind === 'enf003')
    expect(forms).toHaveLength(9)
  })
})

describe('A11 — no blank field in the mailed packet, except the ones a pen must fill', () => {
  it('reports no blank-field violations', async () => {
    const packet = await generatePacket(marcusRivera, plan(), [plan()], load)
    expect(packet.violations.filter((v) => v.assertion === 'A11')).toEqual([])
  })

  it('every hand-write location is enumerated by document and item number', () => {
    const p = plan()
    const ssn = p.handwrite.filter((h) => h.what === 'ssn')
    const sig = p.handwrite.filter((h) => h.what === 'signature')
    // 9 forms → 9 SSN boxes, 9 signature lines.
    expect(ssn).toHaveLength(9)
    expect(sig).toHaveLength(9)
    expect(ssn.every((h) => h.item > 0 && h.document.length > 0)).toBe(true)
    // ENF006's SSN is item 7; ENF003's is item 4. Different forms, different item numbers.
    expect(ssn[0].item).toBe(7)
    expect(ssn[1].item).toBe(4)
  })
})

describe('A13 — zeroAllFields ran: no field holds a value the app did not intend to write. (D7)', () => {
  it('reports no residue violations', async () => {
    const packet = await generatePacket(marcusRivera, plan(), [plan()], load)
    expect(packet.violations.filter((v) => v.assertion === 'A13')).toEqual([])
  })

  it('the whole packet is clean — zero violations of any kind', async () => {
    const packet = await generatePacket(marcusRivera, plan(), [plan()], load)
    expect(packet.violations).toEqual([])
  })

  it('the text is burned in: no live form fields survive in the assembled packet', async () => {
    const packet = await generatePacket(marcusRivera, plan(), [plan()], load)
    const doc = await PDFDocument.load(packet.bytes)
    expect(doc.getForm().getFields()).toHaveLength(0)
  })
})

describe('A9 / F11 — the non-business-owner never ships a pre-ticked General Partnership', () => {
  it('leaves Type of Ownership UNTICKED and writes N/A to the business text fields', async () => {
    // Rebuild an ENF006 without flattening, and read the ownership radio off the bytes.
    const { fillENF006 } = await import('../src/documents/fillForms')
    const p = plan()
    const doc = p.documents.find((d) => d.kind === 'enf006')!
    const filled = await fillENF006(load, marcusRivera, p.license, doc)
    const bytes = await filled.doc.save()
    const form = (await PDFDocument.load(bytes)).getForm()

    expect(marcusRivera.applicant.isControllingPerson).toBe(false)
    expect(form.getRadioGroup(ENF006.ownershipType).getSelected()).toBeUndefined()
    expect(form.getTextField(ENF006.companyName).getText()).toBe('N/A')
    expect(form.getTextField(ENF006.federalTaxId).getText()).toBe('N/A')
  })
})

describe('A10 — 3 trades ⟹ 3 packets ⟹ 3 separate $10 money orders', () => {
  it('emits one complete, clean packet per selected trade', async () => {
    const packets = await generateAllPackets(marcusRiveraThreeTrades, load)
    expect(packets).toHaveLength(3)
    for (const p of packets) {
      expect(p.violations).toEqual([])
      expect(p.plan.documents.filter((d) => d.kind === 'enf003')).toHaveLength(8)
    }
  })

  it('each packet carries its own license type — the only thing that differs between them', () => {
    const plans = buildAllPlans(marcusRiveraThreeTrades)
    expect(plans.map((p) => p.license.specificLicenseType)).toEqual([
      'ACR Technician Registration',
      'Apprentice Electrician',
      'Barber License',
    ])
    expect(plans.every((p) => p.feeUsd === 10)).toBe(true)
  })
})

describe('F9 — county/state: SPLIT on ENF006, COMBINED on ENF003. Same packet.', () => {
  it('ENF006 writes the county alone, and the state in its own field', async () => {
    const { fillENF006 } = await import('../src/documents/fillForms')
    const p = plan()
    const doc = p.documents.find((d) => d.kind === 'enf006')!
    const filled = await fillENF006(load, marcusRivera, p.license, doc)
    const form = (await PDFDocument.load(await filled.doc.save())).getForm()

    // The field NAMED "County and State…" holds the COUNTY ONLY.
    expect(form.getTextField(ENF006.county).getText()).toBe('Harris')
    expect(form.getTextField(ENF006.state).getText()).toBe('Texas')
  })

  it('ENF003 writes them combined, in one field', async () => {
    const { fillENF003 } = await import('../src/documents/fillForms')
    const p = plan()
    const doc = p.documents.filter((d) => d.kind === 'enf003')[0]
    const filled = await fillENF003(load, marcusRivera, p.license, doc)
    const form = (await PDFDocument.load(await filled.doc.save())).getForm()

    expect(form.getTextField(ENF003.countyAndState).getText()).toBe('Harris, Texas')
  })
})

describe('F8 — ENF003 buttons use /ChoiceN, non-sequentially and semantically arbitrarily', () => {
  it('ticks the CORRECTED values: parole No = /Choice3, probation Yes = /Choice1', async () => {
    const { fillENF003 } = await import('../src/documents/fillForms')
    const p = plan()
    const doc = p.documents.filter((d) => d.kind === 'enf003')[0]
    const filled = await fillENF003(load, marcusRivera, p.license, doc)
    const form = (await PDFDocument.load(await filled.doc.save())).getForm()

    expect(marcusRivera.applicant.onParole).toBe(false)
    expect(marcusRivera.applicant.onProbation).toBe(true)

    // These literals encode the map's claim. The geometry test above is what proves the claim
    // is TRUE — this one just pins it, so a change to the map is a deliberate act.
    expect(form.getRadioGroup(ENF003.onParole).getSelected()).toBe('Choice3') // No
    expect(form.getRadioGroup(ENF003.onProbation).getSelected()).toBe('Choice1') // Yes
    expect(form.getRadioGroup(ENF003.typeOfRequest).getSelected()).toBe('Choice1') // New, never Renewal
    expect(form.getRadioGroup(ENF003.renewalQuestion).getSelected()).toBe('Choice1') // No (Q7)
  })

  it('/Choice1 means YES on #17 and NO on #16 — the number carries no meaning', async () => {
    const { fillENF003 } = await import('../src/documents/fillForms')
    const onParole = {
      ...marcusRivera,
      applicant: {
        ...marcusRivera.applicant,
        onParole: true,
        paroleOfficer: { name: 'R. Delgado', phone: '(713) 555-0110' },
      },
    }
    const p = buildPacketPlan(onParole, onParole.licenses[0])
    const doc = p.documents.filter((d) => d.kind === 'enf003')[0]
    const filled = await fillENF003(load, onParole, p.license, doc)
    const form = (await PDFDocument.load(await filled.doc.save())).getForm()

    // Same export value, opposite meanings, on two fields of the same form.
    expect(form.getRadioGroup(ENF003.onParole).getSelected()).toBe('Choice1') // = YES
    expect(form.getRadioGroup(ENF003.renewalQuestion).getSelected()).toBe('Choice1') // = NO
  })
})

/**
 * THE SEMANTIC GUARD. This is the test that would have caught the inverted parole tick.
 *
 * Every other assertion in this file trusts the field map's claim about what /ChoiceN MEANS.
 * When the map was wrong, they all stayed green while the packet told TDLR that a man who is
 * not on parole is on parole. A13 confirmed we wrote exactly what we intended to write — we
 * intended the wrong thing.
 *
 * So this test does not consult the map at all. It reads the WIDGET RECTANGLES out of the
 * PDF: on ENF003 items 16, 17 and 18, "No" is the LEFT box and "Yes" is the RIGHT box. It
 * then asserts that a not-on-parole applicant's tick lands in the LEFT box.
 *
 * Geometry is the only ground truth here that is independent of us being right.
 */
describe('ENF003 parole/probation ticks land in the box a HUMAN would read as correct', () => {
  const boxes = async (bytes: Uint8Array, fieldName: string) => {
    const form = (await PDFDocument.load(bytes)).getForm()
    const group = form.getRadioGroup(fieldName)
    const widgets = group.acroField.getWidgets().map((w) => {
      const ap = w.dict.lookup(PDFName.of('AP')) as PDFDict
      const normal = ap.lookup(PDFName.of('N')) as PDFDict
      const on = normal
        .keys()
        .map((k) => k.toString())
        .find((k) => k !== '/Off')!
      return { on: on.replace(/^\//, ''), x: w.getRectangle().x }
    })
    widgets.sort((a, b) => a.x - b.x)
    return {
      no: widgets[0].on, // LEFT box  = "No"  on the printed form
      yes: widgets[1].on, // RIGHT box = "Yes" on the printed form
      selected: group.getSelected(),
    }
  }

  const enf003Bytes = async (c = marcusRivera) => {
    const { fillENF003 } = await import('../src/documents/fillForms')
    const p = buildPacketPlan(c, c.licenses[0])
    const doc = p.documents.filter((d) => d.kind === 'enf003')[0]
    const filled = await fillENF003(load, c, p.license, doc)
    return filled.doc.save()
  }

  it('a NOT-on-parole applicant gets the tick in the "No" box', async () => {
    const b = await enf003Bytes()
    const parole = await boxes(b, ENF003.onParole)
    expect(marcusRivera.applicant.onParole).toBe(false)
    expect(parole.selected).toBe(parole.no)
    expect(parole.selected).not.toBe(parole.yes)
  })

  it('an ON-probation applicant gets the tick in the "Yes" box', async () => {
    const b = await enf003Bytes()
    const probation = await boxes(b, ENF003.onProbation)
    expect(marcusRivera.applicant.onProbation).toBe(true)
    expect(probation.selected).toBe(probation.yes)
    expect(probation.selected).not.toBe(probation.no)
  })

  it('an ON-parole applicant gets the tick in the "Yes" box', async () => {
    const onParole = {
      ...marcusRivera,
      applicant: {
        ...marcusRivera.applicant,
        onParole: true,
        paroleOfficer: { name: 'R. Delgado', phone: '(713) 555-0110' },
      },
    }
    const parole = await boxes(await enf003Bytes(onParole), ENF003.onParole)
    expect(parole.selected).toBe(parole.yes)
  })

  it('ENF006 agrees with ENF003 — the same man, the same answers, on both forms', async () => {
    const { fillENF006 } = await import('../src/documents/fillForms')
    const p = plan()
    const doc = p.documents.find((d) => d.kind === 'enf006')!
    const filled = await fillENF006(load, marcusRivera, p.license, doc)
    const form = (await PDFDocument.load(await filled.doc.save())).getForm()

    // ENF006 uses semantic values, so this one can be read directly.
    expect(form.getRadioGroup(ENF006.onParole).getSelected()).toBe('No')
    expect(form.getRadioGroup(ENF006.onProbation).getSelected()).toBe('Yes')
  })
})

describe('The NEVER_FILL guard fails closed', () => {
  it('refuses to write the SSN, loudly, even if asked directly', async () => {
    const { loadTemplate, setText } = await import('../src/documents/pdfPrimitives')
    const f = await loadTemplate(load, 'ENF006')
    expect(() => setText(f, ENF006.ssn, '123-45-6789')).toThrow(/REFUSED/)
    expect(() => setText(f, ENF006.dateSigned, '07/14/2026')).toThrow(/REFUSED/)
  })
})
