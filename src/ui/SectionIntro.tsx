/**
 * The section briefing — the panel's own header. No band, no tint: on a real paper panel,
 * hierarchy comes from type scale and the 2px seal that closes the briefing off from the
 * work below it — the heaviest line on the page, above 1px component borders and the
 * lighter group hairlines. Explanation above the seal; work below it.
 */
import type { SectionDef } from '../state-config/types'

export function SectionBriefing({ section }: { section: SectionDef }) {
  const { intro } = section
  return (
    <header className="mb-10 border-b-2 border-line pb-8">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted">
        {intro.eyebrow}
      </p>
      <h1 className="mt-2.5 text-[28px] font-bold leading-[1.2] tracking-[-0.01em] text-ink">
        {intro.title}
      </h1>
      <p className="mt-3 max-w-[68ch] text-[15px] leading-[1.65] text-ink/75">{intro.lead}</p>
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
    </header>
  )
}
