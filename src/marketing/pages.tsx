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


const aboutEyebrow =
  'font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-brass'

const aboutBody = 'max-w-[68ch] text-[17px] leading-[1.75] text-ink/80'

export const About = () => (
  <div className="bg-silica">
    <section className="bg-wet text-silica">
      <div className="mx-auto max-w-[1100px] px-6 py-16 sm:px-8 lg:px-14 lg:py-20">
        <p className={aboutEyebrow}>About</p>
        <h1
          className="mt-4 max-w-[19ch] font-display text-[44px] font-extrabold leading-[1.04] tracking-[-0.04em] text-brass lg:text-[56px]"
          style={{ textShadow: '2px 2px 0 rgb(22 25 29 / 55%)' }}
        >
          Why SurePath exists
        </h1>
      </div>
    </section>

    <div className="mx-auto max-w-[900px] px-6 sm:px-8 lg:px-14">
      <section className="py-14 lg:py-16">
        <div className={`${aboutBody} space-y-5`}>
          <p>
            Most people with a record don't get turned down for a licensed trade. They never
            apply.
          </p>
          <p>
            The reason is a paradox. You can't find out whether your history disqualifies you
            until the board reviews it, and the board won't review it until you apply — which
            means finishing the training first. The hours, the tuition, the exam fees. The
            answer comes after the money is gone.
          </p>
          <p>
            So people make the safe choice, which is not to start. Not because anyone told them
            no, but because nobody would tell them anything.
          </p>
        </div>
      </section>

      <section className="border-t border-wet/25 py-12 lg:py-14">
        <p className={aboutEyebrow}>What's in the way</p>
        <div className={`${aboutBody} mt-5 space-y-5`}>
          <p>
            Texas will review your record and answer you in writing, before you enroll in
            anything, for ten dollars. That pathway has existed for years and almost nobody
            uses it.
          </p>
          <p>
            What's in the way is paperwork. A request form, then a separate questionnaire for
            every conviction and deferred adjudication. A written account of what happened for
            each one. A money order. An envelope. Leave a box blank and the whole thing comes
            back unprocessed, without telling you which box.
          </p>
          <p>The state built the door. It just left it hard to open.</p>
        </div>
      </section>

      <section className="border-t border-wet/25 py-12 lg:py-14">
        <p className={aboutEyebrow}>What SurePath does</p>
        <p className={`${aboutBody} mt-5`}>
          It fills out the forms, assembles your packet, and tells you exactly where to sign and
          where to mail it. One packet per license you want reviewed, ready to print and send.
        </p>
      </section>

      <section className="border-t border-wet/25 py-12 lg:py-14">
        <p className={aboutEyebrow}>What it won't do</p>
        <div className={`${aboutBody} mt-5 space-y-5`}>
          <p>
            SurePath can't tell you whether you'll be approved — but it will help you get an
            official answer from the board that can.
          </p>
          <p>
            It can't write your story without you, either. What it does is ask the questions
            that draw it out — what happened, what's changed since, what you did to make things
            right — so the things a board actually weighs make it onto the page instead of
            getting left off. Nothing is added that you didn't say. The words stay yours, and
            you can edit every line before it goes in your packet.
          </p>
          <p>
            And it never submits anything on your behalf. You print it, sign it in ink, and mail
            it yourself.
          </p>
        </div>
      </section>

      <section className="border-t border-wet/25 py-12 lg:py-14">
        <p className={aboutEyebrow}>Your information</p>
        <p className={`${aboutBody} mt-5`}>
          There's no account and nothing to sign up for. Your name, your address, and your record
          stay in your browser. We never ask for your Social Security number at all — you write
          that in by hand, in pen, on the printed forms. Your progress saves to your own
          computer, and you can delete it whenever you want.
        </p>
      </section>

      <section className="border-t border-wet/25 py-12 lg:py-14">
        <p className={aboutEyebrow}>Where it works</p>
        <p className={`${aboutBody} mt-5`}>
          Texas today. Several other states run similar programs, each with its own board and its
          own forms, and each one is real work to get right.
        </p>
      </section>
    </div>
  </div>
)

export const Faq = () => (
  <Page
    title="Questions"
    line="The full FAQ lands here — including the state's own published answers, cited and linked."
  />
)
