/**
 * Derived counts for the counter — the emotional core (DESIGN_SYSTEM §6).
 * The form is infinite. This line is finite. It must never lie (TESTING.md: "the counter
 * lies to the user if this is wrong"), so it derives from the SAME packetPlan the packet
 * itself is built from.
 */
import { FEE_USD } from '../config/flags'
import { buildPacketPlan } from '../documents/packetPlan'
import { allCharges, type Case } from '../types/case'

export type Counts = {
  incidents: number
  /** Convictions + deferred adjudications. All reported. Disposition is never a filter. */
  records: number
  hasDeferrals: boolean
  /** Pages the user will mail, per packet. 0 until there is at least one record. */
  pagesPerPacket: number
  trades: number
  totalFeeUsd: number
}

export function deriveCounts(c: Case): Counts {
  const charges = allCharges(c)
  const trades = c.licenses.length

  // The plan is the packet. If it can be built, the page count comes from it — never from
  // arithmetic duplicated here that could drift.
  const pagesPerPacket =
    charges.length > 0
      ? buildPacketPlan(c, c.licenses[0] ?? { program: '', specificLicenseType: '' }).mailedPages
      : 0

  return {
    incidents: c.incidents.length,
    records: charges.length,
    hasDeferrals: charges.some((x) => x.charge.disposition === 'deferred_adjudication'),
    pagesPerPacket,
    trades,
    totalFeeUsd: FEE_USD * Math.max(trades, 1),
  }
}

/**
 * `3 INCIDENTS · 9 CONVICTIONS & DEFERRALS · 19 PAGES · $10`
 * "CONVICTIONS & DEFERRALS" per the approved Q4 copy — calling a deferred adjudication a
 * conviction is a factual misstatement on the exact screen where the user reconciles
 * against their rap sheet.
 */
export function counterLine(k: Counts): string {
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
  const records = k.hasDeferrals
    ? `${k.records} CONVICTIONS & DEFERRALS`
    : n(k.records, 'CONVICTION', 'CONVICTIONS')
  return [
    n(k.incidents, 'INCIDENT', 'INCIDENTS'),
    records,
    n(k.pagesPerPacket, 'PAGE', 'PAGES'),
    `$${k.totalFeeUsd}`,
  ].join(' · ')
}
