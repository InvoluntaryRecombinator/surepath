/**
 * The bridge test the docs called for and nobody wrote (BUILD_SEQUENCE Phase 2 done-when):
 * a HAND-ENTERED case — the draft shape the real UI produces — must generate the same
 * packet shape as the Phase 1 fixture, with zero invariant violations.
 *
 * Also: the converter fails closed. An incomplete draft throws with every problem named,
 * because a silently-defaulted Case becomes a signed federal form.
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { draftToCase, IncompleteDraftError } from '../src/app/convertDraft'
import { emptyApplicant, emptyDraft, type DraftCase } from '../src/app/draft'
import { generatePacket } from '../src/states/texas/documents/assemblePacket'
import { buildPacketPlan } from '../src/states/texas/documents/packetPlan'
import type { TemplateLoader } from '../src/states/texas/documents/pdfPrimitives'
import { marcusRivera } from '../src/states/texas/fixtures/marcusRivera'

const load: TemplateLoader = async (name) =>
  new Uint8Array(await readFile(`public/forms/texas/${name}_blank.pdf`))

/** Marcus Rivera, as the UI would have collected him — structured address, flat officer
 *  fields, narrativeDraft strings. Built from the fixture so the two can never drift. */
function handEnteredMarcus(): DraftCase {
  const f = marcusRivera
  return {
    version: 1,
    applicant: {
      ...emptyApplicant,
      lastName: f.applicant.lastName,
      firstName: f.applicant.firstName,
      middleName: f.applicant.middleName,
      suffix: f.applicant.suffix,
      allKnownNames: f.applicant.allKnownNames,
      dob: f.applicant.dob,
      gender: f.applicant.gender,
      addressStreet: '4412 Larkspur Lane, Apt 3B',
      addressCity: 'Houston',
      addressState: 'TX',
      addressZip: '77021',
      phone: f.applicant.phone,
      email: f.applicant.email,
      onProbation: true,
      probationOfficerName: f.applicant.probationOfficer!.name,
      probationOfficerPhone: f.applicant.probationOfficer!.phone,
    },
    incidents: f.incidents.map((i) => ({
      id: i.id,
      county: i.county,
      state: i.state,
      court: i.court,
      dateCrimeCommitted: i.dateCrimeCommitted,
      dateOfConviction: i.dateOfConviction,
      narrative: {
        rawAnswers: { facts: '', why: '', whatChanged: '', madeItRight: '' },
        draft: i.narrative.draft,
        affirmed: true, // the §7 affirmation — a hand-entered case is confirmed before generate
      },
      charges: i.charges.map((c) => ({
        id: c.id,
        exactOffense: c.exactOffense,
        sentence: c.sentence,
        disposition: c.disposition,
      })),
    })),
    licenses: f.licenses.map((l) => ({ ...l })),
  }
}

describe('draftToCase — the hand-entered case matches the fixture packet shape', () => {
  it('produces the same packet plan as the Phase 1 fixture', () => {
    const converted = draftToCase(handEnteredMarcus())
    const fromDraft = buildPacketPlan(converted, converted.licenses[0])
    const fromFixture = buildPacketPlan(marcusRivera, marcusRivera.licenses[0])

    // Same documents, same order, same numbering — the arithmetic that is the product.
    expect(fromDraft.documents.map((d) => d.label)).toEqual(
      fromFixture.documents.map((d) => d.label),
    )
    expect(fromDraft.handwrite).toEqual(fromFixture.handwrite)
    expect(fromDraft.mailedPages).toBe(fromFixture.mailedPages)
    expect(fromDraft.chargeCount).toBe(9)
  })

  it('generates a real packet with zero invariant violations', async () => {
    const converted = draftToCase(handEnteredMarcus())
    const plan = buildPacketPlan(converted, converted.licenses[0])
    const packet = await generatePacket(converted, plan, [plan], load)
    expect(packet.violations).toEqual([])
  }, 60_000)

  it('composes the structured address into the single mailing-address line', () => {
    const converted = draftToCase(handEnteredMarcus())
    expect(converted.applicant.mailingAddress).toBe('4412 Larkspur Lane, Apt 3B, Houston, TX 77021')
  })

  it('carries every charge and every disposition — nothing dropped, nothing defaulted (D1, D2)', () => {
    const converted = draftToCase(handEnteredMarcus())
    const inDraft = handEnteredMarcus().incidents.flatMap((i) => i.charges.map((c) => c.id))
    const inCase = converted.incidents.flatMap((i) => i.charges.map((c) => c.id))
    expect(new Set(inCase)).toEqual(new Set(inDraft))
    expect(inCase).toHaveLength(inDraft.length)
    expect(
      converted.incidents.flatMap((i) => i.charges).filter((c) => c.disposition === 'deferred_adjudication'),
    ).toHaveLength(1)
  })
})

describe('draftToCase — fails closed on anything incomplete', () => {
  it('throws with every issue named on an empty draft', () => {
    expect(() => draftToCase(emptyDraft())).toThrow(IncompleteDraftError)
    try {
      draftToCase(emptyDraft())
    } catch (e) {
      const err = e as IncompleteDraftError
      expect(err.issues.length).toBeGreaterThan(3)
      expect(err.issues.join(' ')).toContain('license')
    }
  })

  it('throws when an account is unaffirmed — they confirm what they sign (§7)', () => {
    const draft = handEnteredMarcus()
    draft.incidents[0].narrative.affirmed = false
    expect(() => draftToCase(draft)).toThrow(/confirm/)
  })

  it('throws when a story is missing — a blank Item 21 is a rejected packet', () => {
    const draft = handEnteredMarcus()
    draft.incidents[1].narrative.draft = '   '
    // generic without context; the state's own words with it
    expect(() => draftToCase(draft)).toThrow(/left blank/)
    expect(() => draftToCase(draft, { agency: 'TDLR', narrativeItemLabel: 'Item 21' })).toThrow(/TDLR.*Item 21/)
  })

  it('throws when no license is chosen', () => {
    const draft = handEnteredMarcus()
    draft.licenses = []
    expect(() => draftToCase(draft)).toThrow(IncompleteDraftError)
  })
})
