/**
 * Marketing pages — stubs (heading + a line) except for the CTAs that make the flow
 * walkable. Real content lands in Phase 6. No invented facts; no outcome language (L1).
 * NOTE: /states is deliberately gone — "Find your state" opens the StateModal instead.
 */
export { LandingPage as Landing } from './LandingPage'

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

