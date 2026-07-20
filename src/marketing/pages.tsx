/**
 * Marketing pages — stubs (heading + a line) except for the CTAs that make the flow
 * walkable. Real content lands in Phase 6. No invented facts; no outcome language (L1).
 */
import { Link } from 'react-router-dom'

function Page({ title, line, children }: { title: string; line: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-8 pb-20 pt-14">
      <h1 className="max-w-[22ch] text-[38px] font-extrabold leading-[1.15] tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-ink/80">{line}</p>
      {children}
    </div>
  )
}

const cta =
  'mt-8 inline-flex h-12 items-center rounded-[4px] bg-accent px-6 text-[15.5px] font-semibold text-field transition-opacity duration-150 hover:opacity-92'

export const Landing = () => (
  <Page
    title="Find out where you stand — before you spend years getting there."
    line="Texas will review your criminal history and answer in writing before you enroll in training for a licensed trade. SurePath helps you ask — a complete, correct request packet, assembled with you, ready to mail."
  >
    <Link to="/texas" className={cta}>
      Start in Texas
    </Link>
  </Page>
)

export const About = () => (
  <Page
    title="About SurePath"
    line="SurePath is a document-preparation tool for people with a criminal record who want to work in a licensed trade. It is not a lawyer and never predicts what a licensing board will decide."
  />
)

export const Faq = () => (
  <Page
    title="Questions"
    line="The full FAQ lands here — including the state's own published answers, cited and linked."
  />
)

export const States = () => (
  <Page
    title="Where it works"
    line="Texas is live today. Other states with a pre-application review process are on the way."
  >
    <Link to="/texas" className={cta}>
      Texas — start here
    </Link>
  </Page>
)
