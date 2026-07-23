import type { ReactNode } from 'react'
import { txConfig } from '../state-config/tx'
import { useStateModal } from './stateModalContext'
import { ResumeProgress } from './ResumeProgress'

function Wrap({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-landing pl-14 pr-6 ${className}`}>
      {children}
    </div>
  )
}

function Bar({ width }: { width: string }) {
  return <span className="block h-2 rounded-[1px] bg-paper-border" style={{ width }} />
}

function RecordVisual() {
  return (
    <div className="relative w-[380px] border-[1.5px] border-paper-border bg-paper px-6 pb-6 pt-7 shadow-paper">
      <span className="absolute -top-3 left-3.5 border-[1.5px] border-paper-border bg-paper px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
        Record
      </span>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        {[
          ['Offense', '72%'],
          ['Sentence', '92%'],
          ['County', '56%'],
          ['Year', '32%'],
        ].map(([label, width]) => (
          <div key={label} className="flex flex-col gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-wet">
              {label}
            </span>
            <Bar width={width} />
          </div>
        ))}
      </div>
    </div>
  )
}

function FolderVisual() {
  return (
    <div className="relative h-[190px] w-[360px]">
      <div className="absolute left-0 top-4 h-[122px] w-[62%] border-[1.5px] border-paper-border/45 bg-silica">
        <span className="absolute -top-3 left-3 h-3 w-14 border-[1.5px] border-b-0 border-paper-border/45 bg-silica" />
      </div>
      <div className="absolute right-0 top-[52px] flex h-[122px] w-[64%] items-center gap-3 border-[1.5px] border-paper-border bg-paper px-[18px] shadow-paper">
        <span className="absolute -top-3 left-3 h-3 w-14 border-[1.5px] border-b-0 border-paper-border bg-paper" />
        <span className="flex h-4 w-4 items-center justify-center bg-ink text-[11px] font-bold text-paper">✓</span>
        <Bar width="62%" />
      </div>
    </div>
  )
}

function QuestionVisual() {
  return (
    <div className="flex w-[290px] flex-col gap-[18px] border-[1.5px] border-paper-border bg-paper px-[22px] pb-7 pt-6 shadow-paper">
      <div className="flex gap-[5px]">
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className={`h-3 w-3 border-[1.5px] border-paper-border ${index < 3 ? 'bg-paper-border' : ''}`}
          />
        ))}
      </div>
      <Bar width="100%" />
      <Bar width="74%" />
      <span className="h-9 border-b-[1.5px] border-paper-border" />
    </div>
  )
}

function PacketVisual() {
  return (
    <div className="relative w-[340px] pb-4 pr-4">
      <div className="absolute inset-0 translate-x-4 translate-y-4 border-[1.5px] border-paper-border/30 bg-paper" />
      <div className="absolute inset-0 translate-x-2 translate-y-2 border-[1.5px] border-paper-border/50 bg-paper" />
      <div className="relative border-[1.5px] border-paper-border bg-paper px-[22px] pb-7 pt-6">
        <span className="mb-5 block h-[3px] w-[42%] bg-ink" />
        <span className="absolute right-4 top-4 h-[34px] w-[30px] border-[1.5px] border-dashed border-wet/60" />
        {[70, 54, 62].map((width) => (
          <div key={width} className="mt-3 flex items-center gap-2.5">
            <span className="flex h-[13px] w-[13px] items-center justify-center border-[1.5px] border-paper-border text-[10px] text-ink">
              ✓
            </span>
            <Bar width={`${width}%`} />
          </div>
        ))}
      </div>
    </div>
  )
}

const steps = [
  {
    number: '01',
    title: 'Gather your record',
    body: "Every conviction, the offense, the sentence you received, and the court or county that handled it. It's worth requesting a full copy of your record before you start.",
    note: 'List everything. The license application later runs a full fingerprint check, and anything left out here shows up there.',
    background: 'bg-concrete',
    visual: <RecordVisual />,
  },
  {
    number: '02',
    title: 'Choose your state and trade',
    body: "Pick where you want to work. You'll see which licensed occupations there offer a determination in advance. You can add more than one.",
    background: 'bg-concrete-2',
    visual: <FolderVisual />,
  },
  {
    number: '03',
    title: 'Answer the questions',
    body: 'Identifying information, then your record — and for some incidents, a short account of what happened. You can stop and come back at any point.',
    background: 'bg-concrete-3',
    visual: <QuestionVisual />,
  },
  {
    number: '04',
    title: 'Get your packet',
    body: 'SurePath fills out the forms and assembles everything into one packet, with a checklist and instructions for mailing it. Sign it, stamp it, send it.',
    background: 'bg-concrete-4',
    visual: <PacketVisual />,
  },
]

function ProcessStep({ step, alternate }: { step: (typeof steps)[number]; alternate: boolean }) {
  return (
    <section className={`relative overflow-hidden ${step.background}`}>
      <span
        aria-hidden="true"
        className={`absolute -top-[0.14em] font-display text-[clamp(160px,24vw,320px)] font-black leading-none text-brass/17 ${alternate ? '-right-[0.06em]' : '-left-[0.06em]'}`}
      >
        {step.number}
      </span>
      <Wrap
        className={`relative z-10 flex items-center justify-between gap-[clamp(40px,7vw,110px)] py-[clamp(80px,11vh,120px)] ${alternate ? 'flex-row-reverse' : ''}`}
      >
        <div className="max-w-[58ch] flex-1 basis-[420px]">
          <div className="mb-[18px] flex items-center gap-3.5">
            <span className="rounded-t-[2px] bg-ink px-[11px] pb-[5px] pt-1.5 font-mono text-[15px] font-bold tracking-[0.08em] text-brass">
              {step.number}
            </span>
            <h3 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink">
              {step.title}
            </h3>
          </div>
          <p className="max-w-[52ch] text-[18px] leading-[1.65] text-ink/90">{step.body}</p>
          {step.note && (
            <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.65] text-wet">{step.note}</p>
          )}
        </div>
        <div aria-hidden="true" className="flex basis-[380px] justify-center">
          {step.visual}
        </div>
      </Wrap>
    </section>
  )
}

export function LandingPage() {
  const openStateModal = useStateModal()
  return (
    <>
      <header className="relative overflow-hidden bg-ink">
        <img
          src="/assets/hero.jpg"
          alt="Worn work boots climbing a concrete stairwell toward daylight."
          className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
        />
        <div className="landing-hero-scrim absolute inset-0" aria-hidden="true" />
        <Wrap className="relative z-10 pb-[clamp(96px,13vh,140px)] pt-[clamp(90px,13vh,150px)]">
          <h1 className="max-w-[17ch] font-display text-[clamp(38px,5.6vw,66px)] font-extrabold leading-[1.06] tracking-[-0.015em] text-silica">
            Take the next step toward your licensed career with{' '}
            <span className="text-brass">confidence.</span>
          </h1>
          <p className="mt-[26px] max-w-[50ch] text-[19px] leading-[1.65] text-[#c9cfd4]">
            Many state licensing boards will review your record and tell you where you stand —
            in writing, before you spend a year and a tuition finding out.
          </p>
          <a
            href="#how-it-works"
            className="mt-[34px] inline-flex rounded-[2px] border-[1.5px] border-silica/75 px-[26px] py-[13px] text-[16px] font-semibold text-silica hover:bg-paper/10"
          >
            See how it works
          </a>
          <p className="mt-[30px] max-w-none text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#aeb6bc]">
            Electrical · Cosmetology · HVAC · Inspection · Healthcare
          </p>
        </Wrap>
      </header>

      <div className="bg-silica">
        <section id="how-it-works" aria-label="How SurePath works" className="scroll-mt-4">
          {steps.map((step, index) => (
            <ProcessStep key={step.number} step={step} alternate={index % 2 === 1} />
          ))}
        </section>

        <section className="landing-dark-section relative bg-ink py-[clamp(88px,13vh,150px)]">
          <Wrap>
            <h2 className="mb-[22px] font-display text-[30px] font-extrabold text-silica">
              We don’t decide anything.
            </h2>
            <p className="max-w-[58ch] text-[18px] leading-[1.65] text-[#c9cfd4]">
              The licensing board makes the final call. SurePath helps you ask that board the
              question correctly and receive its answer in writing.
            </p>
          </Wrap>
        </section>

        <section className="relative py-[clamp(72px,10vh,112px)]">
          <Wrap className="grid grid-cols-2 gap-[clamp(40px,6vw,80px)]">
            <div>
              <h3 className="mb-3 font-display text-[20px] font-extrabold text-ink">
                Built for people coming home
              </h3>
              <p className="text-[17px] leading-[1.65] text-wet">
                Use it on your own or with a counselor, caseworker, public defender, or anyone
                helping you move toward a licensed career.
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-display text-[20px] font-extrabold text-ink">
                Your information stays with you
              </h3>
              <p className="text-[17px] leading-[1.65] text-wet">
                Your answers stay on the device you’re using. You can save a progress file and
                return when you are ready.
              </p>
            </div>
          </Wrap>
        </section>

        <section className="relative bg-concrete-4 py-[clamp(72px,10vh,110px)]">
          <Wrap>
            <ResumeProgress config={txConfig} />
          </Wrap>
        </section>
      </div>

      <section className="border-t border-wet/15 bg-paper text-center">
        <div className="mx-auto max-w-landing px-6 py-[clamp(88px,13vh,150px)]">
          <h2 className="mb-11 font-display text-[clamp(36px,5.5vw,60px)] font-extrabold leading-[1.05] tracking-[-0.015em] text-ink">
            Find out where you stand.
          </h2>
          <button
            type="button"
            onClick={openStateModal}
            className="inline-flex cursor-pointer rounded-[2px] border-[1.5px] border-ink bg-brass px-[46px] py-[17px] text-[17px] font-bold tracking-[0.01em] text-ink shadow-[4px_4px_0_#16191d] transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_#16191d]"
          >
            Find your state
          </button>
        </div>
      </section>
    </>
  )
}
