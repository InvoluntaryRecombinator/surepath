import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import catalog from '../../../data/states/texas/tx_licenses.json'
import links from '../../../data/states/texas/tdlr_links.json'

const fee = links.tdlr.fee_usd
const days = links.tdlr.turnaround_days

const infoLink =
  'font-semibold text-link underline decoration-link/45 underline-offset-4 transition-colors hover:decoration-link'

function Wrap({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1100px] px-6 sm:px-8 lg:px-14 ${className}`}>{children}</div>
}

function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <p
      className={`font-mono text-[12px] font-bold uppercase tracking-[0.14em] ${
        light ? 'text-rail-muted' : 'text-wet'
      }`}
    >
      {children}
    </p>
  )
}

function SectionHeading({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <h2
      className={`mt-2 font-display text-[30px] font-extrabold leading-[1.14] tracking-[-0.025em] ${
        light ? 'text-silica' : 'text-ink'
      }`}
    >
      {children}
    </h2>
  )
}

export function TexasPage() {
  const facts = [
    {
      term: `$${fee} per evaluation`,
      detail:
        'Each license you ask TDLR to consider requires its own request and $10 cashier’s check or money order.',
    },
    {
      term: `${days} days`,
      detail: 'TDLR answers within 90 days of receiving a complete request.',
    },
    {
      term: 'Advisory',
      detail:
        'TDLR uses the same criminal-history guidelines it uses for an application. The letter is not binding, and its view may change if circumstances, information, or policy changes.',
    },
  ]

  const steps = [
    'List every conviction and every deferred adjudication — including every misdemeanor, no matter how old. There is no cutoff year.',
    'Write a short account of what happened and why for each incident, in your own words. Set aside real time for this part.',
    'Expect the real license application to run a full DPS/FBI fingerprint check. Anything omitted here can make the letter unusable.',
    'Plan on about an hour with your record in front of you. Your progress remains on your computer, so you can stop and return.',
  ]

  return (
    <div className="bg-silica">
      <section className="bg-wet text-silica">
        <Wrap className="py-16 lg:py-20">
          <Eyebrow light>Texas · TDLR</Eyebrow>
          <h1
            className="mt-4 max-w-[19ch] font-display text-[44px] font-extrabold leading-[1.04] tracking-[-0.04em] text-brass lg:text-[56px]"
            style={{ textShadow: '2px 2px 0 rgb(22 25 29 / 55%)' }}
          >
            What to know before you begin in Texas.
          </h1>
          <p className="mt-6 max-w-[64ch] text-[17px] leading-[1.7] text-silica/80">
            Texas law lets anyone ask the Texas Department of Licensing and Regulation to
            review their criminal history and answer in writing before enrolling in
            training. TDLR calls the answer a Criminal History Evaluation Letter. SurePath
            helps you assemble the request packet completely, correctly, and ready to mail.
          </p>

          <dl className="mt-10 grid max-w-[920px] grid-cols-1 gap-4 sm:grid-cols-3">
            {facts.map(({ term, detail }) => (
              <div
                key={term}
                className="rounded-[3px] border border-brass bg-silica px-5 py-5 text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-action-hover"
              >
                <dt className="font-display text-[17px] font-extrabold">{term}</dt>
                <dd className="mt-2 text-[13.5px] leading-relaxed text-muted">{detail}</dd>
              </div>
            ))}
          </dl>
        </Wrap>
      </section>

      <section className="bg-silica">
        <Wrap className="py-16 lg:py-[76px]">
          <Eyebrow>Before you begin</Eyebrow>
          <SectionHeading>Check that TDLR licenses your trade</SectionHeading>
          <p className="mt-4 max-w-[66ch] text-[16px] leading-relaxed text-ink/75">
            This process covers only the trades TDLR licenses. If your trade belongs to a
            different board, that board has its own process and forms—and work completed
            here would go to the wrong agency.
          </p>

          <div className="mt-9">
            <div>
              <ul
                aria-label="Trades supported by this process"
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {catalog.programs.map((program) => (
                  <li
                    key={program.program}
                    className="flex min-h-[74px] flex-col justify-center rounded-[4px] border border-carbon bg-paper px-4 py-3"
                  >
                    <span className="text-[14px] font-semibold leading-snug text-ink">
                      {program.program}
                    </span>
                    <span className="mt-1 text-[11.5px] leading-snug text-muted">
                      {program.examples.slice(0, 3).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 max-w-[68ch] text-[13.5px] leading-relaxed text-muted">
                Don’t see your trade? We may simply not have it listed. Check{' '}
                <a
                  href={links.tdlr.chel_page.url}
                  target="_blank"
                  rel="noreferrer"
                  className={infoLink}
                >
                  TDLR’s current information ↗
                </a>{' '}
                before deciding this process is not for you.
              </p>
            </div>

            <aside className="mt-8 rounded-[4px] border border-wet/25 bg-concrete px-7 py-7 text-center">
              <h3 className="font-display text-[18px] font-extrabold text-ink">
                Licensed by a different board
              </h3>
              <p className="mx-auto mt-2 max-w-[28ch] text-[13px] leading-relaxed text-muted">
                These common occupations use a different Texas agency and process.
              </p>
              <ul className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                {catalog.other_boards.entries.slice(0, 6).map((entry) => (
                  <li key={entry.occupation} className="text-center text-[13.5px] leading-snug">
                    <span className="font-semibold text-ink">{entry.occupation}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">{entry.board}</span>
                  </li>
                ))}
              </ul>
              <p className="mx-auto mt-5 max-w-[48ch] text-[12.5px] leading-relaxed text-muted">
                SurePath does not support those review processes yet.
              </p>
            </aside>
          </div>
        </Wrap>
      </section>

      <section className="bg-wet text-silica">
        <Wrap className="py-16 lg:py-[76px]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <Eyebrow light>What this involves</Eyebrow>
              <SectionHeading light>Your entire record, honestly told</SectionHeading>
              <ul className="mt-7 flex max-w-[68ch] flex-col gap-4 text-[15.5px] leading-relaxed text-silica/85">
                {steps.map((step) => (
                  <li key={step.slice(0, 28)} className="flex gap-3.5">
                    <span
                      className="mt-[11px] h-1.5 w-1.5 shrink-0 bg-brass"
                      aria-hidden="true"
                    />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="flex min-h-[270px] flex-col justify-center rounded-[3px] border border-brass bg-silica px-7 py-7 text-center text-ink shadow-action">
              <p className="font-display text-[18px] font-extrabold leading-snug">
                Expunged or sealed records
              </p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                {links.expungement_and_nondisclosure.surepath_copy}
              </p>
              <p className="mt-3 text-[13.5px] font-semibold leading-relaxed text-ink/80">
                We will never leave one out for you, and we will never tell you to leave
                one out.
              </p>
            </aside>
          </div>
        </Wrap>
      </section>

      <section className="bg-silica">
        <Wrap className="py-16 lg:py-[76px]">
          <Eyebrow>Get your record first</Eyebrow>
          <SectionHeading>Two ways to see your Texas history</SectionHeading>
          <p className="mt-4 max-w-[66ch] text-[16px] leading-relaxed text-ink/75">
            Working from your official history is how a packet ends up complete. Texas
            offers two paths with different cost, speed, and completeness. Which one fits
            is your call.
          </p>

          <div className="mt-8 grid max-w-[900px] grid-cols-1 gap-5 sm:grid-cols-2">
            <article className="rounded-[4px] border border-carbon bg-paper px-6 py-6">
              <h3 className="font-display text-[18px] font-extrabold text-ink">
                Fingerprint personal review
              </h3>
              <dl className="mt-4 flex flex-col gap-2 text-[13.5px] leading-relaxed">
                <div>
                  <dt className="inline font-semibold text-ink">Cost: </dt>
                  <dd className="inline text-muted">
                    ${links.get_your_record.fingerprint_personal_review.cost_usd} (
                    {links.get_your_record.fingerprint_personal_review.cost_breakdown})
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Time: </dt>
                  <dd className="inline text-muted">
                    {links.get_your_record.fingerprint_personal_review.turnaround}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Shows: </dt>
                  <dd className="inline text-muted">
                    {links.get_your_record.fingerprint_personal_review.shows}
                  </dd>
                </div>
              </dl>
              <a
                href={links.get_your_record.fingerprint_personal_review.url}
                target="_blank"
                rel="noreferrer"
                className={`mt-4 inline-block text-[13px] ${infoLink}`}
              >
                Texas DPS personal review (IdentoGO) ↗
              </a>
            </article>

            <article className="rounded-[4px] border border-carbon bg-paper px-6 py-6">
              <h3 className="font-display text-[18px] font-extrabold text-ink">
                Name-based search
              </h3>
              <dl className="mt-4 flex flex-col gap-2 text-[13.5px] leading-relaxed">
                <div>
                  <dt className="inline font-semibold text-ink">Cost: </dt>
                  <dd className="inline text-muted">
                    ${links.get_your_record.name_based_search.cost_usd}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Time: </dt>
                  <dd className="inline text-muted">
                    {links.get_your_record.name_based_search.turnaround}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Shows: </dt>
                  <dd className="inline text-muted">
                    {links.get_your_record.name_based_search.shows}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
                {links.get_your_record.name_based_search.accuracy_note}
              </p>
            </article>
          </div>

          <div className="mt-7 grid max-w-[900px] grid-cols-1 gap-5 text-[13.5px] leading-relaxed text-muted sm:grid-cols-2">
            <p>
              <span className="font-semibold text-ink">Out-of-state or federal records:</span>{' '}
              the Texas record shows Texas. TDLR requires in-state, out-of-state, and federal
              offenses. An{' '}
              <a
                href={links.get_your_record.out_of_state_and_federal.url}
                target="_blank"
                rel="noreferrer"
                className={infoLink}
              >
                FBI Identity History Summary ↗
              </a>{' '}
              covers the rest.
            </p>
            <p>
              <span className="font-semibold text-ink">Can’t remember a court or date?</span>{' '}
              TDLR suggests the county clerk for misdemeanors or district clerk for felonies
              in the county where it happened.
            </p>
          </div>

          <p className="mt-8 max-w-[900px] rounded-[4px] border border-wet/20 bg-concrete px-6 py-5 text-[15px] leading-relaxed text-ink/80">
            <span className="font-semibold text-ink">The report is a starting point, not the final word.</span>{' '}
            If you remember a conviction that is not on it, include it anyway. You can start
            from memory, save, and reconcile against the report when it arrives.
          </p>
        </Wrap>
      </section>

      <section className="bg-concrete">
        <Wrap className="flex flex-col items-start gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-[24px] font-extrabold text-ink">
              Ready to build your request?
            </p>
            <p className="mt-1 text-[13.5px] text-muted">
              Nothing leaves your computer. Stop any time and return to your saved progress.
            </p>
          </div>
          <Link
            to="/texas/apply"
            className="inline-flex h-12 shrink-0 items-center rounded-[2px] border-[1.5px] border-ink bg-brass px-[30px] text-[15.5px] font-bold tracking-[0.01em] text-ink shadow-action transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-action-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Begin my request packet
          </Link>
        </Wrap>
      </section>
    </div>
  )
}
