/**
 * The section briefing — a separate ZONE, not a headline floating over the form.
 *
 * Full-bleed tinted band between the header bar and the sheet: eyebrow in tracked caps,
 * a headline that adds meaning (the rail already says where you are), a calm instructional
 * lead, and a 2px seal closing it off — the heaviest line on the page, above the 1px
 * component borders and the 60% hairlines. Explanation above the seal; work below it.
 */
import type { SectionDef } from '../state-config/types'

export function SectionBriefing({
  section,
  index,
  total,
}: {
  section: SectionDef
  index: number
  total: number
}) {
  const { intro } = section
  return (
    <div className="border-b-2 border-line bg-ground/60 px-14 pb-8 pt-8">
      <div className="max-w-[760px]">
        <p className="text-[11.5px] font-semibold uppercase text-muted">
          Step {index + 1} of {total} · {intro.eyebrow}
        </p>
        <h1 className="mt-2.5 text-[28px] font-bold leading-[1.2] text-ink">
          {intro.title}
        </h1>
        <p className="mt-3.5 max-w-[68ch] text-[15px] leading-[1.65] text-ink/75">
          {intro.lead}
        </p>
        {intro.points && (
          <ul className="mt-4 flex flex-col gap-1.5">
            {intro.points.map((p) => (
              <li key={p} className="flex gap-2.5 text-[13.5px] leading-relaxed text-muted">
                <span
                  className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-accent/70"
                  aria-hidden="true"
                />
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
