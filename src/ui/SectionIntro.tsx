/**
 * The section intro — the what and the why, set in type at the top of the sheet. No box:
 * on a continuous canvas, hierarchy comes from scale, weight, and the hairline that closes
 * it, not from a border around it. Warm, brief, walks a nervous person in. Deeper detail
 * belongs behind ⓘ bubbles, not here.
 */
import type { SectionDef } from '../state-config/types'

export function SectionIntro({ section }: { section: SectionDef }) {
  const { intro } = section
  return (
    <header className="border-b border-line/60 pb-7">
      <h1 className="text-[25px] font-bold leading-tight tracking-tight text-ink">
        {intro.title}
      </h1>
      <p className="mt-2.5 max-w-[60ch] text-[15px] leading-relaxed text-ink/75">{intro.lead}</p>
      {intro.points && (
        <ul className="mt-3.5 flex flex-col gap-1.5">
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
