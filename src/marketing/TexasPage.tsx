/**
 * /texas — the state intro, and the two gates that now live here instead of inside the app:
 *
 *   1. The COVERAGE gate (A14): the trades TDLR licenses, the trades other boards license,
 *      and an honest "we don't know" for everything else — before any data entry.
 *   2. The GET-YOUR-RECORD guidance (L9): both record paths presented FLAT — cost, time,
 *      what each shows, DPS's own accuracy warning — with no thumb on the scale and no
 *      lock. The mitigation is the reframe, never a gate.
 *
 * Copy register: plain, calm, instructional. Facts come from data/ (single source);
 * program names carry verify:false until checked against the live TDLR site.
 */
import { Link } from 'react-router-dom'
import catalog from '../../data/tx_licenses.json'
import links from '../../data/tdlr_links.json'

const fee = links.tdlr.fee_usd
const days = links.tdlr.turnaround_days

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </p>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[22px] font-bold leading-snug tracking-[-0.01em] text-ink">{children}</h2>
}

export function TexasPage() {
  const demo = catalog.programs.filter((p) => 'demo' in p && p.demo)
  const rest = catalog.programs.filter((p) => !('demo' in p && p.demo))

  return (
    <div className="mx-auto max-w-5xl px-8 pb-24 pt-14">
      {/* ── hero ─────────────────────────────────────────────────────────────────────── */}
      <Eyebrow>Texas · TDLR</Eyebrow>
      <h1 className="mt-3 max-w-[24ch] text-[34px] font-extrabold leading-[1.15] tracking-tight text-ink">
        Ask the licensing board about your record — before you commit years to a trade.
      </h1>
      <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-ink/80">
        Texas law lets anyone ask the Texas Department of Licensing and Regulation to review
        their criminal history and answer in writing, before enrolling in any training. TDLR
        calls the answer a Criminal History Evaluation Letter. SurePath helps you assemble
        the request packet, completely and correctly, and mail it.
      </p>

      <dl className="mt-8 grid max-w-[720px] grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          [`$${fee} per license type`, 'Cashier’s check or money order — TDLR does not take cash.'],
          [`${days} days`, 'TDLR answers within 90 days of receiving a complete request.'],
          ['Advisory', 'The letter is not binding, and asking forecloses nothing — you can apply for the license either way.'],
        ].map(([term, detail]) => (
          <div key={term} className="rounded-[8px] border border-line bg-surface px-5 py-4">
            <dt className="text-[15px] font-bold text-ink">{term}</dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-muted">{detail}</dd>
          </div>
        ))}
      </dl>

      {/* ── the coverage gate (A14) ──────────────────────────────────────────────────── */}
      <section className="mt-16 border-t-2 border-line pt-10">
        <Eyebrow>Before you begin</Eyebrow>
        <SectionHeading>Check that TDLR licenses your trade</SectionHeading>
        <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink/80">
          This process covers only the trades TDLR licenses. If your trade belongs to a
          different board, that board has its own process and its own forms — and an hour of
          work here would go to the wrong agency.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
              Licensed by TDLR — this process applies
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {demo.map((p) => (
                <li
                  key={p.program}
                  className="rounded-[6px] border border-accent/40 bg-surface px-3.5 py-2 text-[14px] font-semibold text-ink"
                >
                  {p.program}
                  <span className="mt-0.5 block text-[12px] font-normal text-muted">
                    {p.examples.slice(0, 3).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {rest.map((p) => (
                <li
                  key={p.program}
                  className="rounded-[6px] border border-line bg-surface px-3 py-1.5 text-[13px] text-ink/85"
                >
                  {p.program}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              Don’t see your trade? We may simply not have it listed — check{' '}
              <a
                href={links.tdlr.chel_page.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent hover:underline"
              >
                TDLR’s site ↗
              </a>{' '}
              before deciding this isn’t for you.
            </p>
          </div>

          <aside className="h-fit rounded-[8px] border border-line bg-ground px-5 py-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
              Licensed by a different board
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {catalog.other_boards.entries.slice(0, 6).map((e) => (
                <li key={e.occupation} className="text-[13.5px] leading-snug">
                  <span className="font-semibold text-ink">{e.occupation}</span>
                  <span className="block text-muted">{e.board}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
              Those boards run their own review processes. SurePath doesn’t support them yet.
            </p>
          </aside>
        </div>
      </section>

      {/* ── what this involves ───────────────────────────────────────────────────────── */}
      <section className="mt-16 border-t-2 border-line pt-10">
        <Eyebrow>What this involves</Eyebrow>
        <SectionHeading>Your entire record, honestly told</SectionHeading>
        <ul className="mt-4 flex max-w-[68ch] flex-col gap-2.5 text-[15px] leading-relaxed text-ink/80">
          {[
            'You will list every conviction and every deferred adjudication — every misdemeanor included, no matter how old. There is no cutoff year. TDLR requires the full history.',
            'For each incident, you will write a short account of what happened and why, in your own words. That part is hard. Set aside real time for it.',
            'The real license application later runs a full DPS/FBI fingerprint check. Anything left out here gets found there — and makes the letter worthless.',
            'Plan on about an hour with your record in front of you. Your progress stays on your computer as you go, so you can stop and come back.',
          ].map((line) => (
            <li key={line.slice(0, 24)} className="flex gap-3">
              <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-accent/70" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-5 max-w-[68ch] rounded-[8px] border border-line bg-ground px-5 py-4 text-[13.5px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">Expunged or sealed records:</span>{' '}
          {links.expungement_and_nondisclosure.surepath_copy} We will never leave one out for
          you, and we will never tell you to leave one out.
        </p>
      </section>

      {/* ── get your record (L9: flat, no thumb on the scale) ────────────────────────── */}
      <section className="mt-16 border-t-2 border-line pt-10">
        <Eyebrow>Get your record first</Eyebrow>
        <SectionHeading>Two ways to see your Texas history</SectionHeading>
        <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink/80">
          Working from your official history is how a packet ends up complete. Texas offers
          two ways to get it — different cost, different speed, different completeness. Which
          one fits is your call.
        </p>

        <div className="mt-6 grid max-w-[760px] grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[8px] border border-line bg-surface px-5 py-5">
            <h3 className="text-[15px] font-bold text-ink">Fingerprint personal review</h3>
            <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px] leading-relaxed">
              <div><dt className="inline font-semibold text-ink">Cost: </dt><dd className="inline text-muted">${links.get_your_record.fingerprint_personal_review.cost_usd} ({links.get_your_record.fingerprint_personal_review.cost_breakdown})</dd></div>
              <div><dt className="inline font-semibold text-ink">Time: </dt><dd className="inline text-muted">{links.get_your_record.fingerprint_personal_review.turnaround}</dd></div>
              <div><dt className="inline font-semibold text-ink">Shows: </dt><dd className="inline text-muted">{links.get_your_record.fingerprint_personal_review.shows}</dd></div>
            </dl>
            <a
              href={links.get_your_record.fingerprint_personal_review.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[13px] font-medium text-accent hover:underline"
            >
              Texas DPS personal review (IdentoGO) ↗
            </a>
          </div>

          <div className="rounded-[8px] border border-line bg-surface px-5 py-5">
            <h3 className="text-[15px] font-bold text-ink">Name-based search</h3>
            <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px] leading-relaxed">
              <div><dt className="inline font-semibold text-ink">Cost: </dt><dd className="inline text-muted">${links.get_your_record.name_based_search.cost_usd}</dd></div>
              <div><dt className="inline font-semibold text-ink">Time: </dt><dd className="inline text-muted">{links.get_your_record.name_based_search.turnaround}</dd></div>
              <div><dt className="inline font-semibold text-ink">Shows: </dt><dd className="inline text-muted">{links.get_your_record.name_based_search.shows}</dd></div>
            </dl>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
              {links.get_your_record.name_based_search.accuracy_note}
            </p>
          </div>
        </div>

        <div className="mt-5 max-w-[760px] text-[13.5px] leading-relaxed text-muted">
          <p>
            <span className="font-semibold text-ink">Out-of-state or federal records:</span>{' '}
            the Texas record shows Texas. TDLR requires in-state, out-of-state, and federal
            offenses — an{' '}
            <a
              href={links.get_your_record.out_of_state_and_federal.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              FBI Identity History Summary ↗
            </a>{' '}
            covers the rest.
          </p>
          <p className="mt-2">
            <span className="font-semibold text-ink">Can’t remember a court or a date?</span>{' '}
            TDLR suggests the county clerk (misdemeanors) or district clerk (felonies) in the
            county where it happened.
          </p>
        </div>

        <p className="mt-6 max-w-[62ch] border-l-2 border-accent/60 pl-4 text-[15px] leading-relaxed text-ink/85">
          The report is a starting point, not the final word — you know things it doesn’t.
          If you remember a conviction that isn’t on it, put it in anyway. You can start now
          from memory, save, and reconcile against the report when it arrives.
        </p>
      </section>

      {/* ── begin ────────────────────────────────────────────────────────────────────── */}
      <div className="mt-14 flex flex-wrap items-center gap-5 border-t-2 border-line pt-9">
        <Link
          to="/texas/apply"
          className="inline-flex h-12 items-center rounded-[2px] border-[1.5px] border-ink bg-brass px-[30px] text-[15.5px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Begin my request packet
        </Link>
        <p className="text-[13px] leading-snug text-muted">
          Nothing leaves your computer. Stop any time — your progress stays saved here.
        </p>
      </div>
    </div>
  )
}
