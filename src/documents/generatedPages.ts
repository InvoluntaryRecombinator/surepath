/**
 * The pages SurePath generates itself: the continuation sheets, and the mailing checklist.
 *
 * PDF aesthetics are irrelevant (DESIGN_SYSTEM §1) — but PDF CORRECTNESS is life or death.
 * These pages exist to make the packet impossible to misfile and impossible to under-fill.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Case } from '../types/case'
import type { PacketDocument, PacketPlan } from '../types/packet'

const PAGE: [number, number] = [612, 792] // US Letter
const MARGIN = 54
const WIDTH = PAGE[0] - MARGIN * 2

type Pen = {
  page: PDFPage
  doc: PDFDocument
  y: number
  body: PDFFont
  bold: PDFFont
  mono: PDFFont
}

function newPage(pen: Pen): void {
  pen.page = pen.doc.addPage(PAGE)
  pen.y = PAGE[1] - MARGIN
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) > width && line) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

function write(
  pen: Pen,
  text: string,
  opts: { font?: PDFFont; size?: number; indent?: number; gap?: number } = {},
): void {
  const font = opts.font ?? pen.body
  const size = opts.size ?? 10
  const indent = opts.indent ?? 0
  const leading = size * 1.35

  for (const line of wrap(text, font, size, WIDTH - indent)) {
    if (pen.y < MARGIN + leading) newPage(pen)
    pen.page.drawText(line, {
      x: MARGIN + indent,
      y: pen.y,
      size,
      font,
      color: rgb(0, 0, 0),
    })
    pen.y -= leading
  }
  pen.y -= opts.gap ?? 0
}

function rule(pen: Pen): void {
  if (pen.y < MARGIN + 12) newPage(pen)
  pen.page.drawLine({
    start: { x: MARGIN, y: pen.y },
    end: { x: MARGIN + WIDTH, y: pen.y },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  })
  pen.y -= 14
}

async function newDoc(): Promise<Pen> {
  const doc = await PDFDocument.create()
  const pen: Pen = {
    doc,
    page: doc.addPage(PAGE),
    y: PAGE[1] - MARGIN,
    body: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
  }
  return pen
}

const applicantLine = (c: Case): string => {
  const a = c.applicant
  return [a.lastName, a.firstName, a.middleName, a.suffix]
    .filter((p) => p && p.trim())
    .join(', ')
    .toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// Continuation sheet — one per form document. Self-linking, so it CANNOT be orphaned.
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * The header repeats EVERY identifier on the questionnaire, because we do not know TDLR's
 * filing convention and OPEN_QUESTIONS Q2 is unresolved. A sheet that gets separated from
 * its form must still be re-attachable by a clerk who has never heard of us.
 */
export async function generateContinuationSheet(
  c: Case,
  plan: PacketPlan,
  doc: PacketDocument,
): Promise<PDFDocument> {
  const pen = await newDoc()
  const incident = doc.incident!
  const charge = doc.charge!

  const which =
    doc.kind === 'continuation' && doc.questionnaire
      ? `Continuation of Item 14 — Questionnaire ${doc.questionnaire.ordinal} of ${doc.questionnaire.total}`
      : 'Continuation of Item 21 — Request Form (ENF006)'

  write(pen, 'CRIMINAL HISTORY QUESTIONNAIRE — CONTINUATION SHEET', { font: pen.bold, size: 12, gap: 6 })
  write(pen, `Applicant: ${applicantLine(c)}`, { font: pen.mono, size: 9 })
  // The SSN is a RULED LINE, not a value. We never write it; the user does, in pen. (D3)
  write(pen, 'SSN: ________________________   (write this in by hand, in pen)', {
    font: pen.mono,
    size: 9,
  })
  write(pen, `License type requested: ${plan.license.specificLicenseType}`, { font: pen.mono, size: 9 })
  write(pen, which, { font: pen.mono, size: 9, gap: 8 })

  rule(pen)

  const rows: [string, string][] = [
    ['County/State of conviction:', `${incident.county}, ${incident.state}`],
    ['Court:', incident.court || 'N/A'],
    ['Date crime committed:', incident.dateCrimeCommitted],
    ['Date of conviction or deferred adjudication:', incident.dateOfConviction],
    ['Exact crime:', charge.exactOffense],
    ['Sentence or action imposed:', charge.sentence],
  ]
  for (const [label, value] of rows) {
    write(pen, `${label}  ${value}`, { font: pen.mono, size: 9 })
  }

  pen.y -= 6
  rule(pen)

  // The narrative — the user's own words. One account per arrest. Nothing added. (L3)
  write(pen, incident.narrative.draft, { size: 11 })

  return pen.doc
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// Mailing checklist — PAGE 1. FOR THE USER. NOT MAILED.
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * Specific to THIS packet, never generic. It enumerates every hand-write location by
 * document and item number, because "sign in all the places" is how a packet comes back
 * rejected. Everything here is read off the PacketPlan — the same object the packet was
 * built from — so it cannot drift.
 */
export async function generateMailingChecklist(
  c: Case,
  plan: PacketPlan,
  allPlans: PacketPlan[],
): Promise<PDFDocument> {
  const pen = await newDoc()
  const trades = allPlans.length
  const totalFee = allPlans.reduce((n, p) => n + p.feeUsd, 0)

  write(pen, 'SUREPATH — MAILING CHECKLIST', { font: pen.bold, size: 16 })
  write(pen, 'THIS PAGE IS FOR YOU. DO NOT MAIL IT.', { font: pen.bold, size: 11, gap: 4 })
  write(pen, `Packet for: ${applicantLine(c)}`, { font: pen.mono, size: 10 })
  write(
    pen,
    `Packet: ${plan.license.specificLicenseType} (${plan.license.program}). ` +
      `${plan.chargeCount} record(s) across ${plan.incidentCount} incident(s).`,
    { size: 10, gap: 10 },
  )
  rule(pen)

  const ssn = plan.handwrite.filter((h) => h.what === 'ssn')
  const sigs = plan.handwrite.filter((h) => h.what === 'signature')

  // ── SSN ─────────────────────────────────────────────────────────────────────────────────
  write(
    pen,
    `[ ] Write your Social Security Number by hand, in pen, in ALL ${ssn.length} places:`,
    { font: pen.bold, size: 11, gap: 2 },
  )
  for (const h of ssn) {
    write(pen, `• ${h.document} — page ${h.page}, item ${h.item}`, { font: pen.mono, size: 9, indent: 18 })
  }
  write(
    pen,
    'Make sure it is the same number every time. Do not leave any of them blank — TDLR will ' +
      'not process a request with blank fields. SurePath never asks for your SSN and never ' +
      'stores it. This is the one thing only you can fill in.',
    { size: 10, indent: 18, gap: 10 },
  )

  // ── Signature + date ────────────────────────────────────────────────────────────────────
  write(pen, `[ ] Sign AND date, in ink, in ALL ${sigs.length} places:`, {
    font: pen.bold,
    size: 11,
    gap: 2,
  })
  for (const h of sigs) {
    write(pen, `• ${h.document} — page ${h.page}, item ${h.item} (sign and date)`, {
      font: pen.mono,
      size: 9,
      indent: 18,
    })
  }
  write(
    pen,
    'The signature and the date are deliberately left blank. A signature has to be yours, in ' +
      'your hand, in ink.',
    { size: 10, indent: 18, gap: 10 },
  )

  // ── Fee (F3) ────────────────────────────────────────────────────────────────────────────
  write(pen, `[ ] Buy a $${plan.feeUsd} cashier's check or money order, payable to TDLR.`, {
    font: pen.bold,
    size: 11,
    gap: 2,
  })
  if (trades > 1) {
    write(
      pen,
      `You selected ${trades} trades. The fee is per license type, so you need ${trades} SEPARATE ` +
        `$${plan.feeUsd} money orders — one per packet — for $${totalFee} in total. One money order ` +
        `for $${totalFee} will not work.`,
      { size: 10, indent: 18 },
    )
  }
  write(pen, 'DO NOT SEND CASH.', { font: pen.bold, size: 10, indent: 18, gap: 10 })

  // ── Mail (F4) ───────────────────────────────────────────────────────────────────────────
  write(pen, '[ ] Mail it to:', { font: pen.bold, size: 11, gap: 2 })
  write(
    pen,
    'Texas Department of Licensing and Regulation\nP.O. Box 12157\nAustin, TX 78711-2157',
    { font: pen.mono, size: 10, indent: 18, gap: 10 },
  )

  // ── Page count ──────────────────────────────────────────────────────────────────────────
  write(
    pen,
    `[ ] This packet is ${plan.mailedPages} pages, not counting this checklist. Print and mail all ${plan.mailedPages}.`,
    { font: pen.bold, size: 11, gap: 2 },
  )
  // Summarised, not enumerated. Nineteen bullets here would push the two items that actually
  // protect the user — keep a copy, delete the download — onto a second page nobody reads.
  const counts = (kind: PacketDocument['kind']) => plan.documents.filter((d) => d.kind === kind)
  const questionnaires = counts('enf003')
  const sheets = counts('continuation')
  write(
    pen,
    `• ENF006, the request form (2 pages) — it carries your first record\n` +
      `• ${questionnaires.length} Criminal History Questionnaires (1 page each) — one for each of your other records\n` +
      `• ${sheets.length} continuation sheets (1 page each) — your account of what happened, one per questionnaire\n` +
      `Keep them in this order.`,
    { font: pen.mono, size: 9, indent: 18, gap: 10 },
  )

  write(pen, '[ ] Keep a copy. TDLR does not return documents.', { font: pen.bold, size: 11, gap: 10 })

  write(
    pen,
    '[ ] If you are on a shared or public computer: delete the downloaded PDF from your ' +
      'Downloads folder when you are done printing. Clearing your data in SurePath does not ' +
      'reach the file your browser wrote to disk.',
    { font: pen.bold, size: 11, gap: 12 },
  )

  rule(pen)
  write(
    pen,
    `What happens next: TDLR answers within 90 days of receiving a complete request. The letter ` +
      `is advisory — it is not binding on TDLR, and there is no appeal from it. You may apply for ` +
      `the license regardless of what it says. It is only as good as what you disclosed: the real ` +
      `license application runs a full DPS/FBI fingerprint background check, and a conviction left ` +
      `out here will be found there. A new charge between now and then changes everything.`,
    { size: 9.5 },
  )

  return pen.doc
}
