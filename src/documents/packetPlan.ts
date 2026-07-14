/**
 * THE PLAN. Pure. No PDF bytes, no I/O, no pdf-lib.
 *
 * Everything downstream reads from this one object: the fill routines, the continuation
 * sheets, and the mailing checklist. That is deliberate — the checklist cannot tell the user
 * "sign in 8 places" while the packet contains 9, because they are not two descriptions of
 * the packet. They are one description, used twice.
 *
 * THE ARITHMETIC (F1):   N charges  ⟹  1 × ENF006 + (N−1) × ENF003
 * Conviction #1 rides on ENF006 and is NOT questionnaire 1. With 9 charges there are 8
 * questionnaires. Getting this wrong is an off-by-one that produces an incomplete packet.
 */
import { FEE_USD, CONTINUATION_SHEETS } from '../config/flags'
import { allCharges, type Case, type LicenseSelection } from '../types/case'
import type { HandwriteLocation, PacketDocument, PacketPlan } from '../types/packet'
import { FORM_PAGES, HANDWRITE_ITEMS } from './fieldMap'

/** The reference string written into the narrative box. Two forms, two strings. */
export function narrativeRef(doc: PacketDocument): string {
  if (doc.kind === 'enf006') return 'SEE ATTACHED CONTINUATION SHEET — REQUEST FORM'
  const q = doc.questionnaire!
  return `SEE ATTACHED CONTINUATION SHEET — QUESTIONNAIRE ${q.ordinal} OF ${q.total}`
}

/** The label of the continuation sheet that belongs to a given form document. */
export function continuationLabel(doc: PacketDocument): string {
  if (doc.kind === 'enf006') return 'Continuation sheet — Request form (item 21)'
  const q = doc.questionnaire!
  return `Continuation sheet — Questionnaire ${q.ordinal} of ${q.total} (item 14)`
}

export function buildPacketPlan(c: Case, license: LicenseSelection): PacketPlan {
  const charges = allCharges(c)
  if (charges.length === 0) {
    throw new Error('A packet with no convictions or deferred adjudications is not a packet.')
  }

  const questionnaireTotal = charges.length - 1 // ⚠️ NOT charges.length. (F1)
  const documents: PacketDocument[] = []
  const handwrite: HandwriteLocation[] = []

  // ── ENF006. Carries the applicant AND conviction #1. ─────────────────────────────────────
  const first = charges[0]
  const enf006: PacketDocument = {
    kind: 'enf006',
    label: 'ENF006 — Request for Criminal History Evaluation Letter',
    short: 'ENF006 (request form)',
    incidentIndex: first.incidentIndex,
    incident: first.incident,
    charge: first.charge,
    pages: FORM_PAGES.enf006,
  }
  documents.push(enf006)
  handwrite.push(
    { what: 'ssn', document: enf006.short, page: 1, item: HANDWRITE_ITEMS.enf006.ssn },
    { what: 'signature', document: enf006.short, page: 2, item: HANDWRITE_ITEMS.enf006.signature },
    { what: 'date_signed', document: enf006.short, page: 2, item: HANDWRITE_ITEMS.enf006.dateSigned },
  )

  // ── ENF003 × (N−1). One per ADDITIONAL charge. ───────────────────────────────────────────
  charges.slice(1).forEach((c2, i) => {
    const ordinal = i + 1
    const doc: PacketDocument = {
      kind: 'enf003',
      label: `ENF003 — Criminal History Questionnaire ${ordinal} of ${questionnaireTotal}`,
      short: `Questionnaire ${ordinal} of ${questionnaireTotal}`,
      questionnaire: { ordinal, total: questionnaireTotal },
      incidentIndex: c2.incidentIndex,
      incident: c2.incident,
      charge: c2.charge,
      pages: FORM_PAGES.enf003,
    }
    documents.push(doc)
    handwrite.push(
      { what: 'ssn', document: doc.short, page: 1, item: HANDWRITE_ITEMS.enf003.ssn },
      { what: 'signature', document: doc.short, page: 1, item: HANDWRITE_ITEMS.enf003.signature },
      { what: 'date_signed', document: doc.short, page: 1, item: HANDWRITE_ITEMS.enf003.dateSigned },
    )
  })

  // ── Continuation sheets. ─────────────────────────────────────────────────────────────────
  // CONTINUATION_SHEETS = 'per_questionnaire': one sheet per FORM DOCUMENT, so each is
  // self-contained and cannot be orphaned by TDLR's filing convention. The story itself is
  // authored ONCE PER INCIDENT (NARRATIVE_AUTHORING) and duplicated here — one arrest, one
  // account. (OPEN_QUESTIONS Q2/Q3, fallback (b).)
  const formDocs = documents.filter((d) => d.kind === 'enf006' || d.kind === 'enf003')
  const sheetSources =
    CONTINUATION_SHEETS === 'per_questionnaire'
      ? formDocs
      : // 'shared' — one sheet per incident, referenced by every questionnaire from it.
        formDocs.filter(
          (d, i) => formDocs.findIndex((x) => x.incidentIndex === d.incidentIndex) === i,
        )

  for (const src of sheetSources) {
    documents.push({
      kind: 'continuation',
      label: continuationLabel(src),
      short: `Continuation — ${src.short}`,
      questionnaire: src.questionnaire,
      incidentIndex: src.incidentIndex,
      incident: src.incident,
      charge: src.charge,
      pages: 1, // one page unless the narrative overruns; resolved for real at generation.
    })
  }

  const mailedPages = documents.reduce((n, d) => n + d.pages, 0)

  return {
    license,
    documents,
    handwrite,
    mailedPages,
    chargeCount: charges.length,
    incidentCount: c.incidents.length,
    feeUsd: FEE_USD,
  }
}

/** One plan per selected license. N trades ⟹ N packets ⟹ N separate $10 money orders. (F3, A10) */
export function buildAllPlans(c: Case): PacketPlan[] {
  return c.licenses.map((l) => buildPacketPlan(c, l))
}
