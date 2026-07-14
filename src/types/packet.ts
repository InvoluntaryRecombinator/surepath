/**
 * What the document service emits.
 *
 * The PacketPlan is computed by a PURE function, before a single PDF byte exists. The PDF
 * writer consumes it and the mailing checklist renders from the same object — so the
 * checklist CANNOT drift from the packet. They are not two descriptions of the packet.
 * They are one description, used twice.
 */
import type { Charge, Incident, LicenseSelection } from './case'

export type DocumentKind = 'checklist' | 'enf006' | 'enf003' | 'continuation'

export type PacketDocument = {
  kind: DocumentKind
  /** Human label, exactly as the mailing checklist must name it. */
  label: string
  /** Terse form, for the hand-write bullets: "ENF006", "Questionnaire 3 of 8". A bullet that
   *  wraps onto a second line is a bullet someone's eye skips — and these are the bullets
   *  that keep the packet from being rejected. */
  short: string
  /** ENF003 only: this document is questionnaire `ordinal` of `total`.
   *  ⚠️ With 9 charges, total = 8 — conviction #1 rides on ENF006 and is NOT questionnaire 1. (F1) */
  questionnaire?: { ordinal: number; total: number }
  incidentIndex?: number
  charge?: Charge
  incident?: Incident
  /** Pages this document contributes to the MAILED packet. */
  pages: number
}

/** Every place the user must put a pen on paper. Enumerated BY DOCUMENT AND ITEM NUMBER —
 *  never "in all the places". (D3, L6, and A11 as amended.) */
export type HandwriteLocation = {
  what: 'ssn' | 'signature' | 'date_signed'
  document: string // the label from PacketDocument
  page: number // page within that document
  item: number // the printed item number on the form
}

export type PacketPlan = {
  license: LicenseSelection
  /** In mailed order. The checklist is index 0 and is NOT mailed. */
  documents: PacketDocument[]
  handwrite: HandwriteLocation[]
  /** Pages the user must PRINT AND MAIL. Excludes the checklist. */
  mailedPages: number
  /** Total records in the packet: convictions + deferred adjudications. */
  chargeCount: number
  incidentCount: number
  feeUsd: number
}
