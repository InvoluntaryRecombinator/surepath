import type { CSSProperties, ReactNode } from 'react'
import { ArrowDown } from 'lucide-react'
import scissorsIcon from '../../assets/trade-svg/scissors-svgrepo-com.svg'
import truckIcon from '../../assets/trade-svg/truck-svgrepo-com.svg'
import toolsIcon from '../../assets/trade-svg/wrench-hammer-svgrepo-com.svg'
import { useStateModal } from './stateModalContext'

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
    <div className="relative -translate-x-2 w-[285px] border-[1.5px] border-paper-border bg-paper px-6 pb-6 pt-7 shadow-paper">
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

function TradeChoiceVisual() {
  const choices = [
    { src: toolsIcon, className: 'translate-y-3' },
    { src: scissorsIcon, className: '-translate-y-2' },
    { src: truckIcon, className: 'translate-y-3' },
  ]

  return (
    <div className="relative isolate flex h-[190px] w-[380px] items-center justify-center gap-4">
      {choices.map((choice, index) => (
        <div
          key={choice.src}
          className={`relative flex h-[126px] w-[106px] flex-col items-center justify-center border-[1.5px] border-paper-border bg-paper px-5 shadow-paper ${choice.className}`}
        >
          <img
            src={choice.src}
            alt=""
            className="h-[58px] w-[58px] object-contain opacity-85 brightness-0"
          />
          <span
            className="mt-4 block h-[3px] bg-paper-border"
            style={{ width: `${50 + index * 8}%` }}
          />
        </div>
      ))}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[108px] w-[308px] -translate-x-1/2 -translate-y-1/2 bg-brass/[0.08]" />
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

function FormPencilVisual() {
  return (
    <div className="relative flex h-[190px] w-[300px] items-center justify-center">
      <img
        src="/assets/step3-form-pencil.png"
        alt=""
        className="absolute h-[178px] w-[178px] translate-x-2 translate-y-2 object-contain opacity-15 brightness-0"
      />
      <img
        src="/assets/step3-form-pencil.png"
        alt=""
        className="relative h-[178px] w-[178px] object-contain brightness-0"
      />
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

const USA_MASK_STYLE: CSSProperties = {
  WebkitMaskImage: 'url("/assets/usa-silhouette.svg")',
  maskImage: 'url("/assets/usa-silhouette.svg")',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
}

function FindStateMapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Choose your state"
      className="group relative left-[10px] mt-1 inline-flex aspect-[675/419] w-[min(320px,85vw)] cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none transition-transform duration-150 hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] focus-visible:border-transparent focus-visible:shadow-none"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-ink opacity-0 transition-opacity duration-150 group-focus-visible:opacity-100"
        style={USA_MASK_STYLE}
      />
      <span
        aria-hidden="true"
        className="absolute inset-2 translate-x-[5px] translate-y-[5px] bg-ink transition-transform duration-150 group-hover:translate-x-[7px] group-hover:translate-y-[7px] group-active:translate-x-[3px] group-active:translate-y-[3px]"
        style={USA_MASK_STYLE}
      />
      <span
        aria-hidden="true"
        className="absolute inset-2 bg-brass [filter:drop-shadow(1px_0_0_#16191d)_drop-shadow(-1px_0_0_#16191d)_drop-shadow(0_1px_0_#16191d)_drop-shadow(0_-1px_0_#16191d)]"
        style={USA_MASK_STYLE}
      />
    </button>
  )
}

const steps = [
  {
    number: '01',
    title: 'Gather your record',
    body: "For most cases you'll need every conviction — the offense, the sentence, and the court or county that handled it. This has to be accurate, so it's worth requesting a full copy of your record before you start. Most states have an official source for it, and we'll point you to the right one as you go.",
    background: 'bg-concrete',
    visual: <RecordVisual />,
  },
  {
    number: '02',
    title: 'Choose your state and trade',
    body: "Pick where you want to work. You'll see which licensed occupations there offer a determination in advance. You can add more than one.",
    background: 'bg-concrete-2',
    visual: <TradeChoiceVisual />,
  },
  {
    number: '03',
    title: 'Answer the questions',
    body: "You'll provide your identifying information, the details of your criminal history, and — in most cases — a short personal account of what happened in each incident and why. You can stop and come back at any point.",
    background: 'bg-concrete-3',
    visual: <FormPencilVisual />,
    previousVisual: <QuestionVisual />,
  },
  {
    number: '04',
    title: 'Get your packet',
    body: 'SurePath fills out the forms and assembles your information into a print-ready packet for each licensed occupation you want evaluated. Every packet includes a checklist with the specific instructions for mailing it. Sign it, stamp it, send it.',
    background: 'bg-concrete-4',
    visual: <PacketVisual />,
  },
]

function ProcessStep({ step, alternate }: { step: (typeof steps)[number]; alternate: boolean }) {
  return (
    <section className={`relative overflow-hidden ${step.background}`}>
      <Wrap
        className={`relative z-10 flex items-center justify-between gap-[clamp(40px,7vw,110px)] py-[clamp(80px,11vh,120px)] ${alternate ? 'flex-row-reverse' : ''}`}
      >
        <div className="max-w-[58ch] flex-1 basis-[420px]">
          <div className="mb-[18px] flex items-center gap-3.5">
            <span className="inline-flex h-11 min-w-[52px] items-center justify-center rounded-t-[2px] bg-ink px-3 font-mono text-[18px] font-bold tracking-[0.08em] text-brass">
              {step.number}
            </span>
            <h3 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink">
              {step.title}
            </h3>
          </div>
          <p className="max-w-[52ch] text-[18px] leading-[1.65] text-ink/90">{step.body}</p>
        </div>
        <div aria-hidden="true" className="relative flex basis-[380px] justify-center">
          <span
            className={`pointer-events-none absolute top-1/2 z-0 -translate-y-1/2 font-display text-[clamp(160px,15vw,220px)] font-black leading-none text-brass/[0.12] ${step.number === '01' ? '-right-[47px]' : step.number === '03' ? '-right-8' : alternate ? '-left-[clamp(92px,10vw,140px)] translate-x-[8px]' : '-right-[clamp(92px,10vw,140px)]'}`}
          >
            {Number(step.number)}
          </span>
          <div className="relative z-10">{step.visual}</div>
        </div>
      </Wrap>
    </section>
  )
}

export function LandingPage() {
  const openStateModal = useStateModal()
  return (
    <>
      <header className="relative overflow-hidden bg-concrete">
        <div className="landing-hero-media absolute inset-0">
          <img
            src="/assets/hero.jpg"
            alt="Worn work boots climbing a concrete stairwell toward daylight."
            className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
          />
          <div className="landing-hero-scrim absolute inset-0" aria-hidden="true" />
        </div>
        <Wrap className="relative z-10 pb-[clamp(96px,13vh,140px)] pt-[clamp(90px,13vh,150px)]">
          <h1 className="max-w-[17ch] font-display text-[clamp(38px,5.6vw,66px)] font-extrabold leading-[1.06] tracking-[-0.015em] text-silica">
            Take the next step toward your licensed career with{' '}
            <span className="text-brass">confidence.</span>
          </h1>
          <p className="mt-[26px] max-w-[50ch] text-[19px] leading-[1.65] text-[#c9cfd4]">
            Many state licensing boards will review your record and tell you where you stand —
            in writing, before you spend a dollar on training.
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

        <section className="relative bg-ink">
          <Wrap className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-stretch gap-[clamp(44px,6vw,84px)] py-[clamp(48px,6vh,64px)]">
            <div>
              <h3 className="mb-4 font-display text-[22px] font-extrabold text-brass">
                Built for the next step
              </h3>
              <p className="max-w-[43ch] text-[17px] leading-[1.7] text-[#d8d1c2]">
                Whatever your background looks like, if you're ready to move toward a licensed
                occupation, this tool is meant to help you. Use it on your own or alongside a
                counselor, caseworker, or anyone helping you get there.
              </p>
            </div>
            <span className="w-px self-stretch bg-silica/20" aria-hidden="true" />
            <div>
              <h3 className="mb-4 font-display text-[22px] font-extrabold text-brass">
                We <em className="text-silica">never</em> store your information
              </h3>
              <p className="max-w-[43ch] text-[17px] leading-[1.7] text-[#d8d1c2]">
                No login, nothing to sign up for. Your packet is built on your own machine, in
                your browser, and we never store your personal information or your criminal
                history. You keep the file, and you can save your progress and come back whenever
                you're ready.
              </p>
            </div>
          </Wrap>
        </section>
      </div>

      <section className="border-t border-wet/15 bg-paper text-center">
        <div className="mx-auto max-w-landing px-6 py-[clamp(88px,13vh,150px)]">
          <h2 className="font-display text-[clamp(36px,5.5vw,60px)] font-extrabold leading-[1.05] tracking-[-0.015em] text-ink">
            Find out where you stand.
          </h2>
          <p className="mt-4 text-[17px] font-medium text-wet">
            Choose your state to get started.
          </p>
          <ArrowDown
            aria-hidden="true"
            className="state-cta-arrow text-ink"
            size={28}
            strokeWidth={1.75}
          />
          <FindStateMapButton onClick={openStateModal} />
        </div>
      </section>
    </>
  )
}
