/**
 * PHASE 0 only. A results page for the smoke test — deliberately unstyled beyond legibility.
 * The design system (DESIGN_SYSTEM.md) lands with the shell, not here. Nothing in this file
 * is a precedent for anything.
 */
import { useEffect, useState } from 'react'
import { runSmoke, type SmokeReport } from './smoke'

const MARK: Record<string, string> = { pass: 'PASS', fail: 'FAIL', manual: 'LOOK' }

export default function SmokePage() {
  const [report, setReport] = useState<SmokeReport | null>(null)
  const [crashed, setCrashed] = useState<string | null>(null)

  useEffect(() => {
    runSmoke()
      .then(setReport)
      .catch((e) => setCrashed(e instanceof Error ? `${e.message}\n${e.stack}` : String(e)))
  }, [])

  if (crashed) return <pre className="crash">Smoke run threw:{'\n\n'}{crashed}</pre>
  if (!report) return <p className="wait">Running smoke test…</p>

  const failed = report.checks.filter((c) => c.status === 'fail').length
  const manual = report.checks.filter((c) => c.status === 'manual').length

  return (
    <main>
      <h1>SurePath — Phase 0 smoke test</h1>
      <p className={failed ? 'verdict bad' : 'verdict good'}>
        {failed === 0
          ? `All automated checks green. ${manual} check still needs a human to look at it.`
          : `${failed} check(s) FAILED. Nothing else starts until these are green.`}
      </p>

      <table>
        <tbody>
          {report.checks.map((c) => (
            <tr key={c.id} className={c.status}>
              <td className="mark">{MARK[c.status]}</td>
              <td className="id">{c.id}</td>
              <td>
                <div className="label">{c.label}</div>
                <div className="detail">{c.detail}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Evidence — read off the forms, not off the docs</h2>
      <ul className="evidence">
        {report.evidence.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>

      <h2>Artifacts — open these. Print one.</h2>
      <ul className="artifacts">
        {report.artifacts.map((a) => {
          const url = URL.createObjectURL(a.blob)
          return (
            <li key={a.name}>
              <a href={url} download={a.name}>
                {a.name}
              </a>
              <span> — {a.note}</span>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
