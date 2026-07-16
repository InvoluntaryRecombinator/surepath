/**
 * The section intro block — the what and the why, clearly partitioned at the top of each
 * section on its own surface (the Klaviyo-reference "info area"). Static copy from the
 * state config. Calm: a title, a lead, at most a few points that must not be missed.
 */
import type { SectionDef } from '../state-config/types'

export function SectionIntro({ section }: { section: SectionDef }) {
  const { intro } = section
  return (
    <header className="rounded-[6px] border border-line bg-surface px-7 py-6">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
        {intro.title}
      </h1>
      <p className="mt-2 max-w-[58ch] text-[15px] leading-relaxed text-ink/80">{intro.lead}</p>
      {intro.points && (
        <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4">
          {intro.points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[13.5px] leading-relaxed text-muted">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
