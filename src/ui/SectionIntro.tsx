/** The section briefing is the shared slate masthead for every apply step. */
import type { SectionDef } from '../state-config/types'

export function SectionBriefing({ section }: { section: SectionDef }) {
  const { intro } = section
  return (
    <header className="bg-wet">
      <div className="mx-auto max-w-[920px] px-6 py-8 sm:px-10 lg:px-12 lg:py-9">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brass">
          {intro.eyebrow}
        </p>
        <h1 className="mt-2.5 text-[28px] font-bold leading-[1.2] tracking-[-0.01em] text-silica">
          {intro.title}
        </h1>
        {intro.lede && (
          <p className="mt-3 max-w-[62ch] text-[16px] font-semibold leading-[1.6] text-silica underline underline-offset-4 decoration-silica/60">
            {intro.lede}
          </p>
        )}
        {intro.lead.split('\n\n').map((para) => (
          <p
            key={para.slice(0, 24)}
            className={`max-w-[68ch] text-[15px] leading-[1.65] text-concrete ${intro.lede ? 'mt-2.5' : 'mt-3'}`}
          >
            {para}
          </p>
        ))}
        {intro.points && (
          <ul className="mt-4 flex flex-col gap-1.5">
            {intro.points.map((p) => (
              <li key={p} className="flex gap-2.5 text-[13.5px] leading-relaxed text-concrete">
                <span
                  className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-concrete"
                  aria-hidden="true"
                />
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  )
}
