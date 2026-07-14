/**
 * PHASE 1 dev harness. No design system, no shell, no wizard — this is a button that turns
 * the Marcus Rivera fixture into a mailable packet so a human can PRINT IT AND LOOK AT IT.
 * The real UI starts with the shell. Nothing here is a precedent.
 */
import { useEffect, useState } from 'react'
import { generateAllPackets, type GeneratedPacket } from './documents/assemblePacket'
import { marcusRivera } from './fixtures/marcusRivera'
import { allCharges } from './types/case'

export default function PacketDevPage() {
  const [packets, setPackets] = useState<GeneratedPacket[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ms, setMs] = useState(0)

  useEffect(() => {
    const t0 = performance.now()
    generateAllPackets(marcusRivera)
      .then((p) => {
        setPackets(p)
        setMs(Math.round(performance.now() - t0))
      })
      .catch((e) => setError(e instanceof Error ? `${e.message}\n${e.stack}` : String(e)))
  }, [])

  if (error) return <pre className="crash">Generation threw:{'\n\n'}{error}</pre>
  if (!packets) return <p className="wait">Generating the packet…</p>

  const violations = packets.flatMap((p) => p.violations)
  const charges = allCharges(marcusRivera)

  return (
    <main>
      <h1>SurePath — Phase 1: the document service</h1>
      <p className={violations.length ? 'verdict bad' : 'verdict good'}>
        {violations.length === 0
          ? `Clean. ${packets.length} packet(s) generated in ${ms}ms with zero invariant violations.`
          : `${violations.length} INVARIANT VIOLATION(S). Do not mail this.`}
      </p>

      {violations.length > 0 && (
        <ul className="evidence">
          {violations.map((v, i) => (
            <li key={i}>
              {v.assertion} · {v.field} — {v.detail}
            </li>
          ))}
        </ul>
      )}

      <h2>The fixture</h2>
      <ul className="evidence">
        <li>
          Marcus Rivera · {marcusRivera.incidents.length} incidents · {charges.length} records
          ({charges.filter((c) => c.charge.disposition === 'conviction').length} convictions,{' '}
          {charges.filter((c) => c.charge.disposition === 'deferred_adjudication').length} deferred
          adjudication)
        </li>
        <li>On probation, not on parole. Not a business owner.</li>
        <li>Oldest record: 1998 (the D1 guard — no lookback window, ever).</li>
      </ul>

      {packets.map((p) => (
        <section key={p.filename}>
          <h2>{p.plan.license.specificLicenseType}</h2>
          <ul className="evidence">
            <li>
              1 × ENF006 + {p.plan.documents.filter((d) => d.kind === 'enf003').length} × ENF003 +{' '}
              {p.plan.documents.filter((d) => d.kind === 'continuation').length} continuation sheets
            </li>
            <li>
              {p.plan.mailedPages} pages to mail · ${p.plan.feeUsd} money order ·{' '}
              {p.plan.handwrite.filter((h) => h.what === 'ssn').length} SSN boxes to hand-write ·{' '}
              {p.plan.handwrite.filter((h) => h.what === 'signature').length} signature lines
            </li>
          </ul>
          <p className="artifacts">
            <a href={URL.createObjectURL(new Blob([p.bytes as BlobPart], { type: 'application/pdf' }))} download={p.filename}>
              {p.filename}
            </a>{' '}
            — <strong>print this and look at it.</strong> Page 1 is the checklist and is not
            mailed. Confirm: every SSN box is empty, every signature line is empty, every other
            box has something in it, and Type of Ownership is not ticked.
          </p>
        </section>
      ))}
    </main>
  )
}
