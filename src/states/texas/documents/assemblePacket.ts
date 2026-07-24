/**
 * Assembly. Plan → filled forms → generated pages → ONE Blob per selected license.
 *
 * Entirely client-side. The blank PDFs are static assets; the filling happens on the user's
 * machine; the completed packet is a Blob they download. No identity field ever leaves the
 * browser. (D5)
 */
import { PDFDocument } from 'pdf-lib'
import type { Case } from '../../../types/case'
import type { PacketPlan } from './types'
import { fillENF003, fillENF006 } from './fillForms'
import { generateContinuationSheet, generateMailingChecklist } from './generatedPages'
import { buildAllPlans } from './packetPlan'
import { browserTemplateLoader, flatten, type TemplateLoader } from './pdfPrimitives'
import { verifyAssembledPacket, verifyFilledForm, type Violation } from './verifyPacket'

export type GeneratedPacket = {
  plan: PacketPlan
  bytes: Uint8Array
  violations: Violation[]
  filename: string
}

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'packet'

export async function generatePacket(
  c: Case,
  plan: PacketPlan,
  allPlans: PacketPlan[],
  load: TemplateLoader = browserTemplateLoader,
): Promise<GeneratedPacket> {
  const violations: Violation[] = []
  const out = await PDFDocument.create()

  // 1 — the checklist. Page 1. FOR THE USER. NOT MAILED.
  const checklist = await generateMailingChecklist(c, plan, allPlans)
  const checklistPages = await out.copyPages(checklist, checklist.getPageIndices())
  checklistPages.forEach((p) => out.addPage(p))

  // 2 — the forms, in mailed order.
  for (const doc of plan.documents) {
    if (doc.kind === 'checklist') continue

    if (doc.kind === 'continuation') {
      const sheet = await generateContinuationSheet(c, plan, doc)
      const pages = await out.copyPages(sheet, sheet.getPageIndices())
      pages.forEach((p) => out.addPage(p))
      continue
    }

    const filled =
      doc.kind === 'enf006'
        ? await fillENF006(load, c, plan.license, doc)
        : await fillENF003(load, c, plan.license, doc)

    // VERIFY BEFORE FLATTEN — this is the only moment the fields still exist to be read.
    // We serialise, re-load, and interrogate the BYTES. Not the object we just wrote. (A13)
    const filledBytes = await filled.doc.save()
    violations.push(...(await verifyFilledForm(filledBytes, filled.intended, doc.label)))

    // Then burn the text in, so it prints identically on every library printer. Flatten the
    // document we already have in memory — the bytes above were for verification, and
    // re-parsing them here would just be a third full parse of the same PDF.
    flatten(filled.doc)
    const pages = await out.copyPages(filled.doc, filled.doc.getPageIndices())
    pages.forEach((p) => out.addPage(p))
  }

  const bytes = await out.save()
  violations.push(...(await verifyAssembledPacket(bytes)))

  return {
    plan,
    bytes,
    violations,
    filename: `surepath-packet-${slug(plan.license.specificLicenseType)}.pdf`,
  }
}

/** N trades ⟹ N complete packets ⟹ N separate $10 money orders. (F3, A10) */
export async function generateAllPackets(
  c: Case,
  load: TemplateLoader = browserTemplateLoader,
): Promise<GeneratedPacket[]> {
  const plans = buildAllPlans(c)
  const packets: GeneratedPacket[] = []
  for (const plan of plans) {
    packets.push(await generatePacket(c, plan, plans, load))
  }
  return packets
}
